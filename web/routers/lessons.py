from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List
from datetime import date, timedelta, datetime
import logging

import crud, models, schemas
from database import get_db
from auth import require_teacher, get_current_user

log = logging.getLogger("web")

router = APIRouter(tags=["lessons"])


@router.post("/api/lessons", response_model=schemas.Lesson)
def create_lesson(lesson: schemas.LessonCreate, db: Session = Depends(get_db),
                  _=Depends(require_teacher)):
    return crud.create_lesson(db=db, lesson=lesson)


@router.post("/api/lessons/bulk")
def create_lessons_bulk(
    body: dict,
    db: Session = Depends(get_db),
    _=Depends(require_teacher),
):
    """Создать сразу несколько занятий и отправить ОДНО суммарное уведомление студентам.
    body: {
      group_id: int,
      lessons: [{ date: "YYYY-MM-DD", time: "HH:MM", topic?: str, zoom_link?: str }, ...]
    }
    """
    group_id = body.get("group_id")
    lessons_in = body.get("lessons") or []
    if not group_id or not isinstance(lessons_in, list) or not lessons_in:
        raise HTTPException(status_code=400, detail="group_id и lessons обязательны")

    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")

    created_dates: list[date] = []
    skipped = 0

    for item in lessons_in:
        d_str = item.get("date")
        t_str = item.get("time") or "18:30"
        topic = item.get("topic") or "Занятие"
        zoom = item.get("zoom_link") or None
        if not d_str:
            continue
        try:
            d = datetime.fromisoformat(d_str).date()
            hh, mm = (int(x) for x in t_str.split(":")[:2])
            scheduled_at = datetime.combine(d, datetime.min.time()).replace(hour=hh, minute=mm)
        except Exception:
            skipped += 1
            continue

        exists = db.query(models.Lesson).filter(
            models.Lesson.group_id == group_id,
            models.Lesson.lesson_date == d,
        ).first()
        if exists:
            skipped += 1
            continue

        new_lesson = models.Lesson(
            group_id=group_id,
            topic=topic,
            scheduled_at=scheduled_at,
            lesson_date=d,
            lesson_time=t_str,
            zoom_link=zoom,
        )
        db.add(new_lesson)
        db.flush()  # получаем lesson.id
        created_dates.append(d)

        # Авто-отметку посещаемости делаем ТОЛЬКО для прошедших уроков
        # (включая сегодня) — иначе % посещаемости будет «фантомным»
        # для будущих занятий. Для будущих уроков attendance пустой,
        # учитель отметит в день занятия.
        from datetime import date as _date
        if d > _date.today():
            continue

        student_ids = [
            sg.student_id for sg in db.query(models.StudentGroup).filter(
                models.StudentGroup.group_id == group_id,
                models.StudentGroup.status == "active",
            ).all()
        ]
        # student_groups.student_id -> students.id, нужен users.id для FK на attendance
        students_map = {
            s.id: s.user_id for s in db.query(models.Student).filter(
                models.Student.id.in_(student_ids)
            ).all()
        } if student_ids else {}
        for sid_internal, user_id in students_map.items():
            db.add(models.Attendance(
                lesson_id=new_lesson.id,
                student_id=user_id,
                status="present",
                attended=True,
            ))

    db.commit()

    # ОДНО уведомление каждому студенту со всем расписанием.
    if created_dates:
        try:
            enrollments = db.query(models.Enrollment).filter(
                models.Enrollment.group_id == group_id
            ).all()
            sorted_dates = sorted(created_dates)
            lines = "\n".join(f"• {d.strftime('%d.%m.%Y')}" for d in sorted_dates[:30])
            extra = f"\n…и ещё {len(sorted_dates) - 30}" if len(sorted_dates) > 30 else ""
            time_hint = lessons_in[0].get("time") or "18:30"
            msg = (
                f"📅 *Новое расписание — {group.name}*\n"
                f"Создано занятий: *{len(created_dates)}*\n"
                f"Время: {time_hint}\n\n"
                f"{lines}{extra}"
            )
            seen_tg: set[int] = set()
            for e in enrollments:
                stu = db.query(models.User).filter(models.User.id == e.student_id).first()
                if stu and stu.telegram_id and stu.telegram_id not in seen_tg:
                    crud.send_telegram_notification(stu.telegram_id, msg)
                    seen_tg.add(stu.telegram_id)
        except Exception as exc:
            log.warning("bulk lessons summary push failed: %s", exc)

    return {"created": len(created_dates), "skipped": skipped}


