from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import crud, models, schemas
from database import get_db
from auth import require_admin

router = APIRouter(tags=["teachers"])


@router.get("/api/teachers", response_model=List[schemas.Teacher])
def read_teachers(db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.get_teachers(db)


@router.post("/api/teachers", response_model=schemas.Teacher)
def create_teacher(teacher: schemas.TeacherCreate, db: Session = Depends(get_db),
                   _=Depends(require_admin)):
    return crud.create_teacher(db=db, teacher=teacher)


@router.put("/api/teachers/{teacher_id}", response_model=schemas.Teacher)
def update_teacher(teacher_id: int, data: schemas.TeacherUpdate, db: Session = Depends(get_db),
                   _=Depends(require_admin)):
    result = crud.update_teacher(db, teacher_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Преподаватель не найден")
    return result


@router.delete("/api/teachers/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db),
                   _=Depends(require_admin)):
    if not crud.delete_teacher(db, teacher_id):
        raise HTTPException(status_code=404, detail="Преподаватель не найден")
    return {"ok": True}
