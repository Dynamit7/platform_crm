from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from datetime import datetime
import os, requests, logging

import crud, models, schemas
from database import get_db
from auth import require_teacher, require_student, get_current_user

log = logging.getLogger("web")

router = APIRouter(tags=["homework"])


@router.post("/api/homeworks", response_model=schemas.Homework)
def create_homework(hw: schemas.HomeworkCreate, db: Session = Depends(get_db),
                    _=Depends(require_teacher)):
    result = crud.create_homework(db=db, hw=hw)

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
                except Exception:
                    pass
    return result


@router.post("/api/homework/submit")
def submit_homework(submission: schemas.HomeworkSubmissionCreate, db: Session = Depends(get_db),
                    _=Depends(require_student)):
    return crud.create_homework_submission(db=db, submission=submission)


@router.post("/api/homework/grade")
def grade_homework(grade: schemas.HomeworkGrade, db: Session = Depends(get_db),
                   _=Depends(require_teacher)):
    result = crud.grade_homework(db=db, grade=grade)
    # Telegram-уведомление студенту уже отправляется внутри crud.grade_homework.
    # Создаём только in-app notification для веб-кабинета.
    if result:
        crud.create_notification(db, result.student_id,
                                 "ДЗ проверено", f"Ваша работа проверена. Оценка: {grade.grade}")
    return result


@router.get("/api/homework/pending")
def pending_homeworks(db: Session = Depends(get_db), _=Depends(require_teacher)):
    return crud.get_pending_submissions(db)


