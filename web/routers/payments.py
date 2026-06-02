from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import os, requests, logging

import crud, models, schemas
from database import get_db
from auth import require_admin, require_teacher, require_super_admin

log = logging.getLogger("web")

router = APIRouter(tags=["payments"])


@router.post("/api/payments", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db),
                   _=Depends(require_admin)):
    return crud.create_payment(db=db, payment=payment)


@router.get("/api/payments")
def get_payments(
    status: str = None,
    search: str = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    q = db.query(models.Payment)
    if status:
        q = q.filter(models.Payment.status == status)
    if search:
        q = q.join(models.User, models.User.id == models.Payment.student_id, isouter=True).filter(
            models.User.name.ilike(f"%{search}%") | models.Payment.description.ilike(f"%{search}%")
        )
    results = q.order_by(models.Payment.created_at.desc()).limit(300).all()
    out = []
    for p in results:
        student_name = ""
        course_name = ""
        if p.student:
            student_name = p.student.name
        if p.course:
            course_name = p.course.title
        out.append({
            "id": p.id,
            "student_id": p.student_id,
            "student_name": student_name,
            "course_id": p.course_id,
            "course_name": course_name,
            "amount": float(p.amount),
            "currency": p.currency,
            "method": p.method,
            "status": p.status,
            "description": p.description or "",
            "period_month": p.period_month,
            "period_year": p.period_year,
            "created_at": str(p.created_at)[:16] if p.created_at else "",
        })
    return out


@router.get("/api/payments/student/{student_id}")
def student_payments(student_id: int, db: Session = Depends(get_db),
                     _=Depends(require_teacher)):
    return crud.get_student_payments(db, student_id)


@router.get("/api/payments/monthly-revenue")
def monthly_revenue(db: Session = Depends(get_db), _=Depends(require_super_admin)):
    return crud.get_monthly_revenue(db)


@router.patch("/api/payments/{payment_id}/status")
def update_payment_status(
    payment_id: int,
    body: dict,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Платёж не найден")
    new_status = body.get("status", "paid")
    payment.status = new_status
    db.commit()
    db.refresh(payment)

    student = db.query(models.User).filter(models.User.id == payment.student_id).first()
    if student and student.telegram_id:
        bot_token = os.getenv("BOT_TOKEN")
        if bot_token:
            if new_status == "paid":
                msg = f"✅ *Оплата подтверждена!*\n\n💰 Сумма: `{payment.amount:,.0f}` {payment.currency}\n📝 Назначение: {payment.description or 'Оплата обучения'}\n\nСпасибо, что вы с нами!"
            else:
                msg = f"❌ *Ваша оплата отклонена.*\n\n💰 Сумма: `{payment.amount:,.0f}` {payment.currency}\n\nПожалуйста, свяжитесь с администрацией."
            try:
                requests.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json={"chat_id": student.telegram_id, "text": msg, "parse_mode": "Markdown"},
                    timeout=5
                )
            except Exception as e:
                log.warning("Telegram notification failed: %s", e)
    return {"ok": True, "payment_id": payment.id, "status": new_status}
