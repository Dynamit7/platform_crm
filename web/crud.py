from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, date, timedelta
import models, schemas
from auth import get_password_hash, verify_password
import os
import requests

BOT_SYNC_URL = os.getenv("BOT_SYNC_URL", "http://127.0.0.1:8080/api/web/sync-user")

def send_telegram_notification(telegram_id: int, message: str):
    bot_token = os.getenv("BOT_TOKEN")
    if not bot_token or not telegram_id:
        return False
    try:
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        resp = requests.post(url, json={"chat_id": telegram_id, "text": message, "parse_mode": "Markdown"}, timeout=5)
        return resp.status_code == 200
    except Exception as e:
        print(f"Telegram notification error: {e}")
        return False


# ─────────────────────────────────────
# Auth
# ─────────────────────────────────────
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserRegister):
    db_user = models.User(
        name=user.name,
        email=user.email,
        phone=user.phone,
        password_hash=get_password_hash(user.password),
        role="student",  # при самостоятельной регистрации всегда student
        registration_source="web",
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Sync to bot
    try:
        requests.post(
            BOT_SYNC_URL,
            json={
                "id": db_user.id,
                "name": db_user.name,
                "email": db_user.email,
                "phone": db_user.phone,
                "role": db_user.role
            },
            timeout=3
        )
    except Exception as e:
        print(f"Failed to sync user to bot: {e}")
        
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user or not user.password_hash:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


# ─────────────────────────────────────
# Users
# ─────────────────────────────────────
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_all_students(db: Session, skip: int = 0, limit: int = 200):
    return db.query(models.User).filter(models.User.role == "student").offset(skip).limit(limit).all()

def get_all_teachers(db: Session):
    return db.query(models.User).filter(models.User.role == "teacher").all()

def get_all_users(db: Session, skip: int = 0, limit: int = 500):
    return db.query(models.User).offset(skip).limit(limit).all()

def create_user_by_admin(db: Session, user_data: schemas.UserCreate):
    db_user = models.User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role,
        registration_source="web",
        is_active=True
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Sync to bot
    try:
        requests.post(
            BOT_SYNC_URL,
            json={
                "id": db_user.id,
                "name": db_user.name,
                "email": db_user.email,
                "phone": db_user.phone,
                "role": db_user.role
            },
            timeout=3
        )
    except Exception as e:
        print(f"Failed to sync user to bot: {e}")

    return db_user

def update_user(db: Session, user_id: int, update: schemas.UserUpdate):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None
    if update.name is not None:
        user.name = update.name
    if update.email is not None:
        user.email = update.email
    if update.phone is not None:
        user.phone = update.phone
    if update.role is not None:
        user.role = update.role
    if update.is_active is not None:
        user.is_active = update.is_active
    if update.password is not None:
        user.password_hash = get_password_hash(update.password)
    db.commit()
    db.refresh(user)
    
    # Sync to bot
    try:
        requests.post(
            BOT_SYNC_URL,
            json={
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role
            },
            timeout=3
        )
    except Exception as e:
        print(f"Failed to sync user update to bot: {e}")

    return user

def delete_user(db: Session, user_id: int) -> bool:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return False
    db.delete(user)
    db.commit()
    return True

def bulk_delete_users(db: Session, user_ids: list[int]) -> int:
    deleted = db.query(models.User).filter(models.User.id.in_(user_ids)).delete(synchronize_session=False)
    db.commit()
    return deleted

def get_or_create_student_profile(db: Session, user_id: int):
    student = db.query(models.Student).filter(models.Student.user_id == user_id).first()
    if not student:
        student = models.Student(
            user_id=user_id,
            is_active=True,
            level=1,
            xp=0,
            streak_days=0,
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    return student

def get_user_minimal(db: Session, user_id: int):
    return db.query(models.User.id, models.User.name, models.User.role).filter(models.User.id == user_id).first()

def get_users_summary(db: Session, skip: int = 0, limit: int = 500):
    users = db.query(models.User).offset(skip).limit(limit).all()
    results = []
    for u in users:
        # Get latest payment
        latest_payment = db.query(models.Payment).filter(
            models.Payment.student_id == u.id
        ).order_by(models.Payment.created_at.desc()).first()
        
        # Get groups/courses
        enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.student_id == u.id
        ).all()
        group_names = []
        for e in enrollments:
            if e.group_id:
                group = db.query(models.Group).filter(models.Group.id == e.group_id).first()
                if group: group_names.append(group.name)
            else:
                course = db.query(models.Course).filter(models.Course.id == e.course_id).first()
                if course: group_names.append(course.title)
        
        results.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "phone": u.phone,
            "role": u.role,
            "is_active": u.is_active,
            "registration_source": u.registration_source,
            "created_at": u.created_at,
            "latest_payment_status": latest_payment.status if latest_payment else "none",
            "groups": group_names
        })
    return results

def get_student_detail(db: Session, student_id: int):
    user = get_user(db, student_id)
    if not user:
        return None
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == student_id
    ).all()
    payments = db.query(models.Payment).filter(
        models.Payment.student_id == student_id
    ).order_by(models.Payment.created_at.desc()).limit(20).all()
    submissions = db.query(models.HomeworkSubmission).filter(
        models.HomeworkSubmission.student_id == student_id
    ).order_by(models.HomeworkSubmission.submitted_at.desc()).limit(10).all()
    return {
        "user": user,
        "enrollments": enrollments,
        "payments": payments,
        "submissions": submissions,
    }


# ─────────────────────────────────────
# Courses
# ─────────────────────────────────────
def get_courses(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Course).offset(skip).limit(limit).all()

def get_course(db: Session, course_id: int):
    return db.query(models.Course).filter(models.Course.id == course_id).first()

def create_course(db: Session, course: schemas.CourseCreate):
    db_course = models.Course(**course.model_dump())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

def update_course(db: Session, course_id: int, data: schemas.CourseUpdate):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(db_course, key, val)
    db.commit()
    db.refresh(db_course)
    return db_course


# ─────────────────────────────────────
# Teachers
# ─────────────────────────────────────
def get_teachers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Teacher).offset(skip).limit(limit).all()

def create_teacher(db: Session, teacher: schemas.TeacherCreate):
    db_teacher = models.Teacher(**teacher.model_dump())
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher

