from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import timedelta, datetime, date
import os, requests, io, openpyxl, logging

log = logging.getLogger("web")

import crud, models, schemas
from database import get_db
from auth import require_admin, require_super_admin, get_current_user, get_password_hash
from fastapi.responses import StreamingResponse

log = logging.getLogger("web")

router = APIRouter(tags=["admin"])


@router.get("/api/admin/stats")
def admin_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.get_admin_stats(db)


@router.get("/api/admin/reports")
def admin_reports(db: Session = Depends(get_db), _=Depends(require_super_admin)):
    return crud.get_admin_reports(db)


@router.get("/api/admin/pending-users")
def get_pending_users(
    source: str = None,
    period: str = None,
    search: str = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    q = db.query(models.User).filter(models.User.role == "pending")
    if source:
        q = q.filter(models.User.registration_source == source)
    if period == "today":
        q = q.filter(models.User.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0))
    elif period == "week":
        q = q.filter(models.User.created_at >= datetime.utcnow() - timedelta(days=7))
    elif period == "month":
        q = q.filter(models.User.created_at >= datetime.utcnow() - timedelta(days=30))
    if search:
        q = q.filter(
            models.User.name.ilike(f"%{search}%") |
            models.User.email.ilike(f"%{search}%") |
            models.User.phone.ilike(f"%{search}%")
        )
    users = q.order_by(models.User.created_at.desc()).limit(200).all()

    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0)
    week_start = now - timedelta(days=7)
    total_pending = db.query(models.User).filter(models.User.role == "pending").count()
    today_count = db.query(models.User).filter(models.User.role == "pending", models.User.created_at >= today_start).count()
    week_count = db.query(models.User).filter(models.User.role == "pending", models.User.created_at >= week_start).count()
    converted_count = db.query(models.User).filter(
        models.User.role.in_(["student", "teacher"]),
        models.User.created_at >= week_start
    ).count()
    total_this_week = week_count + converted_count
    conversion_rate = round(converted_count / total_this_week * 100, 1) if total_this_week > 0 else 0

    return {
        "stats": {
            "total": total_pending,
            "today": today_count,
            "week": week_count,
            "conversion_rate": conversion_rate,
        },
        "users": [
            {
                "id": u.id, "name": u.name, "email": u.email,
                "phone": u.phone or "",
                "registration_source": getattr(u, "registration_source", "web") or "web",
                "telegram_id": u.telegram_id,
                "is_active": u.is_active,
                "created_at": str(u.created_at)[:16] if u.created_at else "",
            } for u in users
        ],
    }


