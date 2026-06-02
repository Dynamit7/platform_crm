from fastapi import APIRouter, Depends, HTTPException, status, Body, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, date
import os, secrets, hashlib, time, requests, logging

log = logging.getLogger("web")

import crud, models, schemas
from database import get_db
from auth import (
    create_access_token, get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES, decode_token,
    get_client_ip, check_rate_limit,
    create_db_session, rotate_db_session, get_password_hash
)

log = logging.getLogger("web")

router = APIRouter(tags=["auth"])


# ─────────────────────────────────────────────────────────────
# Magic-link логин для пользователей из Telegram-бота.
# Сценарий:
#   1. Бот (или web при зачислении) дёргает /api/auth/issue-login-link
#      с заголовком X-Bot-Secret и body {telegram_id} → получает URL.
#   2. Студент кликает → попадает на /auth/tg?t=<token> (SPA-роут).
#      SPA вызывает /api/auth/redeem-link → получает access/refresh JWT.
#   3. Сразу редирект в кабинет — без ввода пароля.
# ─────────────────────────────────────────────────────────────


def _require_bot_secret(request: Request):
    expected = os.getenv("BOT_TOKEN", "")
    if not expected:
        raise HTTPException(status_code=500, detail="BOT_TOKEN не настроен")
    if request.headers.get("x-bot-secret") != expected:
        raise HTTPException(status_code=403, detail="Forbidden")


@router.post("/api/auth/issue-login-link")
def issue_login_link(
    request: Request,
    body: dict = Body(...),
    db: Session = Depends(get_db),
):
    _require_bot_secret(request)
    tg_id = body.get("telegram_id")
    if not tg_id:
        raise HTTPException(status_code=400, detail="telegram_id обязателен")
    user = db.query(models.User).filter(models.User.telegram_id == int(tg_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    # Прямой jwt.encode — create_access_token форсит type='access'.
    from jose import jwt as _jwt
    from auth import SECRET_KEY, ALGORITHM
    exp = datetime.utcnow() + timedelta(minutes=10)
    token = _jwt.encode(
        {"sub": str(user.id), "role": user.role, "type": "tg_login", "exp": exp},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )
    base = os.getenv("WEB_BASE_URL", "http://localhost:8000").rstrip("/")
    return {"url": f"{base}/auth/tg?t={token}", "expires_in_minutes": 10}


@router.post("/api/auth/redeem-link")
def redeem_login_link(body: dict = Body(...), db: Session = Depends(get_db)):
    token = body.get("token", "")
    if not token:
        raise HTTPException(status_code=400, detail="token обязателен")
    payload = decode_token(token)
    if not payload or payload.get("type") != "tg_login":
        raise HTTPException(status_code=401, detail="Недействительная ссылка")
    user_id = payload.get("sub")
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="Пользователь не найден или деактивирован")
    access = create_access_token({"sub": str(user.id), "role": user.role})
    refresh = create_db_session(db, user.id)
    user.last_login_at = datetime.utcnow()
    db.commit()
    return {"access_token": access, "refresh_token": refresh, "token_type": "bearer", "user": user}


def log_attempt(db: Session, email: str, success: bool, ip: str = "", ua: str = "", user_id: int = None):
    attempt = models.LoginAttempt(user_id=user_id, email=email, success=success, ip_address=ip, user_agent=ua)
    db.add(attempt)
    db.commit()


@router.post("/auth/register", response_model=schemas.Token)
def register(user_data: schemas.UserRegister, db: Session = Depends(get_db)):
    existing = crud.get_user_by_email(db, user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email уже используется")
    user = crud.create_user(db, user_data)
    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_db_session(db, user.id)
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "user": user}


@router.post("/auth/login")
def login(
    credentials: schemas.UserLogin,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent", "")

    rate_key = f"login:{get_client_ip(request)}"
    if not check_rate_limit(rate_key, db, max_attempts=20, window_seconds=60):
        log_attempt(db, email=credentials.email, success=False, ip=ip, ua=ua)
        raise HTTPException(status_code=429, detail="Слишком много попыток. Попробуйте через минуту.")

    user = crud.authenticate_user(db, credentials.email, credentials.password)
    if not user:
        log_attempt(db, email=credentials.email, success=False, ip=ip, ua=ua)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль"
        )
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Аккаунт заблокирован")

    log_attempt(db, user_id=user.id, email=credentials.email, success=True, ip=ip, ua=ua)

    access_token = create_access_token({"sub": str(user.id), "role": user.role})
    refresh_token = create_db_session(db, user.id)

    user.last_login_at = datetime.utcnow()
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": schemas.UserPublic.model_validate(user)
    }