def create_admin_teacher(db: Session, data: schemas.AdminTeacherCreate):
    """Create a User with role='teacher' and a linked Teacher record."""
    user = models.User(
        name=data.name,
        email=data.email,
        phone=data.phone,
        password_hash=get_password_hash(data.password),
        role="teacher",
        registration_source="web",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    teacher = models.Teacher(
        name=data.name,
        bio=data.bio,
        subjects=data.subjects,
        user_id=user.id,
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)

    # Sync to bot
    try:
        requests.post(
            os.getenv("BOT_SYNC_URL", "http://127.0.0.1:8080/api/web/sync-user"),
            json={
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "role": user.role,
            },
            timeout=3,
        )
    except Exception as e:
        print(f"Failed to sync teacher to bot: {e}")

    return user


# ─────────────────────────────────────
# Groups
# ─────────────────────────────────────
def get_groups(db: Session):
    return db.query(models.Group).all()

def get_group(db: Session, group_id: int):
    return db.query(models.Group).filter(models.Group.id == group_id).first()

def create_group(db: Session, group: schemas.GroupCreate):
    db_group = models.Group(**group.model_dump())
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group

def update_group(db: Session, group_id: int, data: schemas.GroupUpdate):
    db_group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not db_group:
        return None
    update_data = data.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(db_group, key, val)
    db.commit()
    db.refresh(db_group)
    return db_group


# ─────────────────────────────────────
# Lessons
# ─────────────────────────────────────
def get_lessons_by_group(db: Session, group_id: int):
    return db.query(models.Lesson).filter(models.Lesson.group_id == group_id).all()

def create_lesson(db: Session, lesson: schemas.LessonCreate):
    # Auto-fill from LessonTemplate if topic is empty
    if not lesson.topic or lesson.topic.strip() == "":
        group = db.query(models.Group).filter(models.Group.id == lesson.group_id).first()
        if group and group.teacher_id:
            template = db.query(models.LessonTemplate).filter(
                models.LessonTemplate.teacher_id == group.teacher_id,
                models.LessonTemplate.course_id == group.course_id
            ).order_by(models.LessonTemplate.id.desc()).first()
            if template:
                lesson.topic = template.topic
                if not lesson.description and template.objectives:
                    lesson.description = template.objectives

    db_lesson = models.Lesson(**lesson.model_dump())
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)
    
    # Notify students
    enrollments = db.query(models.Enrollment).filter(models.Enrollment.group_id == db_lesson.group_id).all()
    for e in enrollments:
        student = get_user(db, e.student_id)
        if student and student.telegram_id:
            msg = f"📅 *Новое занятие!*\n\nТема: {db_lesson.topic}\nДата: {db_lesson.scheduled_at.strftime('%d.%m.%Y %H:%M')}\n\nПожалуйста, не опаздывайте!"
            send_telegram_notification(student.telegram_id, msg)
            
    return db_lesson


# ─────────────────────────────────────
# Enrollments
# ─────────────────────────────────────
def enroll_student(db: Session, student_id: int, course_id: int, group_id: int = None):
    existing = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == student_id,
        models.Enrollment.course_id == course_id
    ).first()
    if existing:
        return existing
    enrollment = models.Enrollment(
        student_id=student_id,
        course_id=course_id,
        group_id=group_id
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    
    # Push Notification via Telegram
    student = get_user(db, student_id)
    if student and student.telegram_id:
        group_name = "новый курс"
        if group_id:
            group = db.query(models.Group).filter(models.Group.id == group_id).first()
            if group:
                group_name = group.name
        else:
            course = db.query(models.Course).filter(models.Course.id == course_id).first()
            if course:
                group_name = course.title
                
        msg = f"🎉 *Поздравляем!*\n\nВы успешно зачислены в группу/на курс: *{group_name}*.\nРасписание и детали уже доступны в вашем кабинете!"
        send_telegram_notification(student.telegram_id, msg)
        
    return enrollment


# ─────────────────────────────────────
# Homeworks
# ─────────────────────────────────────
def create_homework(db: Session, hw: schemas.HomeworkCreate):
    db_hw = models.Homework(**hw.model_dump())
    db.add(db_hw)
    db.commit()
    db.refresh(db_hw)
    return db_hw

def get_homeworks_by_course(db: Session, course_id: int):
    return db.query(models.Homework).filter(models.Homework.course_id == course_id).all()

def create_homework_submission(db: Session, submission: schemas.HomeworkSubmissionCreate):
    # Check if already submitted
    existing = db.query(models.HomeworkSubmission).filter(
        models.HomeworkSubmission.homework_id == submission.homework_id,
        models.HomeworkSubmission.student_id == submission.student_id
    ).first()
    if existing:
        existing.content = submission.content
        existing.status = "submitted"
        db.commit()
        db.refresh(existing)
        return existing
    db_sub = models.HomeworkSubmission(**submission.model_dump())
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub

def grade_homework(db: Session, grade: schemas.HomeworkGrade):
    submission = db.query(models.HomeworkSubmission).filter(
        models.HomeworkSubmission.id == grade.submission_id
    ).first()
    if submission:
        submission.grade = grade.grade
        submission.feedback = grade.feedback
        submission.status = "graded"
        submission.graded_at = datetime.utcnow()
        db.commit()
        db.refresh(submission)
    return submission

def get_pending_submissions(db: Session):
    results = db.query(
        models.HomeworkSubmission,
        models.User.name.label("student_name"),
        models.Homework.title.label("hw_title")
    ).join(
        models.User, models.User.id == models.HomeworkSubmission.student_id
    ).join(
        models.Homework, models.Homework.id == models.HomeworkSubmission.homework_id
    ).filter(
        models.HomeworkSubmission.status == "submitted"
    ).all()
    
    out = []
    for sub, name, title in results:
        d = {c.name: getattr(sub, c.name) for c in sub.__table__.columns}
        d["student_name"] = name
        d["hw_title"] = title
        out.append(d)
    return out


# ─────────────────────────────────────
# Payments
# ─────────────────────────────────────
def create_payment(db: Session, payment: schemas.PaymentCreate):
    db_payment = models.Payment(**payment.model_dump())
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

def get_payments(db: Session, skip: int = 0, limit: int = 200):
    return db.query(models.Payment).order_by(models.Payment.created_at.desc()).offset(skip).limit(limit).all()

def get_student_payments(db: Session, student_id: int):
    return db.query(models.Payment).filter(models.Payment.student_id == student_id).all()

def get_monthly_revenue(db: Session):
    """Returns list of {month, year, total} for the last 6 months."""
    results = db.query(
        extract('month', models.Payment.created_at).label('month'),
        extract('year', models.Payment.created_at).label('year'),
        func.sum(models.Payment.amount).label('total')
    ).filter(
        models.Payment.status == "paid"
    ).group_by('year', 'month').order_by('year', 'month').limit(12).all()
    return [{"month": int(r.month), "year": int(r.year), "total": float(r.total or 0)} for r in results]


# ─────────────────────────────────────
# Leads
# ─────────────────────────────────────
def create_lead(db: Session, lead: schemas.LeadCreate):
    db_lead = models.Lead(**lead.model_dump())
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead

def get_leads(db: Session, skip: int = 0, limit: int = 200):
    return db.query(models.Lead).order_by(models.Lead.created_at.desc()).offset(skip).limit(limit).all()

def update_lead_status(db: Session, lead_id: int, update: schemas.LeadStatusUpdate):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if lead:
        lead.status = update.status
        if update.notes:
            lead.notes = update.notes
        db.commit()
        db.refresh(lead)
    return lead


# ─────────────────────────────────────
# Reviews
# ─────────────────────────────────────
def get_reviews(db: Session, skip: int = 0, limit: int = 100,
                course_id: int = None, teacher_id: int = None, status: str = None,
                search: str = None):
    q = db.query(models.Review)
    if course_id:
        q = q.filter(models.Review.course_id == course_id)
    if teacher_id:
        q = q.filter(models.Review.teacher_id == teacher_id)
    if status:
        q = q.filter(models.Review.status == status)
    if search:
        q = q.filter(models.Review.student_name.ilike(f"%{search}%") | models.Review.text.ilike(f"%{search}%"))
    return q.order_by(models.Review.created_at.desc()).offset(skip).limit(limit).all()

def create_review(db: Session, review: schemas.ReviewCreate):
    db_review = models.Review(**review.model_dump())
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

def update_review(db: Session, review_id: int, data: schemas.ReviewUpdate):
    db_review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not db_review:
        return None
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(db_review, key, val)
    db.commit()
    db.refresh(db_review)
    return db_review

def get_review_stats(db: Session):
    """Return aggregate stats for admin panel"""
    total = db.query(models.Review).count()
    avg = db.query(func.avg(models.Review.rating)).scalar() or 0
    positive = db.query(models.Review).filter(models.Review.rating >= 4).count()
    negative = db.query(models.Review).filter(models.Review.rating <= 2).count()
    published = db.query(models.Review).filter(models.Review.status == "published").count()
    moderation = db.query(models.Review).filter(models.Review.status == "moderation").count()
    return {
        "total": total,
        "avg_rating": round(float(avg), 1),
        "positive": positive,
        "negative": negative,
        "published": published,
        "moderation": moderation,
    }


# ─────────────────────────────────────
# Notifications
# ─────────────────────────────────────
def create_notification(db: Session, user_id: int, title: str, message: str, ntype: str = "info"):
    notif = models.Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=ntype
    )
    db.add(notif)
    db.commit()
    return notif