@router.post("/api/admin/pending-users/bulk")
def bulk_pending_users(body: dict, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    ids = body.get("ids", [])
    action = body.get("action", "approve")
    role = body.get("role", "student")
    if current_user.role != "super_admin" and role in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Только Super Admin может назначать роль администратора")
    if not ids:
        raise HTTPException(status_code=400, detail="Нет ID")
    users = db.query(models.User).filter(models.User.id.in_(ids)).all()
    count = 0
    for u in users:
        if action == "approve":
            u.role = role
            u.is_active = True
            if u.telegram_id:
                try:
                    role_names = {"student": "Студент", "teacher": "Преподаватель"}
                    bot_token = os.getenv("BOT_TOKEN")
                    if bot_token:
                        requests.post(
                            f"https://api.telegram.org/bot{bot_token}/sendMessage",
                            json={"chat_id": u.telegram_id, "text": f"✅ *Ваша заявка одобрена!*\n\nРоль: *{role_names.get(role, role)}*\n\nДобро пожаловать в TIL USER!", "parse_mode": "Markdown"},
                            timeout=5
                        )
                except Exception as exc:
                    log.warning("TG notify failed for %s: %s", u.telegram_id, exc)
        elif action == "reject":
            if u.telegram_id:
                try:
                    bot_token = os.getenv("BOT_TOKEN")
                    if bot_token:
                        requests.post(
                            f"https://api.telegram.org/bot{bot_token}/sendMessage",
                            json={"chat_id": u.telegram_id, "text": "❌ *Ваша заявка отклонена.*", "parse_mode": "Markdown"},
                            timeout=5
                        )
                except Exception as exc:
                    log.warning("TG notify failed for %s: %s", u.telegram_id, exc)
            db.delete(u)
        count += 1
    db.commit()
    return {"ok": True, "affected": count}


@router.patch("/api/admin/pending-users/{user_id}/approve")
def approve_pending_user(
    user_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    new_role = body.get("role", "student")
    if current_user.role != "super_admin" and new_role in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Только Super Admin может назначать роль администратора")
    user.role = new_role
    user.is_active = True
    if new_role == "student":
        existing = db.query(models.Student).filter(models.Student.user_id == user.id).first()
        if not existing:
            import random
            code = f"STU{random.randint(100000, 999999)}"
            student = models.Student(user_id=user.id, student_code=code, is_active=True)
            db.add(student)
    db.commit()
    if user.telegram_id:
        bot_token = os.getenv("BOT_TOKEN")
        if bot_token:
            role_names = {"student": "Студент", "teacher": "Преподаватель", "admin": "Администратор"}
            msg = f"✅ *Ваша заявка одобрена!*\n\nРоль: *{role_names.get(new_role, new_role)}*\n\nДобро пожаловать в TIL USER! Используйте /start чтобы войти в кабинет."
            try:
                requests.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json={"chat_id": user.telegram_id, "text": msg, "parse_mode": "Markdown"},
                    timeout=5
                )
            except Exception as e:
                log.warning("Telegram approve notification failed for user %s: %s", user.id, e)
    return {"ok": True, "user_id": user.id, "new_role": new_role}


@router.patch("/api/admin/pending-users/{user_id}/reject")
def reject_pending_user(
    user_id: int,
    body: dict,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    reason = body.get("reason", "Заявка отклонена администратором.")
    if user.telegram_id:
        bot_token = os.getenv("BOT_TOKEN")
        if bot_token:
            msg = f"❌ *Ваша заявка отклонена.*\n\n{reason}\n\nЕсли вы считаете это ошибкой, обратитесь к администратору."
            try:
                requests.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json={"chat_id": user.telegram_id, "text": msg, "parse_mode": "Markdown"},
                    timeout=5
                )
            except Exception as e:
                log.warning("Telegram reject notification failed for user %s: %s", user.id, e)
    db.delete(user)
    db.commit()
    return {"ok": True, "user_id": user_id, "message": "Пользователь отклонён и удалён"}


@router.get("/api/admin/students", response_model=List[schemas.AdminStudentPublic])
def admin_students(
    search: str = None,
    group_id: int = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    q = db.query(models.User).filter(models.User.role == "student")
    if search:
        q = q.filter(
            models.User.name.ilike(f"%{search}%") |
            models.User.email.ilike(f"%{search}%") |
            models.User.phone.ilike(f"%{search}%")
        )
    if group_id:
        enrolled_ids = [
            e.student_id for e in db.query(models.Enrollment.student_id)
            .filter(models.Enrollment.group_id == group_id).all()
        ]
        q = q.filter(models.User.id.in_(enrolled_ids))
    students = q.order_by(models.User.name).all()
    user_ids = [s.id for s in students]

    profiles = {
        p.user_id: p for p in db.query(models.Student)
        .filter(models.Student.user_id.in_(user_ids)).all()
    }

    payment_rows = db.query(
        models.Payment.student_id,
        func.sum(models.Payment.amount)
    ).filter(
        models.Payment.student_id.in_(user_ids),
        models.Payment.status == "paid"
    ).group_by(models.Payment.student_id).all()
    payments = dict(payment_rows)

    att_rows = db.query(
        models.LessonAttendance.student_id,
        func.count(models.LessonAttendance.id)
    ).filter(
        models.LessonAttendance.student_id.in_(user_ids),
        models.LessonAttendance.attended == True
    ).group_by(models.LessonAttendance.student_id).all()
    attended_counts = dict(att_rows)

    total_rows = db.query(
        models.LessonAttendance.student_id,
        func.count(models.LessonAttendance.id)
    ).filter(
        models.LessonAttendance.student_id.in_(user_ids)
    ).group_by(models.LessonAttendance.student_id).all()
    total_lessons = dict(total_rows)

    enrollments = db.query(models.Enrollment).options(
        joinedload(models.Enrollment.course)
    ).filter(
        models.Enrollment.student_id.in_(user_ids)
    ).all()

    result = []
    for s in students:
        # Источник истины — student_groups (то, что видит бот).
        student_prof = profiles.get(s.id)
        active_gids: set[int] = set()
        if student_prof:
            active_gids = {
                sg.group_id for sg in db.query(models.StudentGroup).filter(
                    models.StudentGroup.student_id == student_prof.id,
                    models.StudentGroup.status == "active",
                ).all()
            }
        groups = db.query(models.Group).filter(models.Group.id.in_(active_gids)).all() if active_gids else []

        # Курсы — берём из АКТУАЛЬНЫХ групп студента, а не из истории enrollments.
        # Так исчезают "хвосты" от прошлых попыток зачисления / переводов.
        course_titles: list[str] = []
        seen_courses: set[int] = set()
        for g in groups:
            if g.course and g.course.title and g.course_id not in seen_courses:
                course_titles.append(g.course.title)
                seen_courses.add(g.course_id)
        course_name_value = ", ".join(course_titles) if course_titles else None
        prof = profiles.get(s.id)
        att_count = attended_counts.get(s.id, 0)
        tot_lessons = total_lessons.get(s.id, 0)
        now = datetime.utcnow().date()
        if prof and prof.frozen_until and prof.frozen_until > now:
            status = "frozen"
        elif not s.is_active:
            status = "inactive"
        else:
            status = "active"
        result.append({
            "id": s.id, "name": s.name, "email": s.email, "phone": s.phone,
            "is_active": s.is_active, "role": s.role, "avatar_url": s.avatar_url,
            "created_at": s.created_at,
            "status": status,
            "groups": [g.name for g in groups if g.name and g.id],
            "group_ids": [g.id for g in groups if g.id],
            "level": prof.level if prof else None,
            "last_activity_date": str(prof.last_activity_date) if prof and prof.last_activity_date else None,
            "registration_date": str(prof.enrollment_date) if prof and prof.enrollment_date else (str(s.created_at.date()) if s.created_at else None),
            "total_paid": payments.get(s.id, 0) or 0,
            "attendance_rate": round(att_count / tot_lessons * 100, 1) if tot_lessons > 0 else None,
            "lessons_attended": att_count,
            "course_name": course_name_value,
        })
    return result


@router.get("/api/admin/teachers")
def admin_teachers(
    search: str = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    q = db.query(models.User).filter(models.User.role == "teacher")
    if search:
        q = q.filter(
            models.User.name.ilike(f"%{search}%") |
            models.User.email.ilike(f"%{search}%")
        )
    users = q.order_by(models.User.name).all()
    user_ids = [u.id for u in users]
    teachers = {
        t.user_id: t for t in db.query(models.Teacher).filter(models.Teacher.user_id.in_(user_ids)).all()
    } if user_ids else {}

    result = []
    for u in users:
        t = teachers.get(u.id)
        groups = db.query(models.Group).filter(models.Group.teacher_id == t.id).all() if t else []
        group_ids = [g.id for g in groups]
        lesson_count = db.query(models.Lesson).filter(
            models.Lesson.group_id.in_(group_ids)
        ).count() if group_ids else 0
        # уникальные студенты в этих группах через student_groups
        student_count = db.query(models.StudentGroup.student_id).filter(
            models.StudentGroup.group_id.in_(group_ids),
            models.StudentGroup.status == "active",
        ).distinct().count() if group_ids else 0
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "avatar_url": u.avatar_url,
            "created_at": u.created_at,
            "is_active": u.is_active,
            "status": "active" if u.is_active else "inactive",
            "subjects": t.subjects if t else None,
            "bio": t.bio if t else None,
            "groups_count": len(groups),
            "lesson_count": lesson_count,
            "student_count": student_count,
            "hire_date": str(u.created_at.date()) if u.created_at else None,
            "last_active": u.last_login_at.isoformat() if u.last_login_at else None,
        })
    return result


@router.post("/api/admin/teachers", response_model=schemas.UserPublic)
def admin_create_teacher(
    data: schemas.AdminTeacherCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    existing = crud.get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email уже используется")
    return crud.create_admin_teacher(db, data)


@router.get("/api/admin/users/summary", response_model=List[schemas.UserSummary])
def admin_users_summary(db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.get_users_summary(db)


@router.get("/api/admin/admins")
def admin_list_admins(db: Session = Depends(get_db), _=Depends(require_super_admin)):
    users = db.query(models.User).filter(
        models.User.role.in_(["super_admin", "admin"])
    ).order_by(models.User.role, models.User.name).all()
    return [{
        "id": u.id, "name": u.name, "email": u.email,
        "phone": u.phone, "role": u.role,
        "is_active": u.is_active,
        "created_at": str(u.created_at)[:10] if u.created_at else None,
    } for u in users]


@router.post("/api/admin/users", response_model=schemas.UserPublic)
def admin_create_user(user_data: schemas.UserCreate, db: Session = Depends(get_db),
                      current_user: models.User = Depends(require_admin)):
    if user_data.role in ("admin", "super_admin") and current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только Super Admin может создавать пользователей с ролью администратора"
        )
    existing = crud.get_user_by_email(db, user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email уже используется")
    return crud.create_user_by_admin(db, user_data)


@router.get("/api/admin/users/{user_id}")
def admin_get_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    detail = crud.get_student_detail(db, user_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    u = detail["user"]
    return {
        "user": {
            "id": u.id, "name": u.name, "email": u.email,
            "phone": u.phone, "role": u.role,
            "is_active": u.is_active,
            "created_at": str(u.created_at)[:10] if u.created_at else None,
        },
        "enrollments": [
            {
                "id": e.id, "course_id": e.course_id, "group_id": e.group_id,
                "progress": e.progress, "xp": e.xp,
                "course_title": e.course.title if e.course else f"Курс #{e.course_id}",
            } for e in detail["enrollments"]
        ],
        "payments": [
            {
                "id": p.id, "amount": float(p.amount), "currency": p.currency,
                "method": p.method, "status": p.status,
                "description": p.description or "—",
                "created_at": str(p.created_at)[:10] if p.created_at else None,
            } for p in detail["payments"]
        ],
        "submissions": [
            {
                "id": s.id, "homework_id": s.homework_id,
                "grade": s.grade, "status": s.status,
                "submitted_at": str(s.submitted_at)[:10] if s.submitted_at else None,
            } for s in detail["submissions"]
        ],
    }


@router.patch("/api/admin/users/{user_id}", response_model=schemas.UserPublic)
def admin_update_user(user_id: int, update: schemas.UserUpdate,
                      db: Session = Depends(get_db),
                      current_user: models.User = Depends(require_admin)):
    if update.role and update.role in ("admin", "super_admin") and current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только Super Admin может назначать роль администратора"
        )
    user = crud.update_user(db, user_id, update)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user


@router.delete("/api/admin/users/{user_id}")
def admin_delete_user(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Нельзя удалить самого себя")
    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if target.role in ("admin", "super_admin") and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Только Super Admin может удалять администраторов")
    ok = crud.delete_user(db, user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return {"ok": True, "message": "Пользователь удалён"}


@router.post("/api/admin/users/bulk-delete")
def admin_bulk_delete_users(data: schemas.BulkAction, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    if current_user.id in data.ids:
        raise HTTPException(status_code=400, detail="Нельзя удалить самого себя")
    targets = db.query(models.User).filter(models.User.id.in_(data.ids)).all()
    admin_ids = [t.id for t in targets if t.role in ("admin", "super_admin")]
    if admin_ids and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Только Super Admin может удалять администраторов")
    count = crud.bulk_delete_users(db, data.ids)
    return {"ok": True, "count": count}


@router.post("/api/admin/users/{user_id}/freeze")
def admin_freeze_user(
    user_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    from datetime import timedelta
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user.role in ("admin", "super_admin") and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Только Super Admin может замораживать администраторов")
    days = body.get("days", 14)
    until = datetime.utcnow() + timedelta(days=days)
    user.is_active = False
    db.commit()
    if user.telegram_id:
        bot_token = os.getenv("BOT_TOKEN")
        if bot_token:
            msg = f"❄️ *Ваш профиль заморожен* на {days} дней (до {until.strftime('%d.%m.%Y')}).\n\nПо вопросам обращайтесь к администрации."
            try:
                requests.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json={"chat_id": user.telegram_id, "text": msg, "parse_mode": "Markdown"},
                    timeout=5
                )
            except Exception as e:
                log.warning("Telegram freeze notification failed for user %s: %s", user.id, e)
    crud.create_notification(db, user_id, "Профиль заморожен",
                             f"Ваш профиль заморожен на {days} дней администратором.")
    return {"ok": True, "user_id": user_id, "frozen_until": str(until)[:10]}


@router.post("/api/admin/users/{user_id}/unfreeze")
def admin_unfreeze_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user.is_active = True
    db.commit()
    if user.telegram_id:
        bot_token = os.getenv("BOT_TOKEN")
        if bot_token:
            try:
                requests.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json={"chat_id": user.telegram_id,
                          "text": "🔥 *Ваш профиль разморожен!* Продолжайте обучение.",
                          "parse_mode": "Markdown"},
                    timeout=5
                )
            except Exception as e:
                log.warning("Telegram unfreeze notification failed for user %s: %s", user.id, e)
    crud.create_notification(db, user_id, "Профиль активирован", "Ваш профиль разморожен администратором.")
    return {"ok": True, "user_id": user_id}


@router.post("/api/admin/users/{user_id}/toggle-active")
def admin_toggle_user_active(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(require_admin)):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Нельзя отчислить самого себя")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if user.role in ("admin", "super_admin") and current_user.role != "super_admin":
        raise HTTPException(status_code=403, detail="Только Super Admin может отчислять администраторов")
    user.is_active = not user.is_active

    if not user.is_active:
        student = db.query(models.Student).filter(models.Student.user_id == user.id).first()
        if student:
            active_sgs = db.query(models.StudentGroup).filter(
                models.StudentGroup.student_id == student.id,
                models.StudentGroup.status == "active"
            ).all()
            for sg in active_sgs:
                sg.status = "expelled"
                group = db.query(models.Group).filter(models.Group.id == sg.group_id).first()
                if group:
                    group.current_students = max(0, (group.current_students or 0) - 1)

    db.commit()
    action = "восстановлен" if user.is_active else "отчислен"
    if user.telegram_id:
        bot_token = os.getenv("BOT_TOKEN")
        if bot_token:
            msg = ("✅ *Вы восстановлены!* Добро пожаловать обратно."
                   if user.is_active else
                   "🚫 *Ваш аккаунт отчислен.* По вопросам обращайтесь к администрации.")
            try:
                requests.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json={"chat_id": user.telegram_id, "text": msg, "parse_mode": "Markdown"},
                    timeout=5
                )
            except Exception as e:
                log.warning("Telegram toggle-active notification failed for user %s: %s", user.id, e)
    return {"ok": True, "user_id": user_id, "is_active": user.is_active, "action": action}


@router.post("/api/admin/users/{user_id}/transfer-group")
def admin_transfer_group(
    user_id: int,
    body: dict,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    from_group_id = body.get("from_group_id")
    to_group_id = body.get("to_group_id")
    if not from_group_id or not to_group_id:
        raise HTTPException(status_code=400, detail="from_group_id и to_group_id обязательны")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    new_group = db.query(models.Group).filter(models.Group.id == to_group_id).first()
    if not new_group:
        raise HTTPException(status_code=404, detail="Целевая группа не найдена")

    old_enroll = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == user_id,
        models.Enrollment.group_id == from_group_id
    ).first()
    if old_enroll:
        old_enroll.group_id = to_group_id

    db.commit()

    if user.telegram_id:
        bot_token = os.getenv("BOT_TOKEN")
        if bot_token:
            try:
                requests.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json={"chat_id": user.telegram_id,
                          "text": f"🔁 *Вас перевели в группу «{new_group.name}»!*\n\nЕсли у вас есть вопросы — свяжитесь с администрацией.",
                          "parse_mode": "Markdown"},
                    timeout=5
                )
            except Exception as e:
                log.warning("Telegram transfer-group notification failed for user %s: %s", user.id, e)
    return {"ok": True, "user_id": user_id, "new_group": new_group.name}


@router.get("/api/admin/export/students")
def export_students(db: Session = Depends(get_db), _=Depends(require_super_admin)):
    students = crud.get_all_students(db)
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Студенты"
    headers = ["ID", "Имя", "Email", "Телефон", "Роль", "Дата регистрации"]
    ws.append(headers)
    for s in students:
        ws.append([
            s.id, s.name, s.email,
            s.phone or "—",
            s.role,
            str(s.created_at)[:10] if s.created_at else "—"
        ])
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=students.xlsx"}
    )


@router.get("/api/admin/export/leads")
def export_leads(db: Session = Depends(get_db), _=Depends(require_super_admin)):
    leads = crud.get_leads(db)
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Заявки"
    ws.append(["ID", "Имя", "Телефон", "Курс", "Статус", "Заметки", "Дата"])
    for l in leads:
        ws.append([
            l.id, l.name, l.phone,
            l.course.title if l.course else "—",
            l.status,
            l.notes or "—",
            str(l.created_at)[:10] if l.created_at else "—"
        ])
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=leads.xlsx"}
    )


@router.get("/api/admin/export/payments")
def export_payments(db: Session = Depends(get_db), _=Depends(require_super_admin)):
    payments = crud.get_payments(db)
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Платежи"
    ws.append(["ID", "Студент", "Сумма", "Валюта", "Метод", "Описание", "Статус", "Дата"])
    for p in payments:
        ws.append([
            p.id,
            p.student.name if p.student else f"ID {p.student_id}",
            float(p.amount),
            p.currency,
            p.method,
            p.description or "—",
            p.status,
            str(p.created_at)[:10] if p.created_at else "—"
        ])
    stream = io.BytesIO()
    wb.save(stream)
    stream.seek(0)
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=payments.xlsx"}
    )


