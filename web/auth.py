from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models
import secrets
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY не задан в .env! Создайте .env файл на основе .env.example")

ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))
REFRESH_TOKEN_EXPIRE_DAYS = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def check_rate_limit(key: str, db: Session, max_attempts: int = 20, window_seconds: int = 60):
    window_start = datetime.utcnow() - timedelta(seconds=window_seconds)
    count = db.query(func.count(models.LoginAttempt.id)).filter(
        models.LoginAttempt.email == key,
        models.LoginAttempt.created_at > window_start,
        models.LoginAttempt.success == False,
    ).scalar()
    return (count or 0) < max_attempts

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "0.0.0.0"


# ──────────────────────────────────────
# Password utilities
# ──────────────────────────────────────
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


# ──────────────────────────────────────
# JWT Token utilities
# ──────────────────────────────────────
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return {}


# ──────────────────────────────────────
# Session / Refresh Token helpers
# ──────────────────────────────────────
def create_db_session(db: Session, user_id: int) -> str:
    """Create a refresh token + session record, returns refresh token."""
    raw_token = secrets.token_urlsafe(48)
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    session = models.Session(
        user_id=user_id,
        refresh_token=raw_token,
        expires_at=expires_at,
    )
    db.add(session)
    db.commit()
    return raw_token


def rotate_db_session(db: Session, old_token: str):
    """Delete old session and create new one. Returns (new_token, user_id) or None."""
    session = db.query(models.Session).filter(models.Session.refresh_token == old_token).first()
    if not session or session.expires_at < datetime.utcnow():
        return None
    user_id = session.user_id
    db.delete(session)
    db.commit()
    new_token = create_db_session(db, user_id)
    return new_token, user_id


def cleanup_expired_sessions(db: Session):
    """Remove expired sessions."""
    db.query(models.Session).filter(models.Session.expires_at < datetime.utcnow()).delete()
    db.commit()


# ──────────────────────────────────────
# Dependencies — get current user
# ──────────────────────────────────────
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не авторизован. Войдите снова.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise credentials_exception
    user_id: int = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_role(*roles: str):
    """Factory for role-based access control."""
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Доступ запрещён. Требуется роль: {', '.join(roles)}"
            )
        return current_user
    return role_checker


# Shortcuts
require_admin = require_role("admin", "super_admin")
require_super_admin = require_role("super_admin")
require_teacher = require_role("admin", "super_admin", "teacher")
require_student = require_role("admin", "super_admin", "teacher", "student")