def mark_all_read(db: Session, user_id: int):
    db.query(models.Notification).filter(
        models.Notification.user_id == user_id
    ).update({"is_read": True})
    db.commit()


# ─────────────────────────────────────
# Messages / Chat
# ─────────────────────────────────────
def create_message(db: Session, sender_id: int, receiver_id: int, content: str = None, file_url: str = None, file_type: str = None, file_name: str = None):
    msg = models.Message(sender_id=sender_id, receiver_id=receiver_id, content=content, file_url=file_url, file_type=file_type, file_name=file_name)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

def get_messages(db: Session, user_a: int, user_b: int, limit: int = 100):
    """Get conversation history between two users, ordered oldest first."""
    return db.query(models.Message).filter(
        ((models.Message.sender_id == user_a) & (models.Message.receiver_id == user_b)) |
        ((models.Message.sender_id == user_b) & (models.Message.receiver_id == user_a))
    ).order_by(models.Message.created_at.asc()).limit(limit).all()

def mark_messages_read(db: Session, reader_id: int, sender_id: int):
    """Mark all messages from sender_id to reader_id as read."""
    db.query(models.Message).filter(
        models.Message.receiver_id == reader_id,
        models.Message.sender_id == sender_id,
        models.Message.is_read == False
    ).update({"is_read": True})
    db.commit()

def get_unread_count(db: Session, user_id: int) -> int:
    return db.query(models.Message).filter(
        models.Message.receiver_id == user_id,
        models.Message.is_read == False
    ).count()

def get_group_gradebook(db: Session, group_id: int):
    """Return gradebook for a group: students × lessons/homeworks with grades."""
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        return None

    # Students
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.group_id == group_id
    ).all()
    students = []
    for e in enrollments:
        u = db.query(models.User).filter(models.User.id == e.student_id).first()
        if u:
            students.append({"id": u.id, "name": u.name, "email": u.email})

    # Lessons
    lessons = db.query(models.Lesson).filter(
        models.Lesson.group_id == group_id
    ).order_by(models.Lesson.scheduled_at.asc()).all()

    # Homeworks
    homeworks = db.query(models.Homework).filter(
        models.Homework.group_id == group_id
    ).order_by(models.Homework.due_date.asc()).all()

    # Attendance
    attendance = db.query(models.LessonAttendance).all()
    att_map = {}
    for a in attendance:
        att_map.setdefault(a.lesson_id, {})[a.student_id] = a.attended

    # Submissions
    hw_ids = [h.id for h in homeworks]
    subs = db.query(models.HomeworkSubmission).filter(
        models.HomeworkSubmission.homework_id.in_(hw_ids)
    ).all() if hw_ids else []
    sub_map = {}
    for s in subs:
        sub_map.setdefault(s.homework_id, {})[s.student_id] = {
            "grade": s.grade, "status": s.status, "feedback": s.feedback
        }

    return {
        "group": {"id": group.id, "name": group.name},
        "course": {"id": group.course.id, "title": group.course.title} if group.course else None,
        "teacher": {"name": group.teacher.name} if group.teacher else None,
        "students": students,
        "lessons": [{"id": l.id, "topic": l.topic, "date": str(l.scheduled_at)[:10] if l.scheduled_at else None} for l in lessons],
        "homeworks": [{"id": h.id, "title": h.title, "due_date": str(h.due_date)[:10] if h.due_date else None} for h in homeworks],
        "attendance": {str(lid): {str(s): v for s, v in att.items()} for lid, att in att_map.items()},
        "submissions": {str(hid): {str(s): v for s, v in subs.items()} for hid, subs in sub_map.items()},
    }