@router.post("/api/admin/broadcast")
def admin_broadcast(body: dict, db: Session = Depends(get_db), _=Depends(require_admin)):
    message = body.get("message", "").strip()
    audience = body.get("audience", "all")
    parse_mode = body.get("parse_mode", "Markdown")
    if not message:
        raise HTTPException(status_code=400, detail="Сообщение не может быть пустым")

    bot_token = os.getenv("BOT_TOKEN")
    if not bot_token:
        raise HTTPException(status_code=500, detail="BOT_TOKEN не настроен")

    q = db.query(models.User).filter(models.User.telegram_id.isnot(None), models.User.is_active == True)
    if audience != "all":
        q = q.filter(models.User.role == audience)
    users = q.all()

    success, fail = 0, 0
    for u in users:
        try:
            r = requests.post(
                f"https://api.telegram.org/bot{bot_token}/sendMessage",
                json={"chat_id": u.telegram_id, "text": message, "parse_mode": parse_mode},
                timeout=5
            )
            if r.status_code == 200:
                success += 1
            else:
                fail += 1
        except Exception:
            log.warning("Broadcast send failed to user %s", u.id)
            fail += 1

    return {"ok": True, "sent": success, "failed": fail, "total": len(users)}


@router.get("/api/admin/broadcast/campaigns")
def list_campaigns(db: Session = Depends(get_db), _=Depends(require_admin)):
    campaigns = db.query(models.BroadcastCampaign).order_by(models.BroadcastCampaign.created_at.desc()).all()
    out = []
    for c in campaigns:
        out.append({
            "id": c.id,
            "title": c.title,
            "channel": c.channel,
            "message": c.message[:200] if c.message else "",
            "audience_config": c.audience_config or {},
            "status": c.status,
            "scheduled_at": str(c.scheduled_at)[:16] if c.scheduled_at else None,
            "sent_at": str(c.sent_at)[:16] if c.sent_at else None,
            "stats": c.stats or {},
            "created_at": str(c.created_at)[:16] if c.created_at else "",
            "created_by": c.created_by,
        })
    return out


