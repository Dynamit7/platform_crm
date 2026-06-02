from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

import crud, models, schemas
from database import get_db
from auth import require_admin

router = APIRouter(tags=["courses"])


@router.get("/api/courses", response_model=List[schemas.Course])
def read_courses(db: Session = Depends(get_db)):
    return crud.get_courses(db)


@router.post("/api/courses", response_model=schemas.Course)
def create_course(course: schemas.CourseCreate, db: Session = Depends(get_db),
                  _=Depends(require_admin)):
    return crud.create_course(db=db, course=course)


@router.put("/api/courses/{course_id}", response_model=schemas.Course)
def update_course(course_id: int, data: schemas.CourseUpdate, db: Session = Depends(get_db),
                  _=Depends(require_admin)):
    result = crud.update_course(db, course_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Курс не найден")
    return result


@router.delete("/api/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db),
                  _=Depends(require_admin)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Курс не найден")
    db.delete(course)
    db.commit()
    return {"ok": True}