def get_chat_contacts(db: Session, user_id: int):
    """Return role-appropriate contacts with last message and unread count."""
    from sqlalchemy import or_
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return []

    # Get message history
    msgs = db.query(models.Message).filter(
        or_(
            models.Message.sender_id == user_id,
            models.Message.receiver_id == user_id
        )
    ).order_by(models.Message.created_at.desc()).all()

    seen = {}
    for m in msgs:
        other_id = m.receiver_id if m.sender_id == user_id else m.sender_id
        if other_id not in seen:
            other = db.query(models.User).filter(models.User.id == other_id).first()
            unread = db.query(models.Message).filter(
                models.Message.sender_id == other_id,
                models.Message.receiver_id == user_id,
                models.Message.is_read == False
            ).count()
            last_msg = m.content or (m.file_type or "Файл")
            seen[other_id] = {
                "user_id": other_id,
                "name": other.name if other else f"User #{other_id}",
                "role": other.role if other else "student",
                "last_message": last_msg[:60],
                "last_time": str(m.created_at)[:16],
                "unread": unread,
            }

    # Add role-suggested contacts (people this user can chat with)
    suggest_ids = set()

    if user.role == 'admin':
        users = db.query(models.User).filter(
            models.User.is_active == True,
            models.User.id != user_id
        ).all()
        for u in users:
            if u.id not in seen:
                suggest_ids.add(u.id)

    elif user.role == 'teacher':
        # Admin
        admins = db.query(models.User).filter(
            models.User.role == 'admin',
            models.User.is_active == True,
            models.User.id != user_id
        ).all()
        for a in admins:
            if a.id not in seen:
                suggest_ids.add(a.id)
        # Their students
        teacher = db.query(models.Teacher).filter(models.Teacher.user_id == user_id).first()
        if teacher:
            sids = db.query(models.Enrollment.student_id).filter(
                models.Enrollment.group_id.in_(
                    db.query(models.Group.id).filter(models.Group.teacher_id == teacher.id)
                )
            ).distinct().all()
            sids = [r[0] for r in sids]
            students = db.query(models.User).filter(
                models.User.id.in_(sids), models.User.is_active == True,
                models.User.id != user_id
            ).all()
            for s in students:
                if s.id not in seen:
                    suggest_ids.add(s.id)

    elif user.role == 'student':
        # Admin
        admins = db.query(models.User).filter(
            models.User.role == 'admin',
            models.User.is_active == True
        ).all()
        for a in admins:
            if a.id not in seen:
                suggest_ids.add(a.id)
        # Their teachers + classmates
        enrollments = db.query(models.Enrollment).filter(
            models.Enrollment.student_id == user_id
        ).all()
        gids = [e.group_id for e in enrollments if e.group_id]
        if gids:
            # Classmates
            cids = db.query(models.Enrollment.student_id).filter(
                models.Enrollment.group_id.in_(gids),
                models.Enrollment.student_id != user_id
            ).distinct().all()
            cids = [r[0] for r in cids]
            classmates = db.query(models.User).filter(
                models.User.id.in_(cids), models.User.is_active == True
            ).all()
            for c in classmates:
                if c.id not in seen:
                    suggest_ids.add(c.id)
            # Teachers
            teacher_ids = db.query(models.Group.teacher_id).filter(
                models.Group.id.in_(gids)
            ).distinct().all()
            tids = [r[0] for r in teacher_ids if r[0]]
            teacher_users = db.query(models.Teacher).filter(
                models.Teacher.id.in_(tids)
            ).all()
            tuids = [t.user_id for t in teacher_users if t.user_id]
            teachers = db.query(models.User).filter(
                models.User.id.in_(tuids), models.User.is_active == True
            ).all()
            for t in teachers:
                if t.id not in seen:
                    suggest_ids.add(t.id)

    # Merge suggested contacts
    if suggest_ids:
        suggested = db.query(models.User).filter(models.User.id.in_(suggest_ids)).all()
        for u in suggested:
            seen[u.id] = {
                "user_id": u.id,
                "name": u.name,
                "role": u.role,
                "last_message": "",
                "last_time": "",
                "unread": 0,
            }

    return list(seen.values())