@router.post("/auth/refresh")
def refresh_token(body: dict = Body(...), db: Session = Depends(get_db)):
    refresh = body.get("refresh_token")
    if not refresh:
        raise HTTPException(status_code=400, detail="refresh_token обязателен")

    result = rotate_db_session(db, refresh)
    if not result:
        raise HTTPException(status_code=401, detail="Сессия истекла. Войдите снова.")
    new_refresh, user_id = result

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Пользователь не найден")

    new_access = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": new_access, "refresh_token": new_refresh, "token_type": "bearer"}


@router.post("/auth/logout")
def logout(body: dict = Body(...), db: Session = Depends(get_db)):
    token = body.get("refresh_token")
    if token:
        db.query(models.Session).filter(models.Session.refresh_token == token).delete()
        db.commit()
    return {"ok": True}


@router.get("/auth/me", response_model=schemas.UserPublic)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.patch("/auth/me", response_model=schemas.UserPublic)
def update_me(update_data: schemas.UserProfileUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    user_update = schemas.UserUpdate(
        name=update_data.name,
        email=update_data.email,
        phone=update_data.phone,
        password=update_data.password,
    )
    if update_data.avatar_url is not None:
        current_user.avatar_url = update_data.avatar_url
    if update_data.telegram_id is not None:
        current_user.telegram_id = update_data.telegram_id
    if update_data.birthday is not None:
        try:
            current_user.date_of_birth = update_data.birthday if isinstance(update_data.birthday, date) else datetime.strptime(update_data.birthday, "%Y-%m-%d").date()
        except Exception as e:
            log.warning("Failed to parse birthday for user %s: %s", current_user.id, e)
    updated_user = crud.update_user(db, current_user.id, user_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")
    return updated_user


@router.post("/api/auth/forgot-password")
def forgot_password(body: dict = Body(...), db: Session = Depends(get_db)):
    email = body.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email обязателен")
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь с таким email не найден")
    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
    db.commit()
    if user.telegram_id:
        bot_token = os.getenv("BOT_TOKEN")
        if bot_token:
            app_url = os.getenv("APP_URL", "http://localhost:5173")
            reset_link = f"{app_url}/reset-password?token={token}&email={email}"
            msg = f"🔐 *Сброс пароля*\n\nВы запросили сброс пароля. Ссылка действительна 1 час:\n\n[{reset_link}]({reset_link})\n\nЕсли вы не запрашивали сброс, проигнорируйте это сообщение."
            try:
                requests.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json={"chat_id": user.telegram_id, "text": msg, "parse_mode": "Markdown"},
                    timeout=5
                )
            except Exception as e:
                log.warning("Failed to send forgot-password Telegram to user %s: %s", user.id, e)
    return {"ok": True, "message": "Ссылка для сброса пароля отправлена на email и/или в Telegram"}


@router.post("/api/auth/reset-password")
def reset_password(body: dict = Body(...), db: Session = Depends(get_db)):
    token = body.get("token")
    password = body.get("password")
    if not token or not password:
        raise HTTPException(status_code=400, detail="Токен и новый пароль обязательны")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Пароль должен быть не менее 6 символов")
    user = db.query(models.User).filter(models.User.reset_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Неверный или истёкший токен")
    if user.reset_token_expires and user.reset_token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Токен истёк. Запросите сброс пароля заново.")
    user.password_hash = get_password_hash(password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    return {"ok": True, "message": "Пароль успешно изменён"}


@router.post("/api/auth/google")
def google_auth(body: dict = Body(...), db: Session = Depends(get_db)):
    id_token = body.get("idToken")
    if not id_token:
        raise HTTPException(status_code=400, detail="idToken обязателен")
    try:
        resp = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}",
            timeout=10
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Неверный токен Google")
        payload = resp.json()
    except requests.RequestException:
        raise HTTPException(status_code=502, detail="Ошибка верификации Google")

    google_id = payload.get("sub")
    email = payload.get("email")
    name = payload.get("name", "Google User")
    picture = payload.get("picture")

    if not google_id:
        raise HTTPException(status_code=401, detail="Не удалось получить Google ID")

    if not check_rate_limit(f"google:{google_id}", db, max_attempts=20, window_seconds=60):
        raise HTTPException(status_code=429, detail="Слишком много попыток")

    user = db.query(models.User).filter(models.User.google_id == google_id).first()
    if not user and email:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            user.google_id = google_id

    if not user:
        user = models.User(
            name=name,
            email=email,
            google_id=google_id,
            avatar_url=picture,
            role="student",
            is_active=True,
            registration_source="google",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token({"sub": str(user.id), "role": user.role})
    refresh_token = create_db_session(db, user.id)

    user.last_login_at = datetime.utcnow()
    db.commit()

    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "user": user}


@router.post("/api/auth/telegram")
def telegram_auth(body: dict = Body(...), db: Session = Depends(get_db)):
    tg_id = body.get("id")
    tg_hash = body.get("hash")
    auth_date = body.get("auth_date")
    first_name = body.get("first_name", "Telegram User")
    username = body.get("username")
    photo_url = body.get("photo_url")

    if not tg_id or not tg_hash or not auth_date:
        raise HTTPException(status_code=400, detail="Недостаточно данных для аутентификации")

    if int(auth_date) < int(time.time()) - 300:
        raise HTTPException(status_code=401, detail="Устаревшие данные аутентификации")

    bot_token = os.getenv("BOT_TOKEN")
    if not bot_token:
        raise HTTPException(status_code=500, detail="BOT_TOKEN не настроен")

    secret_key = hashlib.sha256(bot_token.encode()).digest()
    check_list = []
    for k in ["auth_date", "first_name", "id", "last_name", "photo_url", "username"]:
        v = body.get(k)
        if v is not None:
            check_list.append(f"{k}={v}")
    check_list.sort()
    check_string = "\n".join(check_list)
    import hmac as hmac_mod
    calculated_hash = hmac_mod.new(secret_key, check_string.encode(), hashlib.sha256).hexdigest()

    if calculated_hash != tg_hash:
        raise HTTPException(status_code=401, detail="Неверная подпись Telegram")

    if not check_rate_limit(f"telegram:{tg_id}", db, max_attempts=20, window_seconds=60):
        raise HTTPException(status_code=429, detail="Слишком много попыток")

    user = db.query(models.User).filter(models.User.telegram_id == int(tg_id)).first()

    if not user:
        user = models.User(
            name=first_name,
            telegram_id=int(tg_id),
            avatar_url=photo_url,
            role="student",
            is_active=True,
            registration_source="telegram",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    access_token = create_access_token({"sub": str(user.id), "role": user.role})
    refresh_token = create_db_session(db, user.id)

    user.last_login_at = datetime.utcnow()
    db.commit()

    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer", "user": user}


@router.put("/api/auth/password")
def change_password(body: dict = Body(...), db: Session = Depends(get_db),
                    current_user: models.User = Depends(get_current_user)):
    old_password = body.get("old_password")
    new_password = body.get("new_password")
    if not old_password or not new_password:
        raise HTTPException(status_code=400, detail="old_password и new_password обязательны")
    from auth import verify_password
    if not verify_password(old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Новый пароль должен быть не менее 6 символов")
    current_user.password_hash = get_password_hash(new_password)
    db.commit()
    return {"ok": True}