@router.get("/api/homework/submission/{submission_id}/file")
def get_submission_file(
    submission_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_teacher),
):
    """Возвращает ссылку (CDN/URL) на файл, прикреплённый студентом к ДЗ.
    Поддерживает оба сценария:
      - bot: HomeworkSubmission.file_id = Telegram file_id → резолвим через Bot API
      - web: ссылка зашита в content как [Файл: /uploads/...] → отдаём её как есть.
    """
    sub = db.query(models.HomeworkSubmission).filter(
        models.HomeworkSubmission.id == submission_id
    ).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Сдача не найдена")

    # 1) Web upload — url зашита в content
    content = sub.content or ""
    import re as _re
    m = _re.search(r"\[Файл:\s*(\S+?)\]", content)
    if m:
        return {
            "kind": "web",
            "url": m.group(1),
            "file_type": sub.file_type or "file",
            "file_name": m.group(1).rsplit("/", 1)[-1],
        }

    # 2) Bot upload — file_id Телеграма, резолвим в CDN URL
    if sub.file_id:
        bot_token = os.getenv("BOT_TOKEN")
        if not bot_token:
            raise HTTPException(status_code=500, detail="BOT_TOKEN не настроен")
        try:
            r = requests.get(
                f"https://api.telegram.org/bot{bot_token}/getFile",
                params={"file_id": sub.file_id},
                timeout=5,
            )
            data = r.json()
            if not data.get("ok"):
                raise HTTPException(status_code=502, detail="Telegram getFile не ответил")
            file_path = data["result"]["file_path"]
            url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
            return {
                "kind": "bot",
                "url": url,
                "file_type": sub.file_type or "file",
                "file_name": file_path.rsplit("/", 1)[-1],
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Не удалось получить файл из Telegram: {e}")

    raise HTTPException(status_code=404, detail="К этой сдаче не прикреплён файл")


@router.post("/api/homework/submit-file")
def submit_homework_file(body: dict, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
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
            # Абсолютный путь от web/ (тот же UPLOAD_DIR, что раздаётся как /uploads)
            web_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            upload_dir = os.path.join(web_root, "uploads", "homeworks")
            os.makedirs(upload_dir, exist_ok=True)
            # Очищаем имя файла от опасных символов
            import re as _re
            safe_basename = _re.sub(r"[^A-Za-z0-9._\-]", "_", file_name)[:120]
            safe_name = f"hw_{hw_id}_user_{current_user.id}_{safe_basename}"
            file_path = os.path.join(upload_dir, safe_name)
            raw = base64.b64decode(file_data_b64)
            if not raw:
                raise ValueError("Файл пустой (0 байт)")
            with open(file_path, "wb") as f:
                f.write(raw)
            file_url = f"/uploads/homeworks/{safe_name}"
            log.info("Homework file saved: %s (%d bytes)", file_path, len(raw))
        except (OSError, ValueError, base64.binascii.Error) as e:
            log.warning("File upload error: %s", e)
            raise HTTPException(
                status_code=400,
                detail=f"Не удалось сохранить файл: {e}"
            )

    # Тип файла по расширению — чтобы карточка учителя показала правильную иконку
    ftype = None
    if file_name:
        ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
        if ext in ("jpg", "jpeg", "png", "gif", "webp"):
            ftype = "image"
        elif ext in ("pdf",):
            ftype = "pdf"
        elif ext in ("doc", "docx"):
            ftype = "document"
        elif ext in ("mp4", "mov", "webm"):
            ftype = "video"
        elif ext in ("mp3", "ogg", "wav", "m4a"):
            ftype = "audio"
        else:
            ftype = "file"

    submission = models.HomeworkSubmission(
        homework_id=hw_id,
        student_id=current_user.id,
        content=content + (f"\n[Файл: {file_url}]" if file_url else ""),
        file_type=ftype,
        status="submitted"
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return {"ok": True, "submission_id": submission.id, "file_url": file_url}


@router.get("/api/student/{student_id}/homeworks")
def get_student_homeworks(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.id != student_id and current_user.role not in ("admin", "teacher"):
        raise HTTPException(status_code=403, detail="Доступ запрещён")
    return crud.get_student_homeworks(db, student_id)


@router.get("/api/student/{student_id}/achievements")
def get_student_achievements(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.id != student_id and current_user.role not in ("admin", "teacher"):
        raise HTTPException(status_code=403, detail="Доступ запрещён")

    earned_db = db.query(models.UserAchievement).filter(
        models.UserAchievement.student_id == student_id
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

def xp_to_rank(xp: int) -> tuple:
    rank = XP_RANKS[0][1]
    next_xp = XP_RANKS[1][0]
    for i, (threshold, name) in enumerate(XP_RANKS):
        if xp >= threshold:
            rank = name
            next_xp = XP_RANKS[i + 1][0] if i + 1 < len(XP_RANKS) else threshold
    return rank, xp, max(0, next_xp - xp)


@router.get("/api/leaderboard")
def get_leaderboard(
    limit: int = 10,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    from sqlalchemy import func as sqlfunc
    rows = (
        db.query(
            models.UserAchievement.student_id,
            sqlfunc.sum(models.UserAchievement.xp_reward).label("total_xp"),
        )
        .group_by(models.UserAchievement.student_id)
        .order_by(sqlfunc.sum(models.UserAchievement.xp_reward).desc())
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


@router.post("/api/student/{student_id}/achievements/check")
def check_and_award_achievements(
    student_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    user = db.query(models.User).filter(models.User.id == student_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    earned_types = {
        a.achievement_type
        for a in db.query(models.UserAchievement).filter(
            models.UserAchievement.student_id == student_id
        ).all()
    }

    awarded = []

    def award(atype: str):
        if atype not in earned_types:
            item = next((x for x in ACHIEVEMENT_CATALOG if x["type"] == atype), None)
            if item:
                db.add(models.UserAchievement(
                    student_id=student_id,
                    achievement_type=atype,
                    title=item["title"],
                    description=item["description"],
                    xp_reward=item["xp_reward"],
                ))
                awarded.append(atype)

    hw_count = db.query(models.HomeworkSubmission).filter(
        models.HomeworkSubmission.student_id == student_id
    ).count()
    if hw_count >= 1:
        award("first_hw")

    vocab_count = db.query(models.VocabularyWord).filter(
        models.VocabularyWord.student_id == student_id
    ).count()
    if vocab_count >= 50:
        award("vocab_50")

    perfect = db.query(models.HomeworkSubmission).filter(
        models.HomeworkSubmission.student_id == student_id,
        models.HomeworkSubmission.grade == "10",
    ).first()
    if perfect:
        award("perfect_hw")

    attend_count = db.query(models.LessonAttendance).filter(
        models.LessonAttendance.student_id == student_id,
        models.LessonAttendance.attended == True
    ).count()
    if attend_count >= 20:
        award("attend_20")

    if awarded:
        db.commit()

    return {"awarded": awarded, "count": len(awarded)}