# ─────────────────────────────────────
# Admin Stats
# ─────────────────────────────────────
def get_admin_stats(db: Session) -> dict:
    today = date.today()
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start.replace(hour=23, minute=59, second=59)

    total_students = db.query(models.User).filter(models.User.role == "student").count()
    total_teachers = db.query(models.User).filter(models.User.role == "teacher").count()
    total_courses = db.query(models.Course).filter(models.Course.is_active == True).count()
    total_groups = db.query(models.Group).filter(models.Group.is_active == True).count()
    total_leads = db.query(models.Lead).count()
    new_leads_today = db.query(models.Lead).filter(
        func.date(models.Lead.created_at) == today
    ).count()
    monthly_revenue_result = db.query(func.sum(models.Payment.amount)).filter(
        extract('month', models.Payment.created_at) == today.month,
        extract('year', models.Payment.created_at) == today.year,
        models.Payment.status == "paid"
    ).scalar()
    total_revenue_result = db.query(func.sum(models.Payment.amount)).filter(
        models.Payment.status == "paid"
    ).scalar()
    pending_homeworks = db.query(models.HomeworkSubmission).filter(
        models.HomeworkSubmission.status == "submitted"
    ).count()
    active_enrollments = db.query(models.Enrollment).count()

    # ── Lead conversion rate ──
    lead_conversion_rate = 0
    if total_leads > 0:
        enrolled_leads = db.query(models.Lead).filter(models.Lead.status == "enrolled").count()
        lead_conversion_rate = round(enrolled_leads / total_leads * 100, 1)

    # ── Retention rate (active in last 30d / total students) ──
    retention_rate = 0
    if total_students > 0:
        thirty_days_ago = today - timedelta(days=30)
        active_students = db.query(models.Student).filter(
            models.Student.last_activity_date >= thirty_days_ago,
            models.Student.is_active == True,
        ).count()
        retention_rate = round(active_students / total_students * 100, 1)

    # ── Online now (active in last 15 minutes) ──
    fifteen_min_ago = now - timedelta(minutes=15)
    online_now = db.query(models.Student).filter(
        models.Student.last_activity_date >= fifteen_min_ago.date(),
        models.Student.is_active == True,
    ).count()

    # ── Daily revenue for last 30 days ──
    daily_revenue = []
    for i in range(29, -1, -1):
        day = today - timedelta(days=i)
        day_total = db.query(func.sum(models.Payment.amount)).filter(
            func.date(models.Payment.created_at) == day,
            models.Payment.status == "paid"
        ).scalar() or 0
        daily_revenue.append({
            "date": day.isoformat(),
            "total": float(day_total),
        })

    # ── Today's schedule (ALL lessons today across all groups) ──
    today_lessons = db.query(models.Lesson).filter(
        models.Lesson.scheduled_at >= today_start,
        models.Lesson.scheduled_at <= today_end
    ).order_by(models.Lesson.scheduled_at.asc()).all()
    today_schedule = []
    for lesson in today_lessons:
        group = db.query(models.Group).filter(models.Group.id == lesson.group_id).first()
        student_count = db.query(models.Enrollment).filter(
            models.Enrollment.group_id == lesson.group_id
        ).distinct(models.Enrollment.student_id).count()
        teacher_name = ""
        if group and group.teacher_id:
            t = db.query(models.Teacher).filter(models.Teacher.id == group.teacher_id).first()
            teacher_name = t.name if t else ""
        today_schedule.append({
            "id": lesson.id,
            "time": lesson.scheduled_at.strftime("%H:%M") if lesson.scheduled_at else "--:--",
            "topic": lesson.topic,
            "group_name": group.name if group else "—",
            "group_id": lesson.group_id,
            "students": student_count,
            "teacher_name": teacher_name,
            "is_completed": lesson.is_completed,
            "zoom_link": lesson.zoom_link,
        })

    # ── Active groups with details ──
    active_groups = []
    all_active_groups = db.query(models.Group).filter(models.Group.is_active == True).all()
    for g in all_active_groups:
        student_count = db.query(models.Enrollment).filter(
            models.Enrollment.group_id == g.id
        ).distinct(models.Enrollment.student_id).count()
        course_name = g.course.title if g.course else "—"
        teacher_name = g.teacher.name if g.teacher else "—"
        active_groups.append({
            "id": g.id,
            "name": g.name,
            "course_name": course_name,
            "teacher_name": teacher_name,
            "students": student_count,
            "max_students": g.max_students,
        })

    # ── Overall attendance rate ──
    attendance_rate = 0
    total_att_records = db.query(models.LessonAttendance).count()
    if total_att_records > 0:
        attended_count = db.query(models.LessonAttendance).filter(
            models.LessonAttendance.attended == True
        ).count()
        attendance_rate = round(attended_count / total_att_records * 100)

    # ── Unread messages (system-wide aggregate) ──
    unread_messages = db.query(models.Message).filter(
        models.Message.is_read == False
    ).count()

    # ── Recent activity ──
    activity = []
    new_lead_entries = db.query(models.Lead).filter(
        func.date(models.Lead.created_at) >= today - timedelta(days=7)
    ).order_by(models.Lead.created_at.desc()).limit(8).all()
    for l in new_lead_entries:
        activity.append({
            "type": "lead",
            "text": f"Новая заявка: {l.name} ({l.phone})",
            "time": l.created_at.isoformat() if l.created_at else "",
        })
    pending_subs = db.query(models.HomeworkSubmission).filter(
        models.HomeworkSubmission.status == "submitted"
    ).order_by(models.HomeworkSubmission.submitted_at.desc()).limit(6).all()
    for sub in pending_subs:
        hw = db.query(models.Homework).filter(models.Homework.id == sub.homework_id).first()
        student_name = db.query(models.User.name).filter(models.User.id == sub.student_id).scalar() or "—"
        activity.append({
            "type": "homework",
            "text": f"ДЗ на проверку: {student_name} — {hw.title if hw else '—'}",
            "time": sub.submitted_at.isoformat() if sub.submitted_at else "",
        })
    activity.sort(key=lambda x: x["time"], reverse=True)
    activity = activity[:10]

    # ── Recent leads (for "Новые заявки" cards) ──
    recent_leads = []
    latest_leads = db.query(models.Lead).order_by(models.Lead.created_at.desc()).limit(10).all()
    for l in latest_leads:
        recent_leads.append({
            "id": l.id,
            "name": l.name,
            "phone": l.phone,
            "status": l.status,
            "course_name": l.course.title if l.course else "—",
            "created_at": l.created_at.isoformat()[:16] if l.created_at else "",
        })

    today_lessons_count = len(today_schedule)

    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "total_courses": total_courses,
        "total_groups": total_groups,
        "new_leads_today": new_leads_today,
        "total_leads": total_leads,
        "monthly_revenue": float(monthly_revenue_result or 0),
        "total_revenue": float(total_revenue_result or 0),
        "pending_homeworks": pending_homeworks,
        "active_enrollments": active_enrollments,
        "today_lessons": today_lessons_count,
        "today_schedule": today_schedule,
        "active_groups": active_groups,
        "attendance_rate": attendance_rate,
        "unread_messages": unread_messages,
        "activity": activity,
        "recent_leads": recent_leads,
        "lead_conversion_rate": lead_conversion_rate,
        "retention_rate": retention_rate,
        "online_now": online_now,
        "daily_revenue": daily_revenue,
    }


