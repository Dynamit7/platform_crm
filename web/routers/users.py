from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import crud, models, schemas
from database import get_db
from auth import get_current_user

router = APIRouter(tags=["users"])


@router.get("/api/users/minimal/{user_id}")
def get_user_minimal(user_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    user = crud.get_user_minimal(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return {"id": user.id, "name": user.name, "role": user.role}


@router.get("/api/notifications")
def get_notifications(db: Session = Depends(get_db),
                      current_user: models.User = Depends(get_current_user)):
    notifs = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).limit(20).all()
    return notifs


@router.post("/api/notifications/read-all")
def read_all_notifications(db: Session = Depends(get_db),
                           current_user: models.User = Depends(get_current_user)):
    crud.mark_all_read(db, current_user.id)
    return {"ok": True}


@router.get("/api/dashboard/{user_id}")
def get_dashboard(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещён")

    data = crud.get_dashboard_data(db, user_id=user_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    user = data["user"]
    enrollments = data["enrollments"]

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


@router.get("/api/teacher/dashboard/{user_id}")
def get_teacher_dashboard(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещён")
    return crud.get_teacher_dashboard_data(db, user_id=user_id)
