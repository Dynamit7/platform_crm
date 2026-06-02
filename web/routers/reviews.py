from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

import crud, models, schemas
from database import get_db
from auth import require_admin

router = APIRouter(tags=["reviews"])


@router.get("/api/reviews")
def read_reviews(
    skip: int = 0, limit: int = 100,
    course_id: int = None, teacher_id: int = None,
    status: str = None, search: str = None,
    db: Session = Depends(get_db)
):
    reviews = crud.get_reviews(db, skip=skip, limit=limit, course_id=course_id, teacher_id=teacher_id, status=status, search=search)
    out = []
    for r in reviews:
        course_name = r.course.title if r.course else None
        teacher_name = r.teacher.name if r.teacher else None
        student_avatar = r.student.avatar_url if r.student else None
        out.append(schemas.ReviewOut(
            id=r.id, student_id=r.student_id, student_name=r.student_name,
            student_avatar=student_avatar,
            text=r.text, rating=r.rating,
            course_id=r.course_id, course_name=course_name,
            teacher_id=r.teacher_id, teacher_name=teacher_name,
            group_name=r.group_name, media_urls=r.media_urls,
            status=r.status or "moderation", admin_reply=r.admin_reply,
            created_at=str(r.created_at)[:16] if r.created_at else None,
            updated_at=str(r.updated_at)[:16] if r.updated_at else None,
        ))
    return out


@router.post("/api/reviews", response_model=schemas.Review)
def create_review(review: schemas.ReviewCreate, db: Session = Depends(get_db)):
    return crud.create_review(db=db, review=review)


@router.get("/api/admin/reviews/stats")
def admin_review_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
    return crud.get_review_stats(db)


@router.get("/api/admin/reviews/{review_id}")
def admin_get_review(review_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    r = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Отзыв не найден")
    course_name = r.course.title if r.course else None
    teacher_name = r.teacher.name if r.teacher else None
    student_avatar = r.student.avatar_url if r.student else None
    return schemas.ReviewOut(
        id=r.id, student_id=r.student_id, student_name=r.student_name,
        student_avatar=student_avatar,
        text=r.text, rating=r.rating,
        course_id=r.course_id, course_name=course_name,
        teacher_id=r.teacher_id, teacher_name=teacher_name,
        group_name=r.group_name, media_urls=r.media_urls,
        status=r.status or "moderation", admin_reply=r.admin_reply,
        created_at=str(r.created_at)[:16] if r.created_at else None,
        updated_at=str(r.updated_at)[:16] if r.updated_at else None,
    )


@router.patch("/api/admin/reviews/{review_id}")
def admin_update_review(review_id: int, body: schemas.ReviewUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    r = crud.update_review(db, review_id, body)
    if not r:
        raise HTTPException(status_code=404, detail="Отзыв не найден")
    return {"ok": True, "review_id": r.id, "status": r.status}


@router.delete("/api/admin/reviews/{review_id}")
def admin_delete_review(review_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    r = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Отзыв не найден")
    db.delete(r)
    db.commit()
    return {"ok": True}