# ─────────────────────────────────────
# Admin Reports (Super Admin)
# ─────────────────────────────────────
def get_admin_reports(db: Session):
    today = date.today()
    now = datetime.now()
    first_of_month = today.replace(day=1)
    last_month_end = first_of_month - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)

    # ── Summary ──
    total_revenue = db.query(func.sum(models.Payment.amount)).filter(
        models.Payment.status == "paid"
    ).scalar() or 0

    this_month_revenue = db.query(func.sum(models.Payment.amount)).filter(
        models.Payment.status == "paid",
        func.date(models.Payment.created_at) >= first_of_month,
    ).scalar() or 0

    last_month_revenue = db.query(func.sum(models.Payment.amount)).filter(
        models.Payment.status == "paid",
        func.date(models.Payment.created_at) >= last_month_start,
        func.date(models.Payment.created_at) <= last_month_end,
    ).scalar() or 0

    revenue_growth = 0
    if last_month_revenue > 0:
        revenue_growth = round((this_month_revenue - last_month_revenue) / last_month_revenue * 100, 1)

    total_students = db.query(models.User).filter(models.User.role == "student").count()
    this_month_students = db.query(models.User).filter(
        models.User.role == "student",
        func.date(models.User.created_at) >= first_of_month,
    ).count()
    last_month_students = db.query(models.User).filter(
        models.User.role == "student",
        func.date(models.User.created_at) >= last_month_start,
        func.date(models.User.created_at) <= last_month_end,
    ).count()

    student_growth = 0
    if last_month_students > 0:
        student_growth = round((this_month_students - last_month_students) / last_month_students * 100, 1)

    total_leads = db.query(models.Lead).count()
    enrolled_leads = db.query(models.Lead).filter(models.Lead.status == "enrolled").count()
    lead_conversion_rate = round(enrolled_leads / total_leads * 100, 1) if total_leads > 0 else 0

    attendance_total = db.query(func.count(models.LessonAttendance.id)).filter(
        models.LessonAttendance.lesson_id.isnot(None)
    ).scalar() or 1
    attendance_present = db.query(func.count(models.LessonAttendance.id)).filter(
        models.LessonAttendance.attended == True,
        models.LessonAttendance.lesson_id.isnot(None)
    ).scalar() or 0
    avg_attendance = round(attendance_present / attendance_total * 100, 1)

    active_groups_count = db.query(models.Group).filter(models.Group.is_active == True).count()
    ltv = round(total_revenue / total_students, 0) if total_students > 0 else 0

    # ── Monthly revenue for chart (last 12 months) ──
    revenue_monthly = []
    for i in range(11, -1, -1):
        m = today.month - i
        y = today.year
        while m < 1:
            m += 12
            y -= 1
        while m > 12:
            m -= 12
            y += 1
        m_start = date(y, m, 1)
        if m == 12:
            m_end = date(y + 1, 1, 1) - timedelta(days=1)
        else:
            m_end = date(y, m + 1, 1) - timedelta(days=1)
        month_total = db.query(func.sum(models.Payment.amount)).filter(
            models.Payment.status == "paid",
            func.date(models.Payment.created_at) >= m_start,
            func.date(models.Payment.created_at) <= m_end,
        ).scalar() or 0
        revenue_monthly.append({
            "month": f"{y}-{m:02d}",
            "label": ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"][m - 1],
            "total": float(month_total),
        })

    # ── Student growth (last 30 days cumulative) ──
    student_growth_data = []
    cumul = db.query(models.User).filter(
        models.User.role == "student",
        func.date(models.User.created_at) < today - timedelta(days=30),
    ).count()
    for i in range(29, -1, -1):
        day = today - timedelta(days=i)
        day_new = db.query(models.User).filter(
            models.User.role == "student",
            func.date(models.User.created_at) == day,
        ).count()
        cumul += day_new
        student_growth_data.append({
            "date": day.isoformat(),
            "new": day_new,
            "total": cumul,
        })

    # ── Top courses ──
    courses_raw = db.query(models.Course).filter(models.Course.is_active == True).all()
    top_courses = []
    for c in courses_raw:
        student_count = db.query(models.Enrollment).filter(
            models.Enrollment.course_id == c.id,
            models.Enrollment.student_id.isnot(None),
        ).distinct(models.Enrollment.student_id).count()
        course_revenue = db.query(func.sum(models.Payment.amount)).filter(
            models.Payment.course_id == c.id,
            models.Payment.status == "paid",
        ).scalar() or 0
        if student_count > 0:
            top_courses.append({
                "id": c.id,
                "title": c.title,
                "students": student_count,
                "revenue": float(course_revenue),
            })
    top_courses.sort(key=lambda x: x["students"], reverse=True)

    # ── Attendance by group ──
    groups = db.query(models.Group).filter(models.Group.is_active == True).all()
    attendance_by_group = []
    for g in groups:
        lesson_ids = db.query(models.Lesson.id).filter(models.Lesson.group_id == g.id).subquery()
        total_att = db.query(func.count(models.LessonAttendance.id)).filter(
            models.LessonAttendance.lesson_id.in_(lesson_ids)
        ).scalar() or 0
        present_att = db.query(func.count(models.LessonAttendance.id)).filter(
            models.LessonAttendance.lesson_id.in_(lesson_ids),
            models.LessonAttendance.attended == True,
        ).scalar() or 0
        rate = round(present_att / total_att * 100, 1) if total_att > 0 else 0
        course_name = db.query(models.Course.title).filter(models.Course.id == g.course_id).scalar() or ""
        attendance_by_group.append({
            "id": g.id,
            "name": g.name,
            "course_name": course_name,
            "attended": present_att,
            "total": total_att,
            "rate": rate,
        })

    # ── Conversion by source ──
    sources = db.query(models.Lead.source, func.count(models.Lead.id).label("total")).filter(
        models.Lead.source.isnot(None),
        models.Lead.source != "",
    ).group_by(models.Lead.source).all()
    conversion_by_source = []
    for src, cnt in sources:
        conv = db.query(models.Lead).filter(
            models.Lead.source == src,
            models.Lead.status == "enrolled",
        ).count()
        cr = round(conv / cnt * 100, 1) if cnt > 0 else 0
        conversion_by_source.append({
            "source": src,
            "total": cnt,
            "converted": conv,
            "rate": cr,
        })

    # ── Teacher effectiveness ──
    teachers_raw = db.query(models.Teacher).all()
    teacher_ratings = []
    for t in teachers_raw:
        teacher_groups = db.query(models.Group).filter(
            models.Group.teacher_id == t.id,
            models.Group.is_active == True,
        ).all()
        group_ids = [g.id for g in teacher_groups]
        student_ids = db.query(models.Enrollment.student_id).filter(
            models.Enrollment.group_id.in_(group_ids),
        ).distinct().count() if group_ids else 0
        total_lessons = db.query(models.Lesson).filter(
            models.Lesson.group_id.in_(group_ids),
        ).count() if group_ids else 0
        reviews = db.query(models.Review).filter(
            models.Review.student_name.ilike(f"%{t.name}%"),
        ).all()
        avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else 0
        teacher_ratings.append({
            "id": t.id,
            "name": t.name,
            "groups": len(teacher_groups),
            "students": student_ids,
            "lessons": total_lessons,
            "rating": avg_rating,
            "reviews": len(reviews),
        })

    teacher_ratings.sort(key=lambda x: x["students"], reverse=True)

    # ── Month comparison ──
    month_comparison = {
        "this_month": {
            "revenue": float(this_month_revenue),
            "new_students": this_month_students,
            "new_leads": db.query(models.Lead).filter(
                func.date(models.Lead.created_at) >= first_of_month,
            ).count(),
        },
        "last_month": {
            "revenue": float(last_month_revenue),
            "new_students": last_month_students,
            "new_leads": db.query(models.Lead).filter(
                func.date(models.Lead.created_at) >= last_month_start,
                func.date(models.Lead.created_at) <= last_month_end,
            ).count(),
        },
    }

    return {
        "summary": {
            "total_revenue": float(total_revenue),
            "this_month_revenue": float(this_month_revenue),
            "revenue_growth": revenue_growth,
            "new_students": this_month_students,
            "total_students": total_students,
            "student_growth": student_growth,
            "lead_conversion_rate": lead_conversion_rate,
            "avg_attendance": avg_attendance,
            "active_groups": active_groups_count,
            "ltv": float(ltv),
        },
        "revenue_daily": [{"date": d.isoformat(), "total": float(db.query(func.sum(models.Payment.amount)).filter(
            func.date(models.Payment.created_at) == (today - timedelta(days=i)),
            models.Payment.status == "paid",
        ).scalar() or 0)} for i in range(29, -1, -1) for d in [today - timedelta(days=i)]],
        "revenue_monthly": revenue_monthly,
        "student_growth": student_growth_data,
        "top_courses": top_courses,
        "attendance_by_group": attendance_by_group,
        "conversion_by_source": conversion_by_source,
        "teacher_ratings": teacher_ratings,
        "month_comparison": month_comparison,
    }