@router.post("/api/admin/broadcast/campaigns")
def create_campaign(body: dict, db: Session = Depends(get_db),
                    current_user: models.User = Depends(get_current_user),
                    _=Depends(require_admin)):
    c = models.BroadcastCampaign(
        title=body.get("title", "Без названия"),
        channel=body.get("channel", "telegram"),
        message=body.get("message", ""),
        audience_config=body.get("audience_config", {"type": "all"}),
        status=body.get("status", "draft"),
        scheduled_at=datetime.fromisoformat(body["scheduled_at"]) if body.get("scheduled_at") else None,
        created_by=current_user.id,
    )
    db.add(c); db.commit(); db.refresh(c)
    return {"ok": True, "id": c.id}


@router.put("/api/admin/broadcast/campaigns/{campaign_id}")
def update_campaign(campaign_id: int, body: dict, db: Session = Depends(get_db), _=Depends(require_admin)):
    c = db.query(models.BroadcastCampaign).filter(models.BroadcastCampaign.id == campaign_id).first()
    if not c: raise HTTPException(status_code=404)
    if "title" in body: c.title = body["title"]
    if "channel" in body: c.channel = body["channel"]
    if "message" in body: c.message = body["message"]
    if "audience_config" in body: c.audience_config = body["audience_config"]
    if "status" in body: c.status = body["status"]
    if "scheduled_at" in body:
        c.scheduled_at = datetime.fromisoformat(body["scheduled_at"]) if body["scheduled_at"] else None
    db.commit()
    return {"ok": True}


