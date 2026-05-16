from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Query, Body, UploadFile, File, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import timedelta, datetime
import asyncio, io, openpyxl, json, os, requests
from uuid import uuid4
from dotenv import load_dotenv

load_dotenv()

import crud, models, schemas
from database import engine, get_db
from auth import (
    create_access_token, create_refresh_token,
    get_current_user, require_admin, require_teacher, require_student,
    ACCESS_TOKEN_EXPIRE_MINUTES, decode_token
)

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Migration: add file_url/file_type columns to messages table if missing
import sqlalchemy as sa
try:
    with engine.connect() as conn:
        conn.execute(sa.text("ALTER TABLE messages ADD COLUMN file_url VARCHAR"))
        conn.commit()
except Exception:
    pass
try:
    with engine.connect() as conn:
        conn.execute(sa.text("ALTER TABLE messages ADD COLUMN file_type VARCHAR"))
        conn.commit()
except Exception:
    pass
try:
    with engine.connect() as conn:
        conn.execute(sa.text("ALTER TABLE messages ADD COLUMN file_name VARCHAR"))
        conn.commit()
except Exception:
    pass

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="TIL USER CRM API",
    description="Full CRM Platform for TIL USER Education Center",
    version="2.0.0"
)

# CORS — читается из .env (CORS_ORIGINS=http://domain1.com,http://domain2.com)
_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000")
CORS_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Bot internal API key ─────────────────────────────────────────
# All /api/bot/* endpoints require X-Bot-Secret header = BOT_TOKEN
_BOT_TOKEN = os.getenv("BOT_TOKEN", "")

async def verify_bot_secret(x_bot_secret: str = Header(None)):
    if not x_bot_secret or x_bot_secret != _BOT_TOKEN:
        raise HTTPException(status_code=403, detail="Forbidden: invalid bot secret")
    return x_bot_secret

# ── Global exception handlers ────────────────────────────────────
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    # API requests get JSON; browser requests get redirect hint
    if request.url.path.startswith("/api/"):
        return JSONResponse(status_code=404, content={"detail": "Эндпоинт не найден"})
    return JSONResponse(status_code=404, content={"detail": "Страница не найдена"})

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    print(f"[ERROR 500] {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Внутренняя ошибка сервера. Попробуйте позже."}
    )

@app.exception_handler(403)
async def forbidden_handler(request: Request, exc):
    return JSONResponse(status_code=403, content={"detail": "Доступ запрещён"})


# ──────────────────────────────────────
# AUTH
# ──────────────────────────────────────
@app.post("/auth/register", response_model=schemas.Token)
def register(user_data: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = crud.get_user_by_email(db, user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email уже используется")
    user = crud.create_user(db, user_data)
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "user": user}


@app.post("/auth/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    user = crud.authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль"
        )
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "user": user}


@app.post("/auth/refresh")
def refresh_token(body: dict = Body(...), db: Session = Depends(get_db)):
    refresh = body.get("refresh_token")
    if not refresh:
        raise HTTPException(status_code=400, detail="refresh_token обязателен")
    payload = decode_token(refresh)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Невалидный refresh token")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Невалидный refresh token")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    new_access = create_access_token({"sub": str(user.id)})
    new_refresh = create_refresh_token({"sub": str(user.id)})
    return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}