# ─────────────────────────────────────
# Dashboard Data
# ─────────────────────────────────────
def get_teacher_groups_by_user(db: Session, user_id: int):
    """Return groups linked to the teacher profile of the given user."""
    teacher = db.query(models.Teacher).filter(models.Teacher.user_id == user_id).first()
    if teacher:
        groups = db.query(models.Group).filter(models.Group.teacher_id == teacher.id).all()
    else:
        groups = db.query(models.Group).all()
    for g in groups:
        g.current_students = db.query(models.Enrollment).filter(
            models.Enrollment.group_id == g.id
        ).distinct(models.Enrollment.student_id).count()
    return groups


def get_teacher_dashboard_data(db: Session, user_id: int):
    teacher = db.query(models.Teacher).filter(models.Teacher.user_id == user_id).first()
    group_ids = [g.id for g in teacher.groups] if teacher else []

    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start.replace(hour=23, minute=59, second=59)

    # ── Groups & Students ──
    groups_count = len(group_ids)
    t_students = 0
    if group_ids:
        t_students = db.query(models.Enrollment).filter(
            models.Enrollment.group_id.in_(group_ids)
        ).distinct(models.Enrollment.student_id).count()

    # ── Today's lessons ──
    today_lessons_count = 0
    today_schedule = []
    if group_ids:
        today_lessons = db.query(models.Lesson).filter(
            models.Lesson.group_id.in_(group_ids),
            models.Lesson.scheduled_at >= today_start,
            models.Lesson.scheduled_at <= today_end
        ).order_by(models.Lesson.scheduled_at.asc()).all()
        today_lessons_count = len(today_lessons)
        for lesson in today_lessons:
            group = db.query(models.Group).filter(models.Group.id == lesson.group_id).first()
            student_count = db.query(models.Enrollment).filter(
                models.Enrollment.group_id == lesson.group_id
            ).distinct(models.Enrollment.student_id).count()
            today_schedule.append({
                "id": lesson.id,
                "time": lesson.scheduled_at.strftime("%H:%M") if lesson.scheduled_at else "--:--",
                "topic": lesson.topic,
                "group_name": group.name if group else "—",
                "group_id": lesson.group_id,
                "students": student_count,
                "is_completed": lesson.is_completed,
                "zoom_link": lesson.zoom_link,
            })

    # ── Attendance rate ──
    attendance_rate = 0
    if group_ids:
        total_attendance = db.query(models.LessonAttendance).join(
            models.Lesson, models.LessonAttendance.lesson_id == models.Lesson.id
        ).filter(models.Lesson.group_id.in_(group_ids)).count()
        if total_attendance > 0:
            attended = db.query(models.LessonAttendance).join(
                models.Lesson, models.LessonAttendance.lesson_id == models.Lesson.id
            ).filter(
                models.Lesson.group_id.in_(group_ids),
                models.LessonAttendance.attended == True
            ).count()
            attendance_rate = round(attended / total_attendance * 100)

    # ── Pending homeworks (for teacher's groups) ──
    t_pending = 0
    if group_ids:
        hw_ids = db.query(models.Homework.id).filter(
            models.Homework.group_id.in_(group_ids)
        ).subquery()
        t_pending = db.query(models.HomeworkSubmission).filter(
            models.HomeworkSubmission.homework_id.in_(
                db.query(hw_ids.c.id)
            ),
            models.HomeworkSubmission.status == "submitted"
        ).count()

    # ── Unread messages ──
    unread_messages = db.query(models.Message).filter(
        models.Message.receiver_id == user_id,
        models.Message.is_read == False
    ).count()

    # ── Groups detail ──
    groups_out = []
    for gid in group_ids:
        group = db.query(models.Group).filter(models.Group.id == gid).first()
        if group:
            student_count = db.query(models.Enrollment).filter(
                models.Enrollment.group_id == gid
            ).distinct(models.Enrollment.student_id).count()
            course_name = group.course.title if group.course else "—"
            groups_out.append({
                "id": group.id,
                "name": group.name,
                "course_name": course_name,
                "students": student_count,
                "max_students": group.max_students,
                "schedule": group.schedule_json,
                "is_active": group.is_active,
            })

    # ── Recent activity ──
    activity = []

    # Pending submissions
    if group_ids:
        hw_ids_2 = db.query(models.Homework.id).filter(
            models.Homework.group_id.in_(group_ids)
        ).subquery()
        pending_subs = db.query(models.HomeworkSubmission).filter(
            models.HomeworkSubmission.homework_id.in_(
                db.query(hw_ids_2.c.id)
            ),
            models.HomeworkSubmission.status == "submitted"
        ).order_by(models.HomeworkSubmission.submitted_at.desc()).limit(10).all()
        for sub in pending_subs:
            hw = db.query(models.Homework).filter(models.Homework.id == sub.homework_id).first()
            student_name = db.query(models.User.name).filter(models.User.id == sub.student_id).scalar() or "—"
            activity.append({
                "type": "homework",
                "text": f"{student_name} отправил(а) ДЗ: {hw.title if hw else '—'}",
                "time": sub.submitted_at.isoformat() if sub.submitted_at else "",
            })

    # Recent notifications
    notifs = db.query(models.Notification).filter(
        models.Notification.user_id == user_id
    ).order_by(models.Notification.created_at.desc()).limit(5).all()
    for n in notifs:
        activity.append({
            "type": "notification",
            "text": n.message or n.title,
            "time": n.created_at.isoformat() if n.created_at else "",
        })

    activity.sort(key=lambda x: x["time"], reverse=True)
    activity = activity[:8]

    return {
        "groups_count": groups_count,
        "t_students": t_students,
        "today_lessons": today_lessons_count,
        "attendance_rate": attendance_rate,
        "t_pending": t_pending,
        "unread_messages": unread_messages,
        "today_schedule": today_schedule,
        "groups": groups_out,
        "activity": activity,
    }