@router.delete("/api/admin/broadcast/campaigns/{campaign_id}")
def delete_campaign(campaign_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    c = db.query(models.BroadcastCampaign).filter(models.BroadcastCampaign.id == campaign_id).first()
    if not c: raise HTTPException(status_code=404)
    db.delete(c); db.commit()
    return {"ok": True}


@router.post("/api/admin/broadcast/campaigns/{campaign_id}/send")
def send_campaign(campaign_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    c = db.query(models.BroadcastCampaign).filter(models.BroadcastCampaign.id == campaign_id).first()
    if not c: raise HTTPException(status_code=404, detail="Кампания не найдена")
    if c.status == "sent":
        raise HTTPException(status_code=400, detail="Кампания уже отправлена")

    bot_token = os.getenv("BOT_TOKEN")
    if not bot_token:
        raise HTTPException(status_code=500, detail="BOT_TOKEN не настроен")

    config = c.audience_config or {}
    audience_type = config.get("type", "all")
    q = db.query(models.User).filter(models.User.telegram_id.isnot(None), models.User.is_active == True)
    if audience_type == "role":
        q = q.filter(models.User.role == config.get("value", "student"))
    elif audience_type == "group":
        group_id = config.get("value")
        if group_id:
            q = q.join(models.Enrollment).filter(models.Enrollment.group_id == group_id)
    elif audience_type == "course":
        course_id = config.get("value")
        if course_id:
            q = q.join(models.Enrollment).filter(models.Enrollment.course_id == course_id)

    users = q.all()
    message = c.message
    sent_count = 0; fail_count = 0
    for u in users:
        msg = message.replace("{Имя}", u.name or "")
        try:
            r = requests.post(
                f"https://api.telegram.org/bot{bot_token}/sendMessage",
                json={"chat_id": u.telegram_id, "text": msg, "parse_mode": "Markdown"},
                timeout=5
            )
            if r.status_code == 200: sent_count += 1
            else: fail_count += 1
        except Exception: fail_count += 1

    c.status = "sent"
    c.sent_at = datetime.utcnow()
    c.stats = {"total": len(users), "sent": sent_count, "failed": fail_count, "opened": 0, "clicked": 0}
    db.commit()
    return {"ok": True, "total": len(users), "sent": sent_count, "failed": fail_count}


@router.get("/api/admin/broadcast/groups")
def broadcast_groups(db: Session = Depends(get_db), _=Depends(require_admin)):
    groups = db.query(models.Group).filter(models.Group.is_active == True).order_by(models.Group.name).all()
    return [{"id": g.id, "name": g.name, "course_name": g.course.title if g.course else ""} for g in groups]


@router.get("/api/admin/broadcast/courses")
def broadcast_courses(db: Session = Depends(get_db), _=Depends(require_admin)):
    courses = db.query(models.Course).filter(models.Course.is_active == True).order_by(models.Course.title).all()
    return [{"id": c.id, "title": c.title} for c in courses]


@router.post("/api/admin/remind-debts")
def remind_debts(db: Session = Depends(get_db), _=Depends(require_admin)):
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    students = db.query(models.User).filter(models.User.role == "student").all()
    count = 0
    for st in students:
        if not st.telegram_id:
            continue
        recent_payment = db.query(models.Payment).filter(
            models.Payment.student_id == st.id,
            models.Payment.status == "paid",
            models.Payment.created_at >= thirty_days_ago
        ).first()

        if not recent_payment:
            msg = "⚠️ *Напоминание об оплате*\n\nЗдравствуйте! Подошел срок оплаты за обучение в этом месяце. Пожалуйста, произведите оплату в ближайшее время."
            if crud.send_telegram_notification(st.telegram_id, msg):
                count += 1

    return {"status": "ok", "reminded": count}


@router.get("/api/leads/counts")
def lead_counts(db: Session = Depends(get_db), _=Depends(require_admin)):
    total = db.query(models.Lead).count()
    new = db.query(models.Lead).filter(models.Lead.status == "new").count()
    contacted = db.query(models.Lead).filter(models.Lead.status == "contacted").count()
    enrolled = db.query(models.Lead).filter(models.Lead.status == "enrolled").count()
    lost = db.query(models.Lead).filter(models.Lead.status == "lost").count()
    return {"total": total, "new": new, "contacted": contacted, "enrolled": enrolled, "lost": lost}


@router.post("/api/leads", response_model=schemas.Lead)
def create_lead(lead: schemas.LeadCreate, db: Session = Depends(get_db)):
    return crud.create_lead(db=db, lead=lead)


@router.get("/api/leads")
def read_leads(
    status: str = None,
    search: str = None,
    course_id: int = None,
    source: str = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    q = db.query(models.Lead)
    if status:
        q = q.filter(models.Lead.status == status)
    if search:
        q = q.filter(
            models.Lead.name.ilike(f"%{search}%") |
            models.Lead.phone.ilike(f"%{search}%") |
            models.Lead.notes.ilike(f"%{search}%")
        )
    if course_id:
        q = q.filter(models.Lead.course_id == course_id)
    if source:
        q = q.filter(models.Lead.source == source)
    leads = q.order_by(models.Lead.created_at.desc()).limit(300).all()
    return [
        {
            "id": l.id,
            "name": l.name,
            "phone": l.phone,
            "email": l.email,
            "status": l.status,
            "notes": l.notes,
            "source": l.source or "manual",
            "course_id": l.course_id,
            "course": {"id": l.course.id, "title": l.course.title} if l.course else None,
            "created_at": l.created_at.isoformat() if l.created_at else None,
            "updated_at": l.updated_at.isoformat() if l.updated_at else None,
        }
        for l in leads
    ]


@router.patch("/api/leads/{lead_id}")
def update_lead(lead_id: int, update: schemas.LeadStatusUpdate,
                db: Session = Depends(get_db), _=Depends(require_admin)):
    result = crud.update_lead_status(db, lead_id, update)
    if not result:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return result


@router.delete("/api/leads/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    db.delete(lead)
    db.commit()
    return {"ok": True, "message": f"Заявка #{lead_id} удалена"}


@router.post("/api/leads/{lead_id}/convert")
def convert_lead_to_student(lead_id: int, body: dict, db: Session = Depends(get_db), _=Depends(require_admin)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    group_id = body.get("group_id")
    group = None
    course_id = lead.course_id

    if group_id:
        group = db.query(models.Group).filter(models.Group.id == group_id).first()
        if not group:
            raise HTTPException(status_code=404, detail="Группа не найдена")
        # Если админ зачисляет в конкретную группу — курс берём от группы,
        # а не от лида. Иначе данные в enrollment vs student_groups разъезжаются,
        # и бот показывает «не тот» курс.
        course_id = group.course_id

    user = None
    if lead.phone:
        user = db.query(models.User).filter(models.User.phone == lead.phone).first()
    if not user and lead.email:
        user = db.query(models.User).filter(models.User.email == lead.email).first()

    if not user:
        import secrets
        temp_pass = secrets.token_hex(8)
        user = models.User(
            name=lead.name,
            phone=lead.phone,
            email=lead.email or f"lead_{lead.id}@edusmart.local",
            role="student",
            password_hash=get_password_hash(temp_pass),
            registration_source="crm_convert",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Найденный pending-юзер из бота → промоут в студента.
        if user.role in (None, "pending", ""):
            user.role = "student"
        user.is_active = True

    # Закрываем все pending-заявки этого юзера в registrations
    pending_regs = db.query(models.Registration).filter(
        models.Registration.user_id == user.id,
        models.Registration.status_code == "pending",
    ).all()
    for reg in pending_regs:
        reg.status_code = "approved"
        if course_id and not reg.course_id:
            reg.course_id = course_id

    existing_student = db.query(models.Student).filter(models.Student.user_id == user.id).first()
    if not existing_student:
        import random
        for _ in range(100):
            code = f"STU{random.randint(100000, 999999)}"
            if not db.query(models.Student).filter(models.Student.student_code == code).first():
                break
        student = models.Student(user_id=user.id, student_code=code, is_active=True)
        db.add(student)
        db.flush()
    else:
        student = existing_student

    if course_id:
        if group and (group.max_students or 0) > 0 and (group.current_students or 0) >= group.max_students:
            raise HTTPException(status_code=400, detail="Группа заполнена")
        existing_enroll = db.query(models.Enrollment).filter(
            models.Enrollment.student_id == user.id,
            models.Enrollment.course_id == course_id,
        ).first()
        if not existing_enroll:
            enroll = models.Enrollment(
                student_id=user.id,
                course_id=course_id,
                group_id=group_id,
                progress=0,
                xp=0,
            )
            db.add(enroll)

        if group_id:
            existing_sg = db.query(models.StudentGroup).filter(
                models.StudentGroup.student_id == student.id,
                models.StudentGroup.group_id == group_id,
            ).first()
            if not existing_sg:
                db.add(models.StudentGroup(student_id=student.id, group_id=group_id, status="active"))
            group.current_students = (group.current_students or 0) + 1

    lead.status = "enrolled"
    lead.notes = (lead.notes or "") + f"\n[CRM] Конвертирован в студента (user_id={user.id})"
    db.commit()

    if user.telegram_id:
        bot_token = os.getenv("BOT_TOKEN")
        if bot_token:
            msg = f"\U0001f389 *Поздравляем!* Вы зачислены в группу *{group.name if group else 'курса'}*!\n\nДобро пожаловать в TIL USER Education Center."
            try:
                requests.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json={"chat_id": user.telegram_id, "text": msg, "parse_mode": "Markdown"},
                    timeout=5,
                )
            except Exception as exc:
                log.warning("Enroll notify failed for %s: %s", user.telegram_id, exc)

    return {
        "ok": True,
        "user_id": user.id,
        "lead_id": lead.id,
        "group_name": group.name if group else None,
        "message": f"Заявка конвертирована. Студент: {user.name} (ID {user.id})"
    }