@app.get("/auth/me", response_model=schemas.UserPublic)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.patch("/auth/me", response_model=schemas.UserPublic)
def update_me(update_data: schemas.UserProfileUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    user_update = schemas.UserUpdate(
        name=update_data.name,
        email=update_data.email,
        phone=update_data.phone,
        password=update_data.password
    )
    if update_data.avatar_url is not None:
        current_user.avatar_url = update_data.avatar_url
        db.commit()
    
    updated_user = crud.update_user(db, current_user.id, user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user



# ──────────────────────────────────────
# BOT INTEGRATION
# ──────────────────────────────────────
@app.post("/api/bot/sync-user")
def sync_bot_user(data: schemas.BotUserSync, db: Session = Depends(get_db), _: str = Depends(verify_bot_secret)):
    # 1. Search by telegram_id
    user = db.query(models.User).filter(models.User.telegram_id == data.telegram_id).first()
    
    # 2. Search by phone
    if not user and data.phone:
        user = db.query(models.User).filter(models.User.phone == data.phone).first()
        if user:
            user.telegram_id = data.telegram_id
            db.commit()
            
    # 3. Create new user if not found
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

    # 4. Create Lead if course_interest is provided
    if data.course_interest:
        # Find course by name or use None
        course = db.query(models.Course).filter(models.Course.title.ilike(f"%{data.course_interest}%")).first()
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


@app.post("/api/bot/sync-payment")
def sync_bot_payment(data: schemas.BotPaymentSync, db: Session = Depends(get_db), _: str = Depends(verify_bot_secret)):
    # Find user by telegram_id
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


@app.post("/api/bot/sync-homework")
def sync_bot_homework(data: schemas.BotHomeworkSync, db: Session = Depends(get_db), _: str = Depends(verify_bot_secret)):
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

@app.get("/api/bot/student/{telegram_id}/schedule")
def get_bot_student_schedule(telegram_id: int, db: Session = Depends(get_db), _: str = Depends(verify_bot_secret)):
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

@app.post("/api/bot/sync-review")
def sync_bot_review(data: schemas.BotReviewSync, db: Session = Depends(get_db), _: str = Depends(verify_bot_secret)):
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

@app.post("/api/bot/send-message")
def bot_send_message(data: schemas.BotMessage, db: Session = Depends(get_db), _: str = Depends(verify_bot_secret)):
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
                f"💬 *{sender.name}*:\n{data.content.strip()[:200]}"
            )
        except Exception:
            pass
    return {"status": "ok", "message_id": msg.id}

@app.get("/api/bot/messages/{user_id}")
def bot_get_conversation(user_id: int, with_user: int, db: Session = Depends(get_db), _: str = Depends(verify_bot_secret)):
    msgs = crud.get_messages(db, user_id, with_user)
    crud.mark_messages_read(db, reader_id=user_id, sender_id=with_user)
    return [
        {"id": m.id, "sender_id": m.sender_id, "content": m.content, "created_at": str(m.created_at)[:16]}
        for m in msgs
    ]

@app.get("/api/bot/messages/contacts/{user_id}")
def bot_get_contacts(user_id: int, db: Session = Depends(get_db), _: str = Depends(verify_bot_secret)):
    return crud.get_chat_contacts(db, user_id)

@app.get("/api/bot/messages/unread/{user_id}")
def bot_get_unread(user_id: int, db: Session = Depends(get_db), _: str = Depends(verify_bot_secret)):
    return {"unread": crud.get_unread_count(db, user_id)}

@app.get("/api/bot/users/search")
def bot_search_users(q: str = "", exclude_id: int = None, db: Session = Depends(get_db), _: str = Depends(verify_bot_secret)):
    query = db.query(models.User).filter(models.User.is_active == True)
    if exclude_id:
        query = query.filter(models.User.id != exclude_id)
    if q:
        query = query.filter(models.User.name.ilike(f"%{q}%"))
    users = query.limit(20).all()
    return [{"id": u.id, "name": u.name, "role": u.role, "telegram_id": u.telegram_id} for u in users]

# ── Bot: Lead CRM ──────────────────
@app.get("/api/bot/leads")
def bot_list_leads(status: str = None, search: str = None, db: Session = Depends(get_db), _: str = Depends(verify_bot_secret)):
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

@app.get("/api/bot/leads/funnel")
def bot_lead_funnel(db: Session = Depends(get_db), _: str = Depends(verify_bot_secret)):
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


@app.get("/api/bot/leads/{lead_id}")
def bot_lead_detail(lead_id: int, db: Session = Depends(get_db), _: str = Depends(verify_bot_secret)):
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

@app.post("/api/bot/leads/{lead_id}/status")
def bot_update_lead_status(lead_id: int, status: str = Body(...), notes: str = Body(default=None), db: Session = Depends(get_db), _: str = Depends(verify_bot_secret)):
    update = schemas.LeadStatusUpdate(status=status, notes=notes)
    lead = crud.update_lead_status(db, lead_id, update)
    if not lead:
        raise HTTPException(status_code=404)
    return {"status": lead.status}

@app.post("/api/bot/leads/{lead_id}/convert")
def bot_convert_lead(lead_id: int, db: Session = Depends(get_db), _: str = Depends(verify_bot_secret)):
    """Convert a lead to a student (simplified — no group_id needed)."""
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
            password_hash=hashlib.sha256(temp_pass.encode()).hexdigest(),
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
                json={"chat_id": user.telegram_id, "text": "🎉 *Поздравляем!* Вы зачислены в TIL USER Education Center!", "parse_mode": "Markdown"}, timeout=5)
        except Exception:
            pass
    return {"status": "ok", "user_id": user.id, "lead_id": lead.id}

# ── Bot: Broadcast to Group ──────────
@app.post("/api/bot/broadcast-group")
def bot_broadcast_group(group_id: int = Body(...), message: str = Body(...), db: Session = Depends(get_db), _: str = Depends(verify_bot_secret)):
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
                    json={"chat_id": student.telegram_id, "text": f"📢 *{group.name}*\n\n{message}", "parse_mode": "Markdown"},
                    timeout=5
                )
                sent += 1
            except Exception:
                pass
    return {"sent": sent, "total": len(enrollments)}

# ──────────────────────────────────────
# COURSES
# ──────────────────────────────────────
@app.get("/api/courses", response_model=List[schemas.Course])
def read_courses(db: Session = Depends(get_db)):
    return crud.get_courses(db)

@app.post("/api/courses", response_model=schemas.Course)
def create_course(course: schemas.CourseCreate, db: Session = Depends(get_db),
                  _=Depends(require_admin)):
    return crud.create_course(db=db, course=course)


# ──────────────────────────────────────
# TEACHERS
# ──────────────────────────────────────
@app.get("/api/teachers", response_model=List[schemas.Teacher])
def read_teachers(db: Session = Depends(get_db)):
    return crud.get_teachers(db)

@app.post("/api/teachers", response_model=schemas.Teacher)
def create_teacher(teacher: schemas.TeacherCreate, db: Session = Depends(get_db),
                   _=Depends(require_admin)):
    return crud.create_teacher(db=db, teacher=teacher)


# ──────────────────────────────────────
# GROUPS
# ──────────────────────────────────────
@app.get("/api/groups", response_model=List[schemas.Group])
def read_groups(db: Session = Depends(get_db), _=Depends(require_teacher)):
    return crud.get_groups(db)