def get_student_homeworks(db: Session, student_id: int):
    """Return homeworks for all groups the student is enrolled in, with submission status."""
    # Get student's group IDs
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == student_id,
        models.Enrollment.group_id.isnot(None)
    ).all()
    group_ids = [e.group_id for e in enrollments]
    course_ids = list({e.course_id for e in enrollments})

    if not group_ids and not course_ids:
        return []

    # Homeworks for those groups/courses
    hw_query = db.query(models.Homework)
    if group_ids:
        hw_query = hw_query.filter(
            (models.Homework.group_id.in_(group_ids)) |
            (models.Homework.course_id.in_(course_ids))
        )
    elif course_ids:
        hw_query = hw_query.filter(models.Homework.course_id.in_(course_ids))

    homeworks = hw_query.order_by(models.Homework.due_date.asc()).limit(20).all()

    # Get submissions for this student
    hw_ids = [hw.id for hw in homeworks]
    submissions = {}
    if hw_ids:
        subs = db.query(models.HomeworkSubmission).filter(
            models.HomeworkSubmission.homework_id.in_(hw_ids),
            models.HomeworkSubmission.student_id == student_id
        ).all()
        submissions = {s.homework_id: s for s in subs}

    result = []
    now = datetime.utcnow()
    for hw in homeworks:
        sub = submissions.get(hw.id)
        is_overdue = hw.due_date and hw.due_date < now
        result.append({
            "id": hw.id,
            "title": hw.title,
            "description": hw.description,
            "due_date": hw.due_date.strftime("%d.%m.%Y %H:%M") if hw.due_date else None,
            "is_overdue": is_overdue and not sub,
            "is_submitted": sub is not None,
            "status": sub.status if sub else ("overdue" if is_overdue else "pending"),
            "grade": sub.grade if sub else None,
            "feedback": sub.feedback if sub else None,
            "submission_id": sub.id if sub else None,
        })
    return result


def get_dashboard_data(db: Session, user_id: int):
    user = get_user(db, user_id)
    if not user:
        return None

    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == user_id
    ).all()

    total_xp = sum(e.xp for e in enrollments)
    group_ids = [e.group_id for e in enrollments if e.group_id]

    completed_lessons = 0
    total_lessons = 0
    if group_ids:
        total_lessons = db.query(models.Lesson).filter(
            models.Lesson.group_id.in_(group_ids)
        ).count()
        completed_lessons = db.query(models.Lesson).filter(
            models.Lesson.group_id.in_(group_ids),
            models.Lesson.is_completed == True
        ).count()

    level_val = 1
    xp_val = 0
    streak_val = 0
    student = db.query(models.Student).filter(models.Student.user_id == user_id).first()
    if student:
        level_val = student.level or 1
        xp_val = student.xp or 0
        streak_val = student.streak_days or 0

    stats = {
        "level": level_val,
        "lessons_completed": completed_lessons,
        "lessons_total": total_lessons,
        "xp": xp_val or total_xp
    }

    # Attendance rate + trend (last 7 lessons)
    attendance_rate = None
    attendance_trend = []
    if group_ids:
        lessons_with_attendance = []
        all_lessons = db.query(models.Lesson).filter(
            models.Lesson.group_id.in_(group_ids)
        ).order_by(models.Lesson.scheduled_at.desc()).limit(14).all()
        for l in reversed(all_lessons[-7:]):
            att = db.query(models.LessonAttendance).filter(
                models.LessonAttendance.lesson_id == l.id,
                models.LessonAttendance.student_id == user_id
            ).first()
            attended = att.attended if att else False
            lessons_with_attendance.append({
                "date": l.scheduled_at.strftime("%d.%m") if l.scheduled_at else "",
                "attended": attended
            })
        attendance_trend = lessons_with_attendance
        total_attended = db.query(models.LessonAttendance).filter(
            models.LessonAttendance.student_id == user_id,
            models.LessonAttendance.attended == True
        ).count()
        total_all = db.query(models.LessonAttendance).filter(
            models.LessonAttendance.student_id == user_id
        ).count()
        attendance_rate = round(total_attended / total_all * 100, 1) if total_all > 0 else None

    # Recent payments
    recent_payments = []
    payments = db.query(models.Payment).filter(
        models.Payment.student_id == user_id
    ).order_by(models.Payment.created_at.desc()).limit(5).all()
    for p in payments:
        recent_payments.append({
            "id": p.id,
            "amount": float(p.amount),
            "currency": p.currency,
            "method": p.method,
            "status": p.status,
            "description": p.description or "",
            "date": p.created_at.strftime("%d.%m.%Y") if p.created_at else ""
        })

    # Upcoming lesson from DB
    upcoming_lesson = None
    if group_ids:
        next_lesson = db.query(models.Lesson).filter(
            models.Lesson.group_id.in_(group_ids),
            models.Lesson.scheduled_at >= datetime.utcnow()
        ).order_by(models.Lesson.scheduled_at).first()
        if next_lesson:
            upcoming_lesson = {
                "time": next_lesson.scheduled_at.strftime("%H:%M"),
                "date": next_lesson.scheduled_at.strftime("%d.%m.%Y"),
                "title": next_lesson.topic,
                "teacher": "Преподаватель",
                "zoom_link": next_lesson.zoom_link or ""
            }

    # Real homeworks from DB
    homeworks = get_student_homeworks(db, user_id)

    # Vocabulary
    vocabulary_words = db.query(models.VocabularyWord).filter(
        models.VocabularyWord.student_id == user_id
    ).limit(5).all()

    if vocabulary_words:
        vocabulary = [{
            "word": w.word,
            "translation": w.translation,
            "progress": w.progress,
            "needs_repeat": w.progress < 30
        } for w in vocabulary_words]
    else:
        vocabulary = []

    # Real weekly schedule from group lessons
    schedule = []
    DAY_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    today = datetime.utcnow()
    # Build Mon-Sun of current week
    monday = today - timedelta(days=today.weekday())
    week_lessons = []
    if group_ids:
        week_lessons = db.query(models.Lesson).filter(
            models.Lesson.group_id.in_(group_ids),
            models.Lesson.scheduled_at >= monday,
            models.Lesson.scheduled_at < monday + timedelta(days=7)
        ).all()
    lesson_days = {l.scheduled_at.weekday() for l in week_lessons if l.scheduled_at}
    for i in range(5):  # Mon-Fri
        day_dt = monday + timedelta(days=i)
        schedule.append({
            "day": DAY_RU[i],
            "date": day_dt.day,
            "active": day_dt.date() == today.date(),
            "has_lesson": i in lesson_days
        })

    notifications_count = db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.is_read == False
    ).count()

    return {
        "user": user,
        "stats": stats,
        "enrollments": enrollments,
        "upcoming_lesson": upcoming_lesson,
        "homeworks": homeworks,
        "vocabulary": vocabulary,
        "schedule": schedule,
        "notifications_count": notifications_count,
        "attendance_rate": attendance_rate,
        "attendance_trend": attendance_trend,
        "recent_payments": recent_payments,
        "streak_days": streak_val,
        "level": level_val,
        "xp": xp_val,
    }