@router.get("/api/groups/{group_id}/lessons", response_model=List[schemas.Lesson])
def get_lessons(group_id: int, db: Session = Depends(get_db), _=Depends(require_teacher)):
    return crud.get_lessons_by_group(db, group_id)


@router.put("/api/lessons/{lesson_id}", response_model=schemas.Lesson)
def update_lesson(lesson_id: int, data: schemas.LessonUpdate, db: Session = Depends(get_db),
                  _=Depends(require_teacher)):
    result = crud.update_lesson(db, lesson_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Урок не найден")
    return result


@router.delete("/api/lessons/{lesson_id}")
def delete_lesson(lesson_id: int, db: Session = Depends(get_db),
                  _=Depends(require_teacher)):
    if not crud.delete_lesson(db, lesson_id):
        raise HTTPException(status_code=404, detail="Урок не найден")
    return {"ok": True}


@router.get("/api/groups/{group_id}/students")
def get_group_students(group_id: int, db: Session = Depends(get_db), _=Depends(require_teacher)):
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.group_id == group_id
    ).all()
    result = []
    today = date.today()
    for e in enrollments:
        student = db.query(models.User).filter(models.User.id == e.student_id).first()
        if not student:
            continue
        profile = crud.get_or_create_student_profile(db, student.id)
        if not profile.is_active:
            status = "inactive"
        elif profile.frozen_until and profile.frozen_until > today:
            status = "vacation"
        else:
            status = "active"
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
            "level": profile.level or 1,
            "status": status,
            "last_visit": str(profile.last_activity_date) if profile.last_activity_date else None,
            "streak_days": profile.streak_days or 0,
            "student_code": profile.student_code,
        })
    return result


@router.patch("/api/students/{student_id}/status")
def update_student_status(student_id: int, data: schemas.StudentStatusUpdate, db: Session = Depends(get_db), _=Depends(require_teacher)):
    profile = crud.get_or_create_student_profile(db, student_id)
    if data.status == "inactive":
        profile.is_active = False
        profile.frozen_until = None
        profile.freeze_reason = None
    elif data.status == "vacation":
        profile.is_active = True
        profile.frozen_until = date.today() + timedelta(days=30)
        profile.freeze_reason = data.freeze_reason or "Отпуск"
    else:
        profile.is_active = True
        profile.frozen_until = None
        profile.freeze_reason = None
    if data.level is not None:
        profile.level = data.level
    if data.xp is not None:
        profile.xp = data.xp
    db.commit()
    db.refresh(profile)
    return {"ok": True, "status": data.status}


