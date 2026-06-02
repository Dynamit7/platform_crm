from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import crud, models, schemas
from database import get_db
from auth import require_teacher, require_admin, get_current_user

router = APIRouter(tags=["groups"])


@router.get("/api/groups", response_model=List[schemas.Group])
def read_groups(db: Session = Depends(get_db), _=Depends(require_teacher)):
    groups = crud.get_groups(db)
    # Пересчитываем current_students честно из student_groups (источник истины)
    for g in groups:
        g.current_students = db.query(models.StudentGroup).filter(
            models.StudentGroup.group_id == g.id,
            models.StudentGroup.status == "active",
        ).count()
    return groups


@router.get("/api/teacher/groups/{user_id}", response_model=List[schemas.Group])
def get_teacher_groups(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.id != user_id and current_user.role not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Доступ запрещён")
    return crud.get_teacher_groups_by_user(db, user_id)


@router.post("/api/groups", response_model=schemas.Group)
def create_group(group: schemas.GroupCreate, db: Session = Depends(get_db),
                 _=Depends(require_admin)):
    return crud.create_group(db=db, group=group)


@router.put("/api/groups/{group_id}", response_model=schemas.Group)
def update_group(group_id: int, data: schemas.GroupUpdate, db: Session = Depends(get_db),
                 _=Depends(require_admin)):
    result = crud.update_group(db, group_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    return result


@router.post("/api/admin/groups/{group_id}/toggle-active")
def toggle_group_active(group_id: int, db: Session = Depends(get_db),
                        _=Depends(require_admin)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    group.is_active = not group.is_active
    db.commit()
    return {"is_active": group.is_active}


@router.post("/api/admin/groups/{group_id}/graduate")
def graduate_group(group_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    group = db.query(models.Group).filter(models.Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    group.is_active = False
    sgs = db.query(models.StudentGroup).filter(
        models.StudentGroup.group_id == group_id,
        models.StudentGroup.status == "active"
    ).all()
    for sg in sgs:
        sg.status = "completed"
    db.commit()
    return {"ok": True, "graduates": len(sgs)}
