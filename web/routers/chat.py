from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File
from sqlalchemy.orm import Session
from typing import Dict
import asyncio, json, os, logging
from datetime import datetime
from uuid import uuid4

import crud, models, schemas
from database import get_db, SessionLocal
from auth import get_current_user, decode_token

log = logging.getLogger("web")

router = APIRouter(tags=["chat"])


class ConnectionManager:
    def __init__(self):
        self.active: Dict[int, list] = {}

    async def connect(self, user_id: int, ws: WebSocket):
        self.active.setdefault(user_id, []).append(ws)

    def disconnect(self, user_id: int, ws: WebSocket):
        if user_id in self.active:
            self.active[user_id] = [c for c in self.active[user_id] if c != ws]
            if not self.active[user_id]:
                del self.active[user_id]

    async def send_to(self, user_id: int, data: dict):
        for ws in self.active.get(user_id, []):
            try:
                await ws.send_text(json.dumps(data, ensure_ascii=False))
            except Exception as e:
                log.warning("WebSocket send_to failed for user %s: %s", user_id, e)

    def is_online(self, user_id: int) -> bool:
        return user_id in self.active and any(
            ws.client_state.name == "CONNECTED" for ws in self.active[user_id]
        )


manager = ConnectionManager()


UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")


@router.websocket("/ws/chat/{user_id}")
async def websocket_chat(
    ws: WebSocket,
    user_id: int,
):
    await ws.accept()
    try:
        raw = await asyncio.wait_for(ws.receive_text(), timeout=15)
    except asyncio.TimeoutError:
        await ws.close(code=4001, reason="Таймаут аутентификации")
        return
    try:
        auth_data = json.loads(raw)
    except json.JSONDecodeError:
        await ws.close(code=4002, reason="Невалидный JSON")
        return
    if auth_data.get("type") != "auth" or not auth_data.get("token"):
        await ws.close(code=4001, reason="Требуется аутентификация")
        return
    payload = decode_token(auth_data["token"])
    token_user_id = payload.get("sub")
    if not token_user_id or int(token_user_id) != user_id:
        await ws.close(code=4003, reason="Недействительный токен")
        return

    db = SessionLocal()
    try:
        db_user = db.query(models.User).filter(
            models.User.id == user_id, models.User.is_active == True
        ).first()
        if not db_user:
            await ws.close(code=4004, reason="Пользователь не найден")
            return
    finally:
        db.close()

    await manager.connect(user_id, ws)
    try:
        while True:
            raw = await ws.receive_text()
            data = json.loads(raw)

            msg_type = data.get("type", "message")

            # Typing indicator — forward to receiver only
            if msg_type == "typing":
                receiver_id = int(data["receiver_id"])
                await manager.send_to(receiver_id, {
                    "type": "typing",
                    "sender_id": user_id,
                })
                continue

            # Auth heartbeat
            if msg_type == "auth":
                continue

            # Live read receipt — sent by client when the open chat receives a
            # new message from the other side. Marks all messages from sender_id
            # to me as read and pushes "messages_read" back to the original sender
            # so their UI flips ✓ → ✓✓ instantly.
            if msg_type == "mark_read":
                try:
                    sender_id = int(data["sender_id"])
                except (KeyError, TypeError, ValueError):
                    continue
                db_mr = SessionLocal()
                try:
                    read_ids = crud.mark_messages_read(db_mr, reader_id=user_id, sender_id=sender_id)
                finally:
                    db_mr.close()
                if read_ids:
                    await manager.send_to(sender_id, {
                        "type": "messages_read",
                        "reader_id": user_id,
                        "message_ids": read_ids,
                    })
                continue

            receiver_id = int(data["receiver_id"])
            content = data.get("content", "").strip()
            file_url = data.get("file_url") or None
            file_type = data.get("file_type") or None
            file_name = data.get("file_name") or None
            if not content and not file_url:
                continue
            if receiver_id == user_id:
                await manager.send_to(user_id, {
                    "type": "error",
                    "code": "self_send",
                    "message": "Нельзя отправить сообщение самому себе.",
                })
                continue

            db = SessionLocal()
            try:
                receiver_exists = db.query(models.User.id).filter(
                    models.User.id == receiver_id,
                    models.User.is_active == True,
                ).first()
                if not receiver_exists:
                    await manager.send_to(user_id, {
                        "type": "error",
                        "code": "receiver_not_found",
                        "receiver_id": receiver_id,
                        "message": "Получатель не найден или деактивирован.",
                    })
                    continue
                msg = crud.create_message(db, sender_id=user_id, receiver_id=receiver_id, content=content or None, file_url=file_url, file_type=file_type, file_name=file_name)
                db.commit()
                created_iso = msg.created_at.isoformat()[:16] if msg.created_at else datetime.utcnow().isoformat()[:16]
                payload_out = {
                    "id": msg.id,
                    "sender_id": user_id,
                    "sender_name": db_user.name,
                    "receiver_id": receiver_id,
                    "content": content,
                    "file_url": file_url,
                    "file_type": file_type,
                    "file_name": file_name,
                    "created_at": created_iso,
                    "is_read": False,
                }
                receiver_user = db.query(models.User).filter(models.User.id == receiver_id).first()
                if receiver_user and receiver_user.telegram_id:
                    try:
                        crud.send_telegram_notification(
                            receiver_user.telegram_id,
                            f"\U0001f4ac *{db_user.name}*:\n{content[:200]}"
                        )
                    except Exception as e:
                        log.warning("Telegram notification in chat failed for user %s: %s", receiver_user.id, e)
            finally:
                db.close()

            await manager.send_to(user_id, payload_out)
            await manager.send_to(receiver_id, payload_out)
    except WebSocketDisconnect:
        manager.disconnect(user_id, ws)


