from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

import crud, models, schemas
from database import get_db
from auth import require_admin, get_current_user

router = APIRouter(tags=["students"])


@router.get("/api/students")
def get_students(
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
    return q.order_by(models.User.name).all()


@router.get("/api/students/{student_id}")
def get_student_detail(
    student_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    detail = crud.get_student_detail(db, student_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Студент не найден")
    return detail


@router.post("/api/students/enroll")
def enroll_student(
    body: dict,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    student_id = body.get("student_id")
    course_id = body.get("course_id")
    group_id = body.get("group_id")
    if not student_id or not course_id:
        raise HTTPException(status_code=400, detail="student_id и course_id обязательны")
    result = crud.enroll_student(db, student_id, course_id, group_id)
    if result is None:
        raise HTTPException(status_code=400, detail="Группа заполнена")
    return result


@router.delete("/api/students/{student_id}/groups/{group_id}")
def remove_student_from_group(
    student_id: int,
    group_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Отвязать студента от группы:
    1) убираем StudentGroup link (источник истины для бота),
    2) сбрасываем group_id у его Enrollment в этой группе (но НЕ удаляем сам Enrollment,
       чтобы не потерять привязку к курсу),
    3) уменьшаем счётчик current_students у группы.
    """
    user = db.query(models.User).filter(models.User.id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Студент не найден")
    student = db.query(models.Student).filter(models.Student.user_id == student_id).first()

    removed = False
    if student:
        sg = db.query(models.StudentGroup).filter(
            models.StudentGroup.student_id == student.id,
            models.StudentGroup.group_id == group_id,
        ).first()
        if sg:
            db.delete(sg)
            removed = True

    enrollments_in_group = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == student_id,
        models.Enrollment.group_id == group_id,
    ).all()
    for e in enrollments_in_group:
        e.group_id = None
        removed = True

    group_obj = None
    if removed:
        group_obj = db.query(models.Group).filter(models.Group.id == group_id).first()
        if group_obj and (group_obj.current_students or 0) > 0:
            group_obj.current_students = group_obj.current_students - 1
        db.commit()

    # Push студенту о выводе из группы
    if removed and user.telegram_id:
        try:
            gname = group_obj.name if group_obj else "группа"
            crud.send_telegram_notification(
                user.telegram_id,
                f"ℹ️ Вы были выведены из группы *{gname}*.\nЕсли это ошибка — свяжитесь с администратором."
            )
        except Exception:
            pass

    return {"status": "ok", "removed": removed}


@router.get("/api/students/{student_id}/groups")
def get_student_group_memberships(student_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    student = db.query(models.Student).filter(models.Student.user_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Студент не найден")
    sgs = db.query(models.StudentGroup).filter(
        models.StudentGroup.student_id == student.id
    ).all()
    groups = db.query(models.Group).filter(
        models.Group.id.in_([sg.group_id for sg in sgs])
    ).all() if sgs else []
    return [{
        "id": g.id, "name": g.name,
        "status": next((sg.status for sg in sgs if sg.group_id == g.id), "unknown"),
        "is_active": g.is_active,
    } for g in groups]


@router.get("/api/student/{student_id}/progress")
def get_student_progress(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.id != student_id and current_user.role not in ("admin", "teacher"):
        raise HTTPException(status_code=403, detail="Доступ запрещён")
    return crud.get_student_progress(db, student_id)