@app.get("/api/teacher/groups/{user_id}", response_model=List[schemas.Group])
def get_teacher_groups(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Return groups belonging to the teacher with given user_id."""
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещён")
    return crud.get_teacher_groups_by_user(db, user_id)

@app.post("/api/groups", response_model=schemas.Group)
def create_group(group: schemas.GroupCreate, db: Session = Depends(get_db),
                 _=Depends(require_admin)):
    return crud.create_group(db=db, group=group)


# ──────────────────────────────────────
# LESSONS
# ──────────────────────────────────────
@app.post("/api/lessons", response_model=schemas.Lesson)
def create_lesson(lesson: schemas.LessonCreate, db: Session = Depends(get_db),
                  _=Depends(require_teacher)):
    return crud.create_lesson(db=db, lesson=lesson)

@app.get("/api/groups/{group_id}/lessons", response_model=List[schemas.Lesson])
def get_lessons(group_id: int, db: Session = Depends(get_db), _=Depends(require_teacher)):
    return crud.get_lessons_by_group(db, group_id)


@app.get("/api/groups/{group_id}/students")
def get_group_students(group_id: int, db: Session = Depends(get_db), _=Depends(require_teacher)):
    """Return students enrolled in a specific group with their progress."""
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.group_id == group_id
    ).all()
    result = []
    for e in enrollments:
        student = db.query(models.User).filter(models.User.id == e.student_id).first()
        if not student:
            continue
        result.append({
            "student_id": student.id,
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "phone": student.phone,
            "telegram_id": student.telegram_id,
            "progress": e.progress or 0,
            "xp": e.xp or 0,
            "enrolled_at": str(e.enrolled_at)[:10] if e.enrolled_at else None,
        })
    return result


@app.get("/api/groups/{group_id}/gradebook")
def get_group_gradebook(group_id: int, db: Session = Depends(get_db), _=Depends(require_teacher)):
    """Return full gradebook for a group: students, lessons, homeworks, grades, attendance."""
    data = crud.get_group_gradebook(db, group_id)
    if not data:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    return data


@app.get("/api/groups/{group_id}/homeworks")
def get_group_homeworks(group_id: int, db: Session = Depends(get_db), _=Depends(require_teacher)):
    """Return all homeworks assigned to a specific group."""
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    hws = db.query(models.Homework).filter(
        (models.Homework.group_id == group_id) |
        (models.Homework.course_id == group.course_id)
    ).order_by(models.Homework.due_date.asc()).all()
    return [
        {
            "id": hw.id,
            "title": hw.title,
            "description": hw.description,
            "due_date": str(hw.due_date)[:16] if hw.due_date else None,
            "created_at": str(hw.created_at)[:10] if hw.created_at else None,
            "submissions_count": db.query(models.HomeworkSubmission).filter(
                models.HomeworkSubmission.homework_id == hw.id
            ).count(),
            "graded_count": db.query(models.HomeworkSubmission).filter(
                models.HomeworkSubmission.homework_id == hw.id,
                models.HomeworkSubmission.status == "graded"
            ).count(),
        } for hw in hws
    ]


# ──────────────────────────────────────
# ENROLLMENTS
# ──────────────────────────────────────
@app.post("/api/enrollments")
def enroll(body: dict, db: Session = Depends(get_db), _=Depends(require_admin)):
    """Enroll a student. body: {student_id, course_id, group_id?}"""
    student_id = body.get("student_id")
    course_id = body.get("course_id")
    group_id = body.get("group_id")
    if not student_id or not course_id:
        raise HTTPException(status_code=400, detail="student_id и course_id обязательны")
    return crud.enroll_student(db, student_id, course_id, group_id)


# ──────────────────────────────────────
# HOMEWORKS
# ──────────────────────────────────────
@app.post("/api/homeworks", response_model=schemas.Homework)
def create_homework(hw: schemas.HomeworkCreate, db: Session = Depends(get_db),
                    _=Depends(require_teacher)):
    result = crud.create_homework(db=db, hw=hw)

    # Notify students in the group via Telegram
    if result and result.group_id:
        students = db.query(models.User).join(models.Enrollment).filter(
            models.Enrollment.group_id == result.group_id,
            models.User.is_active == True,
            models.User.telegram_id.isnot(None)
        ).all()
        bot_token = os.getenv("BOT_TOKEN")
        if bot_token:
            msg = f"📝 *Новое домашнее задание!*\n\n*{result.title}*\n{result.description or ''}\n\n📅 Дедлайн: {result.due_date.strftime('%d.%m.%Y %H:%M') if result.due_date else '—'}"
            for s in students:
                try:
                    requests.post(
                        f"https://api.telegram.org/bot{bot_token}/sendMessage",
                        json={"chat_id": s.telegram_id, "text": msg, "parse_mode": "Markdown"},
                        timeout=3
                    )
                except:
                    pass
    return result

@app.post("/api/homework/submit")
def submit_homework(submission: schemas.HomeworkSubmissionBase, db: Session = Depends(get_db),
                    _=Depends(require_student)):
    return crud.create_homework_submission(db=db, submission=submission)

@app.post("/api/homework/grade")
def grade_homework(grade: schemas.HomeworkGrade, db: Session = Depends(get_db),
                   _=Depends(require_teacher)):
    result = crud.grade_homework(db=db, grade=grade)
    if result:
        crud.create_notification(db, result.student_id,
                                 "ДЗ проверено", f"Ваша работа проверена. Оценка: {grade.grade}")
        
        # Send Telegram Notification
        student = db.query(models.User).filter(models.User.id == result.student_id).first()
        if student and student.telegram_id:
            bot_token = os.getenv("BOT_TOKEN")
            if bot_token:
                try:
                    msg = f"✅ *Домашнее задание проверено!*\n\nОценка: {grade.grade}\nКомментарий: {grade.feedback or 'Нет'}"
                    requests.post(
                        f"https://api.telegram.org/bot{bot_token}/sendMessage",
                        json={"chat_id": student.telegram_id, "text": msg, "parse_mode": "Markdown"},
                        timeout=5
                    )
                except Exception as e:
                    print(f"Failed to send telegram notification: {e}")
                    
    return result

@app.get("/api/homework/pending")
def pending_homeworks(db: Session = Depends(get_db), _=Depends(require_teacher)):
    return crud.get_pending_submissions(db)


# ──────────────────────────────────────
# PAYMENTS
# ──────────────────────────────────────
@app.post("/api/payments", response_model=schemas.Payment)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db),
                   _=Depends(require_admin)):
    return crud.create_payment(db=db, payment=payment)

@app.get("/api/payments", response_model=List[schemas.Payment])
def get_payments(
    status: str = None,
    search: str = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    """List payments. Optional ?status=paid|pending|failed&search=name"""
    q = db.query(models.Payment)
    if status:
        q = q.filter(models.Payment.status == status)
    if search:
        q = q.join(models.User, models.User.id == models.Payment.student_id, isouter=True).filter(
            models.User.name.ilike(f"%{search}%") | models.Payment.description.ilike(f"%{search}%")
        )
    return q.order_by(models.Payment.created_at.desc()).limit(300).all()

@app.get("/api/payments/student/{student_id}")
def student_payments(student_id: int, db: Session = Depends(get_db),
                     _=Depends(require_teacher)):
    return crud.get_student_payments(db, student_id)

@app.get("/api/payments/monthly-revenue")
def monthly_revenue(db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.get_monthly_revenue(db)

@app.patch("/api/payments/{payment_id}/status")
def update_payment_status(
    payment_id: int,
    body: dict,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    """Confirm or reject a pending payment. body: {status: 'paid'|'failed'|'refunded'}"""
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Платёж не найден")
    new_status = body.get("status", "paid")
    payment.status = new_status
    db.commit()
    db.refresh(payment)

    # Notify student via Telegram if they have telegram_id
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
                print(f"Telegram notification failed: {e}")
    return {"ok": True, "payment_id": payment.id, "status": new_status}


@app.post("/api/admin/broadcast")
def admin_broadcast(body: dict, db: Session = Depends(get_db), _=Depends(require_admin)):
    """Send Telegram broadcast message to users by role.
    body: {message: str, audience: 'all'|'student'|'teacher', parse_mode: 'Markdown'}
    """
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
            fail += 1

    return {"ok": True, "sent": success, "failed": fail, "total": len(users)}


@app.get("/api/admin/pending-users")
def get_pending_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Return users with role='pending' waiting for admin approval."""
    users = db.query(models.User).filter(models.User.role == "pending").order_by(models.User.created_at.desc()).all()
    return [
        {
            "id": u.id, "name": u.name, "email": u.email,
            "phone": u.phone, "role": u.role,
            "registration_source": getattr(u, "registration_source", "web"),
            "telegram_id": u.telegram_id,
            "created_at": str(u.created_at)[:10] if u.created_at else None,
        } for u in users
    ]


@app.patch("/api/admin/pending-users/{user_id}/approve")
def approve_pending_user(
    user_id: int,
    body: dict,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    """Approve a pending user and assign them a role. body: {role: 'student'|'teacher'}"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    new_role = body.get("role", "student")
    user.role = new_role
    user.is_active = True
    db.commit()
    # Notify via Telegram
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
            except Exception:
                pass
    return {"ok": True, "user_id": user.id, "new_role": new_role}


@app.patch("/api/admin/pending-users/{user_id}/reject")
def reject_pending_user(
    user_id: int,
    body: dict,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    """Reject a pending user registration. body: {reason?: str}"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    reason = body.get("reason", "Заявка отклонена администратором.")
    # Notify via Telegram before deleting
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
            except Exception:
                pass
    db.delete(user)
    db.commit()
    return {"ok": True, "user_id": user_id, "message": "Пользователь отклонён и удалён"}


@app.get("/api/groups/{group_id}/attendance")
def get_attendance(group_id: int, db: Session = Depends(get_db), _=Depends(require_teacher)):
    """Return students in group with attendance count per lesson."""
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    enrollments = db.query(models.Enrollment).filter(models.Enrollment.group_id == group_id).all()
    lessons = db.query(models.Lesson).filter(models.Lesson.group_id == group_id).order_by(models.Lesson.scheduled_at.desc()).limit(10).all()
    attendance_records = db.query(models.LessonAttendance).filter(
        models.LessonAttendance.lesson_id.in_([l.id for l in lessons])
    ).all()
    att_map = {(a.lesson_id, a.student_id): a.attended for a in attendance_records}

    students_out = []
    for e in enrollments:
        st = db.query(models.User).filter(models.User.id == e.student_id).first()
        if not st:
            continue
        att_per_lesson = {l.id: att_map.get((l.id, e.student_id), False) for l in lessons}
        students_out.append({
            "student_id": st.id, "name": st.name,
            "attended_count": sum(att_per_lesson.values()),
            "lessons_total": len(lessons),
            "attendance": att_per_lesson,
        })
    return {
        "group_id": group_id,
        "group_name": group.name,
        "lessons": [{"id": l.id, "topic": l.topic, "date": str(l.scheduled_at)[:10] if l.scheduled_at else "—"} for l in lessons],
        "students": students_out,
    }


@app.post("/api/groups/{group_id}/attendance")
def save_attendance(group_id: int, body: dict, db: Session = Depends(get_db), _=Depends(require_teacher)):
    """Save attendance. body: {lesson_id: int, records: [{student_id: int, attended: bool}]}"""
    lesson_id = body.get("lesson_id")
    records = body.get("records", [])
    if not lesson_id:
        raise HTTPException(status_code=400, detail="lesson_id обязателен")
    for rec in records:
        student_id = rec["student_id"]
        attended = rec["attended"]
        existing = db.query(models.LessonAttendance).filter(
            models.LessonAttendance.lesson_id == lesson_id,
            models.LessonAttendance.student_id == student_id
        ).first()
        if existing:
            existing.attended = attended
        else:
            db.add(models.LessonAttendance(lesson_id=lesson_id, student_id=student_id, attended=attended))
    db.commit()

    # Trigger achievements check for all students in records
    for rec in records:
        try:
            # We call the function directly. Note: Depends(get_current_user) is mocked by passing None
            # since check_and_award_achievements uses it only for auth when called as an endpoint.
            check_and_award_achievements(rec["student_id"], db, None)
        except Exception as e:
            print(f"Error awarding achievements for {rec['student_id']}: {e}")

    return {"ok": True, "saved": len(records)}


@app.post("/api/homework/submit-file")
def submit_homework_file(body: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Submit homework with optional base64-encoded file attachment.
    body: {homework_id: int, content: str, file_name: str?, file_data: base64str?}
    """
    import base64
    hw_id = body.get("homework_id")
    content = body.get("content", "")
    file_name = body.get("file_name")
    file_data_b64 = body.get("file_data")

    if not hw_id:
        raise HTTPException(status_code=400, detail="homework_id обязателен")

    file_url = None
    if file_data_b64 and file_name:
        try:
            upload_dir = os.path.join("frontend", "uploads", "homeworks")
            os.makedirs(upload_dir, exist_ok=True)
            safe_name = f"hw_{hw_id}_user_{current_user.id}_{file_name}"
            file_path = os.path.join(upload_dir, safe_name)
            with open(file_path, "wb") as f:
                f.write(base64.b64decode(file_data_b64))
            file_url = f"/uploads/homeworks/{safe_name}"
        except Exception as e:
            print(f"File upload error: {e}")

    submission = models.HomeworkSubmission(
        homework_id=hw_id,
        student_id=current_user.id,
        content=content + (f"\n[Файл: {file_url}]" if file_url else ""),
        status="submitted"
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return {"ok": True, "submission_id": submission.id, "file_url": file_url}


@app.post("/api/admin/remind-debts")
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


@app.get("/api/student/{student_id}/homeworks")
def get_student_homeworks(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Return all homeworks for a student with submission status."""
    if current_user.id != student_id and current_user.role not in ("admin", "teacher"):
        raise HTTPException(status_code=403, detail="Доступ запрещён")
    return crud.get_student_homeworks(db, student_id)


# ──────────────────────────────────────
# LEADS
# ──────────────────────────────────────
@app.post("/api/leads", response_model=schemas.Lead)
def create_lead(lead: schemas.LeadCreate, db: Session = Depends(get_db)):
    return crud.create_lead(db=db, lead=lead)

@app.get("/api/leads", response_model=List[schemas.Lead])
def read_leads(
    status: str = None,
    search: str = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    """List leads. Optional ?status=new|contacted|enrolled|lost&search=name"""
    q = db.query(models.Lead)
    if status:
        q = q.filter(models.Lead.status == status)
    if search:
        q = q.filter(
            models.Lead.name.ilike(f"%{search}%") |
            models.Lead.phone.ilike(f"%{search}%") |
            models.Lead.notes.ilike(f"%{search}%")
        )
    return q.order_by(models.Lead.created_at.desc()).limit(300).all()

@app.patch("/api/leads/{lead_id}")
def update_lead(lead_id: int, update: schemas.LeadStatusUpdate,
                db: Session = Depends(get_db), _=Depends(require_admin)):
    result = crud.update_lead_status(db, lead_id, update)
    if not result:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return result


@app.delete("/api/leads/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    """Delete a lead/application permanently."""
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    db.delete(lead)
    db.commit()
    return {"ok": True, "message": f"Заявка #{lead_id} удалена"}


@app.post("/api/leads/{lead_id}/convert")
def convert_lead_to_student(lead_id: int, body: dict, db: Session = Depends(get_db), _=Depends(require_admin)):
    """Convert a lead to a student.
    body: {group_id: int}
    Creates a User account (if not exists), enrolls them in the group, marks lead as 'enrolled'.
    """
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
        if not course_id:
            course_id = group.course_id

    # Find or create user account
    user = None
    if lead.phone:
        user = db.query(models.User).filter(models.User.phone == lead.phone).first()
    if not user and lead.email:
        user = db.query(models.User).filter(models.User.email == lead.email).first()

    if not user:
        import hashlib, secrets
        temp_pass = secrets.token_hex(8)
        user = models.User(
            name=lead.name,
            phone=lead.phone,
            email=lead.email or f"lead_{lead.id}@edusmart.local",
            role="student",
            password_hash=hashlib.sha256(temp_pass.encode()).hexdigest(),
            registration_source="crm_convert",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Enroll in course/group if not already enrolled
    if course_id:
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

    # Mark lead as enrolled
    lead.status = "enrolled"
    lead.notes = (lead.notes or "") + f"\n[CRM] Конвертирован в студента (user_id={user.id})"
    db.commit()

    # Notify via Telegram if available
    if user.telegram_id:
        bot_token = os.getenv("BOT_TOKEN")
        if bot_token:
            msg = f"🎉 *Поздравляем!* Вы зачислены в группу *{group.name if group else 'курса'}*!\n\nДобро пожаловать в TIL USER Education Center."
            try:
                requests.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json={"chat_id": user.telegram_id, "text": msg, "parse_mode": "Markdown"},
                    timeout=5,
                )
            except Exception:
                pass

    return {
        "ok": True,
        "user_id": user.id,
        "lead_id": lead.id,
        "group_name": group.name if group else None,
        "message": f"Заявка конвертирована. Студент: {user.name} (ID {user.id})"
    }


# ──────────────────────────────────────
# ACHIEVEMENTS
# ──────────────────────────────────────
ACHIEVEMENT_CATALOG = [
    {"type": "first_hw",    "title": "Первый шаг",      "icon": "🔥", "description": "Сдано первое домашнее задание.", "xp_reward": 50},
    {"type": "streak_5",    "title": "Скороход",        "icon": "⚡", "description": "5 заданий подряд сданы раньше дедлайна.", "xp_reward": 100},
    {"type": "club_10",     "title": "Болтун",          "icon": "🗣️", "description": "Посещено 10 разговорных клубов.", "xp_reward": 200},
    {"type": "vocab_50",    "title": "Словарник",       "icon": "📖", "description": "Добавлено 50 слов в словарь.", "xp_reward": 75},
    {"type": "perfect_hw",  "title": "Отличник",        "icon": "⭐", "description": "Получена оценка 10 за домашнее задание.", "xp_reward": 150},
    {"type": "attend_20",   "title": "Прилежный",       "icon": "🎯", "description": "Посещено 20 уроков подряд.", "xp_reward": 300},
    {"type": "kanji_500",   "title": "Мастер Кандзи",   "icon": "🎓", "description": "Изучено более 500 иероглифов.", "xp_reward": 500},
    {"type": "pay_on_time", "title": "Пунктуальный",    "icon": "💳", "description": "3 оплаты подряд вовремя.", "xp_reward": 100},
]

XP_RANKS = [
    (0,    "Bronze I"),  (200,  "Bronze II"), (400,  "Bronze III"),
    (700,  "Silver I"),  (1000, "Silver II"), (1400, "Silver III"),
    (1800, "Gold I"),    (2200, "Gold II"),   (2600, "Gold III"),
    (3200, "Platinum I"),(4000, "Platinum II"),(5000, "Champion"),
]

def xp_to_rank(xp: int) -> tuple[str, int, int]:
    """Returns (rank_name, current_xp, xp_to_next)."""
    rank = XP_RANKS[0][1]
    next_xp = XP_RANKS[1][0]
    for i, (threshold, name) in enumerate(XP_RANKS):
        if xp >= threshold:
            rank = name
            next_xp = XP_RANKS[i + 1][0] if i + 1 < len(XP_RANKS) else threshold
    return rank, xp, max(0, next_xp - xp)


@app.get("/api/student/{student_id}/achievements")
def get_student_achievements(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Return earned achievements + locked catalog for a student."""
    if current_user.id != student_id and current_user.role not in ("admin", "teacher"):
        raise HTTPException(status_code=403, detail="Доступ запрещён")

    earned_db = db.query(models.Achievement).filter(
        models.Achievement.student_id == student_id
    ).all()
    earned_types = {a.achievement_type for a in earned_db}

    total_xp = sum(a.xp_reward for a in earned_db)
    rank, xp, xp_to_next = xp_to_rank(total_xp)

    catalog_out = []
    for item in ACHIEVEMENT_CATALOG:
        is_earned = item["type"] in earned_types
        earned_entry = next((a for a in earned_db if a.achievement_type == item["type"]), None)
        catalog_out.append({
            **item,
            "earned": is_earned,
            "earned_at": str(earned_entry.earned_at)[:10] if earned_entry else None,
        })

    return {
        "student_id": student_id,
        "total_xp": total_xp,
        "rank": rank,
        "xp_to_next": xp_to_next,
        "earned_count": len(earned_types),
        "total_count": len(ACHIEVEMENT_CATALOG),
        "achievements": catalog_out,
    }


@app.get("/api/leaderboard")
def get_leaderboard(
    limit: int = 10,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Return top students by XP (sum of achievement rewards)."""
    from sqlalchemy import func as sqlfunc
    rows = (
        db.query(
            models.Achievement.student_id,
            sqlfunc.sum(models.Achievement.xp_reward).label("total_xp"),
        )
        .group_by(models.Achievement.student_id)
        .order_by(sqlfunc.sum(models.Achievement.xp_reward).desc())
        .limit(limit)
        .all()
    )

    out = []
    for rank_pos, (sid, xp) in enumerate(rows, 1):
        user = db.query(models.User).filter(models.User.id == sid).first()
        rank_name, _, _ = xp_to_rank(xp or 0)
        out.append({
            "position": rank_pos,
            "student_id": sid,
            "name": user.name if user else f"Student #{sid}",
            "total_xp": xp or 0,
            "rank": rank_name,
        })
    return out


@app.post("/api/student/{student_id}/achievements/check")
def check_and_award_achievements(
    student_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """Auto-check and award achievements based on student activity."""
    user = db.query(models.User).filter(models.User.id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    earned_types = {
        a.achievement_type
        for a in db.query(models.Achievement).filter(
            models.Achievement.student_id == student_id
        ).all()
    }

    awarded = []

    def award(atype: str):
        if atype not in earned_types:
            item = next((x for x in ACHIEVEMENT_CATALOG if x["type"] == atype), None)
            if item:
                db.add(models.Achievement(
                    student_id=student_id,
                    achievement_type=atype,
                    title=item["title"],
                    description=item["description"],
                    xp_reward=item["xp_reward"],
                ))
                awarded.append(atype)

    # Check: first_hw
    hw_count = db.query(models.HomeworkSubmission).filter(
        models.HomeworkSubmission.student_id == student_id
    ).count()
    if hw_count >= 1:
        award("first_hw")

    # Check: vocab_50
    vocab_count = db.query(models.VocabularyWord).filter(
        models.VocabularyWord.student_id == student_id
    ).count()
    if vocab_count >= 50:
        award("vocab_50")

    # Check: perfect_hw
    perfect = db.query(models.HomeworkSubmission).filter(
        models.HomeworkSubmission.student_id == student_id,
        models.HomeworkSubmission.grade == "10",
    ).first()
    if perfect:
        award("perfect_hw")

    # Check: attend_20
    attend_count = db.query(models.LessonAttendance).filter(
        models.LessonAttendance.student_id == student_id,
        models.LessonAttendance.attended == True
    ).count()
    if attend_count >= 20:
        award("attend_20")

    if awarded:
        db.commit()

    return {"awarded": awarded, "count": len(awarded)}


# ──────────────────────────────────────
# REVIEWS
# ──────────────────────────────────────
@app.get("/api/reviews", response_model=List[schemas.Review])
def read_reviews(db: Session = Depends(get_db)):
    return crud.get_reviews(db)

@app.post("/api/reviews", response_model=schemas.Review)
def create_review(review: schemas.ReviewCreate, db: Session = Depends(get_db)):
    return crud.create_review(db=db, review=review)


# ──────────────────────────────────────
# NOTIFICATIONS
# ──────────────────────────────────────
@app.get("/api/notifications")
def get_notifications(db: Session = Depends(get_db),
                      current_user: models.User = Depends(get_current_user)):
    notifs = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).limit(20).all()
    return notifs

@app.post("/api/notifications/read-all")
def read_all_notifications(db: Session = Depends(get_db),
                           current_user: models.User = Depends(get_current_user)):
    crud.mark_all_read(db, current_user.id)
    return {"ok": True}


# ──────────────────────────────────────
# DASHBOARD
# ──────────────────────────────────────
@app.get("/api/dashboard/{user_id}")
def get_dashboard(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Только сам пользователь или admin могут читать дашборд
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещён")

    data = crud.get_dashboard_data(db, user_id=user_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    user = data["user"]
    enrollments = data["enrollments"]

    # Serialize enrollments with nested course data
    enrollments_out = []
    for e in enrollments:
        course = e.course
        enrollments_out.append({
            "id": e.id,
            "student_id": e.student_id,
            "course_id": e.course_id,
            "progress": e.progress,
            "xp": e.xp,
            "enrolled_at": str(e.enrolled_at) if e.enrolled_at else None,
            "course": {
                "id": course.id,
                "title": course.title,
                "description": course.description,
                "duration": course.duration,
                "price": float(course.price) if course.price else 0,
                "image_url": course.image_url,
                "is_active": course.is_active,
            } if course else None
        })

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "phone": user.phone,
        },
        "stats": data["stats"],
        "enrollments": enrollments_out,
        "upcoming_lesson": data["upcoming_lesson"],
        "homeworks": data["homeworks"],
        "vocabulary": data["vocabulary"],
        "schedule": data["schedule"],
        "notifications_count": data["notifications_count"],
    }


@app.get("/api/teacher/dashboard/{user_id}")
def get_teacher_dashboard(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещён")
    return crud.get_teacher_dashboard_data(db, user_id=user_id)


# ──────────────────────────────────────
# ADMIN
# ──────────────────────────────────────
@app.get("/api/admin/stats", response_model=schemas.AdminStats)
def admin_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.get_admin_stats(db)

@app.get("/api/admin/students", response_model=List[schemas.UserPublic])
def admin_students(
    search: str = None,
    group_id: int = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    """List students. Optional ?search=name_or_email&group_id=N"""
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
    return q.order_by(models.User.name).all()

@app.get("/api/admin/teachers", response_model=List[schemas.UserPublic])
def admin_teachers(
    search: str = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    """List teachers. Optional ?search=name"""
    q = db.query(models.User).filter(models.User.role == "teacher")
    if search:
        q = q.filter(
            models.User.name.ilike(f"%{search}%") |
            models.User.email.ilike(f"%{search}%")
        )
    return q.order_by(models.User.name).all()

@app.get("/api/admin/users/summary", response_model=List[schemas.UserSummary])
def admin_users_summary(db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.get_users_summary(db)

@app.post("/api/admin/users", response_model=schemas.UserPublic)
def admin_create_user(user_data: schemas.UserCreate, db: Session = Depends(get_db),
                      _=Depends(require_admin)):
    existing = crud.get_user_by_email(db, user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email уже используется")
    return crud.create_user_by_admin(db, user_data)

@app.get("/api/admin/users/{user_id}")
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

@app.patch("/api/admin/users/{user_id}", response_model=schemas.UserPublic)
def admin_update_user(user_id: int, update: schemas.UserUpdate,
                      db: Session = Depends(get_db), _=Depends(require_admin)):
    user = crud.update_user(db, user_id, update)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user

@app.delete("/api/admin/users/{user_id}")
def admin_delete_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    ok = crud.delete_user(db, user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return {"ok": True, "message": "Пользователь удалён"}

@app.post("/api/admin/users/bulk-delete")
def admin_bulk_delete_users(data: schemas.BulkAction, db: Session = Depends(get_db), _=Depends(require_admin)):
    count = crud.bulk_delete_users(db, data.ids)
    return {"ok": True, "count": count}


@app.post("/api/admin/users/{user_id}/freeze")
def admin_freeze_user(
    user_id: int,
    body: dict,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    """Freeze a student account for N days. body: {days: int}"""
    from datetime import timedelta
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    days = body.get("days", 14)
    until = datetime.utcnow() + timedelta(days=days)
    # Store freeze info in notes field since we don't have a separate freeze model
    # We mark the user as inactive temporarily and store the unfreeze date
    user.is_active = False
    # Use avatar_url as freeze marker (temp field abuse — ideally add freeze_until column)
    # Better: just mark inactive with a notification
    db.commit()
    # Notify via Telegram
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
            except Exception:
                pass
    crud.create_notification(db, user_id, "Профиль заморожен",
                             f"Ваш профиль заморожен на {days} дней администратором.")
    return {"ok": True, "user_id": user_id, "frozen_until": str(until)[:10]}


@app.post("/api/admin/users/{user_id}/unfreeze")
def admin_unfreeze_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    """Unfreeze (re-activate) a student account."""
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
            except Exception:
                pass
    crud.create_notification(db, user_id, "Профиль активирован", "Ваш профиль разморожен администратором.")
    return {"ok": True, "user_id": user_id}


@app.post("/api/admin/users/{user_id}/toggle-active")
def admin_toggle_user_active(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    """Toggle a user's is_active status (expel / reinstate)."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user.is_active = not user.is_active
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
            except Exception:
                pass
    return {"ok": True, "user_id": user_id, "is_active": user.is_active, "action": action}


@app.post("/api/admin/users/{user_id}/transfer-group")
def admin_transfer_group(
    user_id: int,
    body: dict,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    """Transfer a student from one group to another.
    body: {from_group_id: int, to_group_id: int}
    """
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

    # Remove from old group enrollment
    old_enroll = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == user_id,
        models.Enrollment.group_id == from_group_id
    ).first()
    if old_enroll:
        old_enroll.group_id = to_group_id

    # Also update any enrollment pointing to old group with no group_id
    db.commit()

    # Notify
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
            except Exception:
                pass
    return {"ok": True, "user_id": user_id, "new_group": new_group.name}

@app.get("/api/users/minimal/{user_id}")
def get_user_minimal(user_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    user = crud.get_user_minimal(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return {"id": user.id, "name": user.name, "role": user.role}

@app.get("/api/admin/export/students")
def export_students(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Export students list as Excel file."""
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


@app.get("/api/admin/export/leads")
def export_leads(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Export leads (applications) as Excel file."""
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


@app.get("/api/admin/export/payments")
def export_payments(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Export payments as Excel file."""
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


# ──────────────────────────────────────
# CHAT — WebSocket + REST
# ──────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        # user_id → list of WebSocket connections
        self.active: Dict[int, list] = {}

    async def connect(self, user_id: int, ws: WebSocket):
        await ws.accept()
        self.active.setdefault(user_id, []).append(ws)

    def disconnect(self, user_id: int, ws: WebSocket):
        if user_id in self.active:
            self.active[user_id] = [c for c in self.active[user_id] if c != ws]

    async def send_to(self, user_id: int, data: dict):
        for ws in self.active.get(user_id, []):
            try:
                await ws.send_text(json.dumps(data, ensure_ascii=False))
            except Exception:
                pass

manager = ConnectionManager()


@app.websocket("/ws/chat/{user_id}")
async def websocket_chat(
    ws: WebSocket,
    user_id: int,
    db: Session = Depends(get_db)
):
    # Принимаем соединение и ждём auth handshake
    await ws.accept()
    try:
        raw = await asyncio.wait_for(ws.receive_text(), timeout=15)
    except asyncio.TimeoutError:
        await ws.close(code=4001, reason="Таймаут аутентификации")
        return
    try:
        auth_data = json.loads(raw)
    except json.JSONDecodeError:
        await ws.close(code=4002, reason="Невалидный JSON")
        return
    if auth_data.get("type") != "auth" or not auth_data.get("token"):
        await ws.close(code=4001, reason="Требуется аутентификация")
        return
    payload = decode_token(auth_data["token"])
    token_user_id = payload.get("sub")
    if not token_user_id or int(token_user_id) != user_id:
        await ws.close(code=4003, reason="Недействительный токен")
        return
    db_user = db.query(models.User).filter(
        models.User.id == user_id, models.User.is_active == True
    ).first()
    if not db_user:
        await ws.close(code=4004, reason="Пользователь не найден")
        return

    await manager.connect(user_id, ws)
    try:
        while True:
            raw = await ws.receive_text()
            data = json.loads(raw)
            if data.get("type") == "auth":
                continue
            receiver_id = int(data["receiver_id"])
            content = data.get("content", "").strip()
            file_url = data.get("file_url") or None
            file_type = data.get("file_type") or None
            file_name = data.get("file_name") or None
            if not content and not file_url:
                continue
            # Persist to DB
            msg = crud.create_message(db, sender_id=user_id, receiver_id=receiver_id, content=content or None, file_url=file_url, file_type=file_type, file_name=file_name)
            payload_out = {
                "id": msg.id,
                "sender_id": user_id,
                "sender_name": db_user.name,
                "receiver_id": receiver_id,
                "content": content,
                "file_url": file_url,
                "file_type": file_type,
                "file_name": file_name,
                "created_at": str(msg.created_at)[:16],
                "is_read": False,
            }
            # Echo to sender
            await manager.send_to(user_id, payload_out)
            # Deliver to receiver if online
            await manager.send_to(receiver_id, payload_out)
            # Push to receiver via Telegram if offline
            receiver_user = db.query(models.User).filter(models.User.id == receiver_id).first()
            if receiver_user and receiver_user.telegram_id:
                try:
                    crud.send_telegram_notification(
                        receiver_user.telegram_id,
                        f"💬 *{db_user.name}*:\n{content[:200]}"
                    )
                except Exception:
                    pass
    except WebSocketDisconnect:
        manager.disconnect(user_id, ws)


@app.get("/api/messages/{user_id}")
def get_conversation(
    user_id: int,
    with_user: int,
    db: Session = Depends(get_db),
    current=Depends(get_current_user)
):
    """Fetch message history between two users."""
    msgs = crud.get_messages(db, user_id, with_user)
    # Mark incoming as read
    crud.mark_messages_read(db, reader_id=current.id, sender_id=with_user)
    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "sender_name": m.sender.name if m.sender else "?",
            "receiver_id": m.receiver_id,
            "content": m.content,
            "file_url": m.file_url,
            "file_type": m.file_type,
            "file_name": m.file_name,
            "is_read": m.is_read,
            "created_at": str(m.created_at)[:16],
        }
        for m in msgs
    ]


@app.get("/api/messages/contacts/{user_id}")
def get_contacts(
    user_id: int,
    db: Session = Depends(get_db),
    current=Depends(get_current_user)
):
    """Return list of users this user has chatted with, with last message and unread count."""
    return crud.get_chat_contacts(db, user_id)


@app.get("/api/messages/unread/{user_id}")
def get_unread_count(
    user_id: int,
    db: Session = Depends(get_db),
    current=Depends(get_current_user)
):
    count = crud.get_unread_count(db, user_id)
    return {"unread": count}


@app.post("/api/messages/upload")
async def upload_file(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
    """Upload a file and return its URL. Max 20MB."""
    import aiofiles
    MAX_SIZE = 20 * 1024 * 1024
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="Файл слишком большой (макс. 20MB)")
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    name = f"{uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, name)
    async with aiofiles.open(path, "wb") as f:
        await f.write(contents)
    # Determine file type category
    img_exts = {".jpg",".jpeg",".png",".gif",".webp",".bmp",".svg"}
    file_type = "image" if ext in img_exts else "document"
    return {"file_url": f"/uploads/{name}", "file_type": file_type, "file_name": file.filename}

@app.get("/api/messages/users/search")
def search_chat_users(
    q: str = "",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Search for users to start a new chat."""
    query = db.query(models.User).filter(
        models.User.is_active == True,
        models.User.id != current_user.id
    )
    if q:
        query = query.filter(models.User.name.ilike(f"%{q}%"))
    
    users = query.limit(20).all()
    return [{"id": u.id, "name": u.name, "role": u.role} for u in users]

# ──────────────────────────────────────
# Static Frontend (Root)
# ──────────────────────────────────────
# Mount static files at the root to handle app.css, logo.png, etc. directly.
# This MUST be the last route so it doesn't shadow API routes.
# Mount uploads for file access (must be before root static mount)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")