@router.get("/api/students/me/profile", response_model=schemas.StudentProfileResponse)
def get_my_student_profile(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Только для студентов")
    profile = db.query(models.Student).filter(models.Student.user_id == current_user.id).first()
    if not profile:
        profile = crud.get_or_create_student_profile(db, current_user.id)
    total_paid = db.query(func.coalesce(func.sum(models.Payment.amount), 0)).filter(
        models.Payment.student_id == current_user.id,
        models.Payment.status == "paid"
    ).scalar()
    total_lessons = db.query(func.count(models.Lesson.id)).join(models.Group).join(
        models.Enrollment, models.Enrollment.group_id == models.Group.id
    ).filter(models.Enrollment.student_id == current_user.id).scalar()
    lessons_attended = db.query(func.count(models.LessonAttendance.id)).filter(
        models.LessonAttendance.student_id == current_user.id,
        models.LessonAttendance.attended == True
    ).scalar()
    attendance_rate = round((lessons_attended / total_lessons * 100), 1) if total_lessons > 0 else None
    enrollments = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == current_user.id
    ).options(joinedload(models.Enrollment.group).joinedload(models.Group.course)).all()
    courses = []
    groups = []
    seen_courses = set()
    for e in enrollments:
        if e.group:
            g_name = e.group.name
            if g_name not in seen_courses:
                groups.append({"id": e.group.id, "name": g_name, "course_name": e.group.course.title if e.group.course else ""})
                seen_courses.add(g_name)
            if e.group.course and e.group.course.title not in {c.get("title") for c in courses}:
                courses.append({"id": e.group.course.id, "title": e.group.course.title})
    payments_data = db.query(models.Payment).filter(
        models.Payment.student_id == current_user.id
    ).order_by(models.Payment.created_at.desc()).limit(20).all()
    achievements = [{"id": a.id, "title": a.title, "type": a.achievement_type, "description": a.description or "", "xp_reward": a.xp_reward, "earned_at": str(a.earned_at)[:10] if a.earned_at else None}
                    for a in (current_user.user_achievements or [])]
    return schemas.StudentProfileResponse(
        id=current_user.id,
        telegram_id=current_user.telegram_id,
        name=current_user.name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role,
        avatar_url=current_user.avatar_url,
        registration_source=current_user.registration_source,
        created_at=current_user.created_at,
        is_active=current_user.is_active,
        student_code=profile.student_code,
        enrollment_date=profile.enrollment_date,
        level=profile.level,
        xp=profile.xp,
        streak_days=profile.streak_days,
        last_activity_date=profile.last_activity_date,
        total_paid=float(total_paid),
        total_lessons=total_lessons,
        lessons_attended=lessons_attended,
        attendance_rate=attendance_rate,
        birthday=current_user.date_of_birth,
        courses=courses,
        groups=groups,
        payments=[{"id": p.id, "date": str(p.created_at)[:10] if p.created_at else "", "amount": p.amount, "method": p.method, "status": p.status, "description": p.description or p.course.title if p.course else ""} for p in payments_data],
        achievements=achievements,
    )


@router.get("/api/groups/{group_id}/gradebook")
def get_group_gradebook(group_id: int, db: Session = Depends(get_db), _=Depends(require_teacher)):
    data = crud.get_group_gradebook(db, group_id)
    if not data:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    return data


@router.get("/api/groups/{group_id}/homeworks")
def get_group_homeworks(group_id: int, db: Session = Depends(get_db), _=Depends(require_teacher)):
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


@router.get("/api/groups/{group_id}/attendance")
def get_attendance(group_id: int, db: Session = Depends(get_db), _=Depends(require_teacher)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    enrollments = db.query(models.Enrollment).filter(models.Enrollment.group_id == group_id).all()
    # Возвращаем ВСЕ уроки группы (без обрезки в 10) — фронт сам фильтрует
    # по выбранному месяцу. Иначе календарь теряет ранние даты.
    lessons = db.query(models.Lesson).filter(
        models.Lesson.group_id == group_id
    ).order_by(models.Lesson.scheduled_at.asc()).all()
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


@router.post("/api/groups/{group_id}/attendance")
def save_attendance(group_id: int, body: dict, db: Session = Depends(get_db), _=Depends(require_teacher)):
    records = body.get("records", [])
    if not records:
        raise HTTPException(status_code=400, detail="records обязательны")
    for rec in records:
        lesson_id = rec["lesson_id"]
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

    seen_students = set()
    for rec in records:
        sid = rec["student_id"]
        if sid not in seen_students:
            seen_students.add(sid)
            try:
                from routers.homework import check_and_award_achievements as _ca; _ca(sid, db, None)
            except Exception as e:
                log.warning("Error awarding achievements for %s: %s", sid, e)

    return {"ok": True, "saved": len(records)}