@router.get("/api/messages/{user_id}")
async def get_conversation(
    user_id: int,
    with_user: int,
    db: Session = Depends(get_db),
    current=Depends(get_current_user)
):
    msgs = crud.get_messages(db, user_id, with_user)
    read_ids = crud.mark_messages_read(db, reader_id=current.id, sender_id=with_user)
    if read_ids:
        await manager.send_to(with_user, {
            "type": "messages_read",
            "reader_id": current.id,
            "message_ids": read_ids,
        })
    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "sender_name": m.sender.name if m.sender else "?",
            "receiver_id": m.receiver_id,
            "content": m.content,
            "file_url": m.file_url,
            "file_type": m.file_type,
            "file_name": m.file_name,
            "is_read": m.is_read,
            "created_at": m.created_at.isoformat()[:16] if m.created_at else "",
        }
        for m in msgs
    ]


@router.get("/api/messages/contacts/{user_id}")
def get_contacts(
    user_id: int,
    db: Session = Depends(get_db),
    current=Depends(get_current_user)
):
    contacts = crud.get_chat_contacts(db, user_id)
    for c in contacts:
        c["is_online"] = manager.is_online(c["user_id"])
    return contacts


@router.get("/api/messages/unread/{user_id}")
def get_unread_count(
    user_id: int,
    db: Session = Depends(get_db),
    current=Depends(get_current_user)
):
    count = crud.get_unread_count(db, user_id)
    return {"unread": count}


@router.post("/api/messages/upload")
async def upload_file(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
    import aiofiles
    MAX_SIZE = 20 * 1024 * 1024
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="Файл слишком большой (макс. 20MB)")
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    name = f"{uuid4().hex}{ext}"
    path = os.path.join(UPLOAD_DIR, name)
    async with aiofiles.open(path, "wb") as f:
        await f.write(contents)
    img_exts = {".jpg",".jpeg",".png",".gif",".webp",".bmp",".svg"}
    file_type = "image" if ext in img_exts else "document"
    return {"file_url": f"/uploads/{name}", "file_type": file_type, "file_name": file.filename}


@router.get("/api/messages/users/search")
def search_chat_users(
    q: str = "",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.User).filter(
        models.User.is_active == True,
        models.User.id != current_user.id
    )
    if q:
        query = query.filter(models.User.name.ilike(f"%{q}%"))

    users = query.limit(20).all()
    return [{"id": u.id, "name": u.name, "role": u.role} for u in users]
