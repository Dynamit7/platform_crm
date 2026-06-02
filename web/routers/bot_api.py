from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
import os, requests, hashlib, secrets, logging

import crud, models, schemas
from database import get_db
from deps import verify_bot_secret
from auth import get_password_hash

log = logging.getLogger("web")

router = APIRouter(tags=["bot"], dependencies=[Depends(verify_bot_secret)])


@router.post("/api/bot/sync-user")
def sync_bot_user(data: schemas.BotUserSync, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.telegram_id == data.telegram_id).first()

    if not user and data.phone:
        user = db.query(models.User).filter(models.User.phone == data.phone).first()
        if user:
            user.telegram_id = data.telegram_id
            db.commit()

    status_msg = "User already synced"
    if not user:
        user = models.User(
            name=data.name,
            telegram_id=data.telegram_id,
            phone=data.phone,
            email=data.email or f"tg_{data.telegram_id}@bot.local",
            role="student",
            password_hash="",
            registration_source="telegram"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        status_msg = "New user created"

    if data.course_interest:
        course = db.query(models.Course).filter(models.Course.name.ilike(f"%{data.course_interest}%")).first()
        lead = models.Lead(
            name=user.name,
            phone=user.phone or f"TG: {data.telegram_id}",
            course_id=course.id if course else None,
            status="new",
            notes=f"Source: Telegram Bot.\nCourse Interest: {data.course_interest}\nTrial Time: {data.trial_time or 'Не указано'}"
        )
        db.add(lead)
        db.commit()
        status_msg += " and Lead created"

    return {"status": "ok", "user_id": user.id, "message": status_msg}


@router.post("/api/bot/sync-payment")
def sync_bot_payment(data: schemas.BotPaymentSync, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.telegram_id == data.telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    payment = models.Payment(
        student_id=user.id,
        course_id=data.course_id,
        amount=data.amount,
        currency=data.currency,
        method=data.method,
        status="paid",
        description=data.description or "Оплата через Telegram Bot",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return {"status": "ok", "payment_id": payment.id}


@router.post("/api/bot/sync-homework")
def sync_bot_homework(data: schemas.BotHomeworkSync, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.telegram_id == data.telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    hw = db.query(models.Homework).filter(
        models.Homework.title == data.title,
        models.Homework.course_id == data.course_id
    ).first()

    if not hw:
        hw = models.Homework(
            course_id=data.course_id or 1,
            group_id=data.group_id,
            title=data.title,
            description="Загружено через Telegram",
            due_date=datetime.utcnow()
        )
        db.add(hw)
        db.commit()
        db.refresh(hw)

    sub = models.HomeworkSubmission(
        homework_id=hw.id,
        student_id=user.id,
        content=data.content,
        status="submitted"
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return {"status": "ok", "submission_id": sub.id}


@router.get("/api/bot/student/{telegram_id}/schedule")
def get_bot_student_schedule(telegram_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    group_ids = [e.group_id for e in db.query(models.Enrollment).filter(
        models.Enrollment.student_id == user.id,
        models.Enrollment.group_id.isnot(None)
    ).all()]

    if not group_ids:
        return {"status": "ok", "lessons": []}

    lessons = db.query(models.Lesson).filter(
        models.Lesson.group_id.in_(group_ids),
        models.Lesson.scheduled_at >= datetime.utcnow()
    ).order_by(models.Lesson.scheduled_at.asc()).limit(10).all()

    out = []
    for l in lessons:
        out.append({
            "date": l.scheduled_at.strftime("%d.%m.%Y"),
            "time": l.scheduled_at.strftime("%H:%M"),
            "group_name": l.group.name if l.group else "Группа",
            "topic": l.topic or "Занятие",
            "zoom_link": l.zoom_link
        })

    return {"status": "ok", "lessons": out}


@router.post("/api/bot/sync-review")
def sync_bot_review(data: schemas.BotReviewSync, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.telegram_id == data.telegram_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    review = models.Review(
        student_name=user.name,
        text=data.text,
        rating=data.rating
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return {"status": "ok", "review_id": review.id}


@router.post("/api/bot/send-message")
def bot_send_message(data: schemas.BotMessage, db: Session = Depends(get_db)):
    sender = db.query(models.User).filter(models.User.telegram_id == data.sender_tg_id).first()
    receiver = db.query(models.User).filter(models.User.id == data.receiver_id).first()
    if not sender or not receiver:
        raise HTTPException(status_code=404, detail="Sender or receiver not found")
    if not data.content.strip():
        raise HTTPException(status_code=400, detail="Empty message")
    msg = crud.create_message(db, sender_id=sender.id, receiver_id=receiver.id, content=data.content.strip())
    if receiver.telegram_id:
        try:
            crud.send_telegram_notification(
                receiver.telegram_id,
                f"\U0001f4ac *{sender.name}*:\n{data.content.strip()[:200]}"
            )
        except Exception as exc:
            log.warning("Chat notify failed for %s: %s", receiver.telegram_id, exc)
    return {"status": "ok", "message_id": msg.id}


@router.get("/api/bot/messages/{user_id}")
def bot_get_conversation(user_id: int, with_user: int, db: Session = Depends(get_db)):
    msgs = crud.get_messages(db, user_id, with_user)
    crud.mark_messages_read(db, reader_id=user_id, sender_id=with_user)
    return [
        {"id": m.id, "sender_id": m.sender_id, "content": m.content, "created_at": str(m.created_at)[:16]}
        for m in msgs
    ]


@router.get("/api/bot/messages/contacts/{user_id}")
def bot_get_contacts(user_id: int, db: Session = Depends(get_db)):
    return crud.get_chat_contacts(db, user_id)


@router.get("/api/bot/messages/unread/{user_id}")
def bot_get_unread(user_id: int, db: Session = Depends(get_db)):
    return {"unread": crud.get_unread_count(db, user_id)}


@router.get("/api/bot/users/search")
def bot_search_users(q: str = "", exclude_id: int = None, db: Session = Depends(get_db)):
    query = db.query(models.User).filter(models.User.is_active == True)
    if exclude_id:
        query = query.filter(models.User.id != exclude_id)
    if q:
        query = query.filter(models.User.name.ilike(f"%{q}%"))
    users = query.limit(20).all()
    return [{"id": u.id, "name": u.name, "role": u.role, "telegram_id": u.telegram_id} for u in users]


@router.get("/api/bot/leads")
def bot_list_leads(status: str = None, search: str = None, db: Session = Depends(get_db)):
    q = db.query(models.Lead)
    if status:
        q = q.filter(models.Lead.status == status)
    if search:
        q = q.filter(
            models.Lead.name.ilike(f"%{search}%") |
            models.Lead.phone.ilike(f"%{search}%")
        )
    leads = q.order_by(models.Lead.created_at.desc()).limit(50).all()
    return [
        {
            "id": l.id, "name": l.name, "phone": l.phone,
            "status": l.status, "course": l.course.title if l.course else None,
            "created_at": str(l.created_at)[:16],
            "notes": (l.notes or "")[:100]
        }
        for l in leads
    ]


@router.get("/api/bot/leads/funnel")
def bot_lead_funnel(db: Session = Depends(get_db)):
    total = db.query(models.Lead).count()
    new = db.query(models.Lead).filter(models.Lead.status == "new").count()
    contacted = db.query(models.Lead).filter(models.Lead.status == "contacted").count()
    enrolled = db.query(models.Lead).filter(models.Lead.status == "enrolled").count()
    lost = db.query(models.Lead).filter(models.Lead.status == "lost").count()
    return {
        "total": total, "new": new, "contacted": contacted,
        "enrolled": enrolled, "lost": lost,
        "conversion_rate": round(enrolled / total * 100, 1) if total else 0
    }


@router.get("/api/bot/leads/{lead_id}")
def bot_lead_detail(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404)
    history = db.query(models.LeadHistory).filter(
        models.LeadHistory.lead_id == lead_id
    ).order_by(models.LeadHistory.created_at.desc()).limit(20).all()
    return {
        "id": lead.id, "name": lead.name, "phone": lead.phone,
        "email": lead.email, "status": lead.status,
        "course": lead.course.title if lead.course else None,
        "source": lead.source, "notes": lead.notes,
        "created_at": str(lead.created_at)[:16],
        "history": [
            {"old": h.old_status, "new": h.new_status, "at": str(h.created_at)[:16], "comment": h.comment}
            for h in history
        ]
    }


@router.post("/api/bot/leads/{lead_id}/status")
def bot_update_lead_status(lead_id: int, status: str = Body(...), notes: str = Body(default=None), db: Session = Depends(get_db)):
    update = schemas.LeadStatusUpdate(status=status, notes=notes)
    lead = crud.update_lead_status(db, lead_id, update)
    if not lead:
        raise HTTPException(status_code=404)
    return {"status": lead.status}


@router.post("/api/bot/leads/{lead_id}/convert")
def bot_convert_lead(lead_id: int, db: Session = Depends(get_db)):
    """Convert a lead to a student (simplified -- no group_id needed)."""
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead or lead.status == "enrolled":
        raise HTTPException(status_code=400, detail="Lead not found or already enrolled")
    import hashlib, secrets
    user = None
    if lead.phone:
        user = db.query(models.User).filter(models.User.phone == lead.phone).first()
    if not user and lead.email:
        user = db.query(models.User).filter(models.User.email == lead.email).first()
    if not user:
        temp_pass = secrets.token_hex(8)
        user = models.User(
            name=lead.name, phone=lead.phone,
            email=lead.email or f"lead_{lead.id}@edusmart.local",
            role="student",
            password_hash=get_password_hash(temp_pass),
            registration_source="crm_convert", is_active=True,
        )
        db.add(user); db.commit(); db.refresh(user)
    lead.status = "enrolled"
    lead.notes = (lead.notes or "") + f"\n[Бот] Конвертирован (user_id={user.id})"
    db.commit()
    bot_token = os.getenv("BOT_TOKEN")
    if user.telegram_id and bot_token:
        try:
            requests.post(f"https://api.telegram.org/bot{bot_token}/sendMessage",
                json={"chat_id": user.telegram_id, "text": "\U0001f389 *Поздравляем!* Вы зачислены в TIL USER Education Center!", "parse_mode": "Markdown"}, timeout=5)
        except Exception as exc:
            log.warning("Enroll notify failed for %s: %s", user.telegram_id, exc)
    return {"status": "ok", "user_id": user.id, "lead_id": lead.id}


@router.post("/api/bot/broadcast-group")
def bot_broadcast_group(group_id: int = Body(...), message: str = Body(...), db: Session = Depends(get_db)):
    """Send a message to all students in a group via Telegram."""
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.group_id == group_id
    ).all()
    bot_token = os.getenv("BOT_TOKEN")
    if not bot_token:
        raise HTTPException(status_code=500, detail="BOT_TOKEN not configured")
    sent = 0
    for enroll in enrollments:
        student = db.query(models.User).filter(models.User.id == enroll.student_id).first()
        if student and student.telegram_id:
            try:
                requests.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json={"chat_id": student.telegram_id, "text": f"\U0001f4e2 *{group.name}*\n\n{message}", "parse_mode": "Markdown"},
                    timeout=5
                )
                sent += 1
            except Exception as exc:
                log.warning("Broadcast failed for %s: %s", student.telegram_id, exc)
    return {"sent": sent, "total": len(enrollments)}
