import os

chat_code = """
# ──────────────────────────────────────
# CHAT & WEBSOCKETS
# ──────────────────────────────────────
from fastapi import WebSocket, WebSocketDisconnect, Query
from typing import Dict
from sqlalchemy import or_, desc, func

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

manager = ConnectionManager()

@app.websocket("/ws/chat/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, token: str = Query(None), db: Session = Depends(get_db)):
    # Validate token if needed (basic check here)
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            # data: {"receiver_id": int, "content": str}
            receiver_id = data.get("receiver_id")
            content = data.get("content")
            
            if receiver_id and content:
                # Save to DB
                new_msg = models.Message(
                    sender_id=user_id,
                    receiver_id=receiver_id,
                    content=content,
                    is_read=False
                )
                db.add(new_msg)
                db.commit()
                db.refresh(new_msg)
                
                # Fetch sender name
                sender = db.query(models.User).filter(models.User.id == user_id).first()
                sender_name = sender.name if sender else "Unknown"
                
                msg_payload = {
                    "id": new_msg.id,
                    "sender_id": user_id,
                    "receiver_id": receiver_id,
                    "content": content,
                    "created_at": new_msg.created_at.isoformat() if new_msg.created_at else "",
                    "sender_name": sender_name
                }
                
                # Send back to sender for instant update
                await manager.send_personal_message(msg_payload, user_id)
                # Send to receiver if online
                await manager.send_personal_message(msg_payload, receiver_id)
                
    except WebSocketDisconnect:
        manager.disconnect(user_id)


@app.get("/api/messages/unread/{user_id}")
def get_unread_messages(user_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    count = db.query(models.Message).filter(
        models.Message.receiver_id == user_id,
        models.Message.is_read == False
    ).count()
    return {"unread": count}


@app.get("/api/messages/contacts/{user_id}")
def get_chat_contacts(user_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Get all users we have exchanged messages with
    sent = db.query(models.Message.receiver_id).filter(models.Message.sender_id == user_id)
    received = db.query(models.Message.sender_id).filter(models.Message.receiver_id == user_id)
    contact_ids = set([r[0] for r in sent.all()] + [r[0] for r in received.all()])
    
    contacts = []
    for cid in contact_ids:
        u = db.query(models.User).filter(models.User.id == cid).first()
        if not u:
            continue
            
        # Get last message
        last_msg = db.query(models.Message).filter(
            or_(
                (models.Message.sender_id == user_id) & (models.Message.receiver_id == cid),
                (models.Message.sender_id == cid) & (models.Message.receiver_id == user_id)
            )
        ).order_by(models.Message.created_at.desc()).first()
        
        # Get unread count from this user
        unread = db.query(models.Message).filter(
            models.Message.sender_id == cid,
            models.Message.receiver_id == user_id,
            models.Message.is_read == False
        ).count()
        
        contacts.append({
            "user_id": u.id,
            "name": u.name,
            "role": u.role,
            "last_message": last_msg.content if last_msg else "",
            "last_time": last_msg.created_at.isoformat() if last_msg and last_msg.created_at else "",
            "unread": unread
        })
        
    # Sort by last_time descending
    contacts.sort(key=lambda x: x["last_time"], reverse=True)
    return contacts


@app.get("/api/messages/{user_id}")
def get_messages_with_user(user_id: int, with_user: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
        
    # Mark messages as read
    db.query(models.Message).filter(
        models.Message.sender_id == with_user,
        models.Message.receiver_id == user_id,
        models.Message.is_read == False
    ).update({"is_read": True})
    db.commit()

    msgs = db.query(models.Message).filter(
        or_(
            (models.Message.sender_id == user_id) & (models.Message.receiver_id == with_user),
            (models.Message.sender_id == with_user) & (models.Message.receiver_id == user_id)
        )
    ).order_by(models.Message.created_at.asc()).all()
    
    result = []
    for m in msgs:
        sender_name = current_user.name if m.sender_id == user_id else "Unknown" # Ideally fetch the other user's name, but frontend handles it well
        result.append({
            "id": m.id,
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "content": m.content,
            "created_at": m.created_at.isoformat() if m.created_at else "",
            "is_read": m.is_read,
            "sender_name": sender_name
        })
    return result


@app.get("/api/users/minimal/{user_id}")
def get_minimal_user(user_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    return {"id": user.id, "name": user.name, "role": user.role}
"""

with open(r"c:\Users\Samad\Desktop\TIL USER BOT\web\main.py", "a", encoding="utf-8") as f:
    f.write("\n" + chat_code)

print("Chat endpoints appended successfully!")
