from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, date, timedelta
import models, schemas
from auth import get_password_hash, verify_password
import os
import requests

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
            "http://127.0.0.1:8080/api/web/sync-user",
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
            "http://127.0.0.1:8080/api/web/sync-user",
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
            "http://127.0.0.1:8080/api/web/sync-user",
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


# ─────────────────────────────────────
# Lessons
# ─────────────────────────────────────
def get_lessons_by_group(db: Session, group_id: int):
    return db.query(models.Lesson).filter(models.Lesson.group_id == group_id).all()

def create_lesson(db: Session, lesson: schemas.LessonCreate):
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

def create_homework_submission(db: Session, submission: schemas.HomeworkSubmissionBase):
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
def get_reviews(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Review).offset(skip).limit(limit).all()

def create_review(db: Session, review: schemas.ReviewCreate):
    db_review = models.Review(**review.model_dump())
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review


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
def create_message(db: Session, sender_id: int, receiver_id: int, content: str):
    msg = models.Message(sender_id=sender_id, receiver_id=receiver_id, content=content)
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

def get_chat_contacts(db: Session, user_id: int):
    """Return list of unique users this user has chatted with, with last message."""
    from sqlalchemy import or_, and_
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
            seen[other_id] = {
                "user_id": other_id,
                "name": other.name if other else f"User #{other_id}",
                "role": other.role if other else "student",
                "last_message": m.content[:60],
                "last_time": str(m.created_at)[:16],
                "unread": unread,
            }
    return list(seen.values())



# ─────────────────────────────────────
# Admin Stats
# ─────────────────────────────────────
def get_admin_stats(db: Session) -> dict:
    today = date.today()
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
        "active_enrollments": active_enrollments
    }


# ─────────────────────────────────────
# Dashboard Data
# ─────────────────────────────────────
def get_teacher_groups_by_user(db: Session, user_id: int):
    """Return groups linked to the teacher profile of the given user."""
    teacher = db.query(models.Teacher).filter(models.Teacher.user_id == user_id).first()
    if teacher:
        return db.query(models.Group).filter(models.Group.teacher_id == teacher.id).all()
    # Fallback: return all groups if teacher profile not linked yet
    return db.query(models.Group).all()


def get_teacher_dashboard_data(db: Session, user_id: int):
    teacher = db.query(models.Teacher).filter(models.Teacher.user_id == user_id).first()
    group_ids = [g.id for g in teacher.groups] if teacher else []

    if group_ids:
        t_students = db.query(models.Enrollment).filter(
            models.Enrollment.group_id.in_(group_ids)
        ).distinct(models.Enrollment.student_id).count()
        t_lessons = db.query(models.Lesson).filter(
            models.Lesson.group_id.in_(group_ids)
        ).count()
        next_lesson = db.query(models.Lesson).filter(
            models.Lesson.group_id.in_(group_ids),
            models.Lesson.scheduled_at >= datetime.utcnow()
        ).order_by(models.Lesson.scheduled_at.asc()).first()
    else:
        t_students = 0
        t_lessons = 0
        next_lesson = db.query(models.Lesson).filter(
            models.Lesson.scheduled_at >= datetime.utcnow()
        ).order_by(models.Lesson.scheduled_at.asc()).first()

    t_pending = db.query(models.HomeworkSubmission).filter(
        models.HomeworkSubmission.status == "submitted"
    ).count()
    t_graded = db.query(models.HomeworkSubmission).filter(
        models.HomeworkSubmission.status == "graded"
    ).count()

    next_lesson_out = None
    if next_lesson:
        next_lesson_out = {
            "time": next_lesson.scheduled_at.strftime("%H:%M") if next_lesson.scheduled_at else "--:--",
            "date": next_lesson.scheduled_at.strftime("%d.%m.%Y") if next_lesson.scheduled_at else "---",
            "title": next_lesson.topic,
            "teacher": "Преподаватель"
        }

    return {
        "t_students": t_students,
        "t_pending": t_pending,
        "t_graded": t_graded,
        "t_lessons": t_lessons,
        "next_lesson": next_lesson_out
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

    # Real XP and lesson stats
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

    stats = {
        "level": user.role.capitalize(),
        "lessons_completed": completed_lessons,
        "lessons_total": total_lessons,
        "xp": total_xp
    }

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
        "notifications_count": notifications_count
    }
