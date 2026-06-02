import base64
import json
from datetime import datetime, timezone
from pathlib import Path

import structlog
from aiohttp import web
from bot.database import async_session_factory
from bot.payments.service import PaymentService
from bot.config import config

_FAILED_WEBHOOK_DIR = Path(__file__).resolve().parent.parent.parent / "logs" / "failed_webhooks"


def _verify_yookassa_basic_auth(auth_header: str, shop_id: str, secret_key: str) -> bool:
    if not auth_header or not auth_header.startswith("Basic "):
        return False
    try:
        decoded = base64.b64decode(auth_header[6:]).decode("utf-8")
        return decoded == f"{shop_id}:{secret_key}"
    except Exception:
        return False

log = structlog.get_logger()

async def yookassa_webhook_handler(request: web.Request):
    """
    Handle incoming notifications from ЮKassa.
    """
    try:
        data = await request.json()
    except Exception as e:
        log.error("Failed to parse webhook JSON", error=str(e))
        return web.Response(status=400)

    auth = request.headers.get("Authorization", "")
    if not _verify_yookassa_basic_auth(auth, config.YOOKASSA_SHOP_ID, config.YOOKASSA_SECRET_KEY.get_secret_value()):
        log.warning("Unauthorized webhook request")
        return web.Response(status=401)

    log.info("Received ЮKassa webhook", event=data.get("event"))

    # YooKassa expects 200 for any processed notification — иначе будет
    # бесконечно ретраить (24 часа, с backoff). Если БД временно лежит,
    # лучше принять и залогировать для ручного разбора, чем потерять
    # уведомление через несколько 500-ответов.
    async with async_session_factory() as session:
        bot = request.app.get("bot")
        service = PaymentService(session, bot=bot)

        try:
            await service.process_webhook_notification(data)
        except Exception as e:
            log.error(
                "Error processing webhook in service",
                error=str(e),
                event=data.get("event"),
                payment_id=(data.get("object") or {}).get("id"),
            )
            # Возвращаем 200, но сохраняем raw payload для ретрая вручную
            try:
                _FAILED_WEBHOOK_DIR.mkdir(parents=True, exist_ok=True)
                ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
                fp = _FAILED_WEBHOOK_DIR / f"yookassa_{ts}.json"
                fp.write_text(json.dumps({"error": str(e), "payload": data}, ensure_ascii=False, indent=2), encoding="utf-8")
                log.info("Failed webhook persisted", file=str(fp))
            except Exception:
                log.exception("Failed to persist failed webhook for later retry")

    return web.Response(status=200)

async def sync_web_user_handler(request: web.Request):
    """
    Handle user registration synchronization from the website.
    """
    try:
        data = await request.json()
    except Exception as e:
        log.error("Failed to parse sync user JSON", error=str(e))
        return web.Response(status=400)
        
    from bot.models.user import User, UserRole, Student
    from sqlalchemy import select
    async with async_session_factory() as session:
        # Check if user already exists
        stmt = select(User).where(User.email == data.get("email"))
        user = (await session.execute(stmt)).scalar_one_or_none()
        
        if not user and data.get("phone"):
            stmt = select(User).where(User.phone == data.get("phone"))
            user = (await session.execute(stmt)).scalar_one_or_none()
            
        if not user:
            user = User(
                telegram_id=None,
                full_name=data.get("name"),
                phone=data.get("phone"),
                email=data.get("email"),
                role=UserRole.STUDENT if data.get("role") == "student" else UserRole.PENDING
            )
            session.add(user)
            await session.flush()
            
            if user.role == UserRole.STUDENT:
                import random
                while True:
                    code = f"STU{random.randint(100000, 999999)}"
                    existing = await session.execute(select(Student).where(Student.student_code == code))
                    if not existing.scalar_one_or_none():
                        break
                student = Student(user_id=user.id, student_code=code, is_active=True)
                session.add(student)
                
            await session.commit()
            log.info("Synced NEW user from web to bot", name=user.full_name)
        else:
            # Update existing user
            if data.get("name"):
                user.full_name = data.get("name")
            if data.get("phone"):
                user.phone = data.get("phone")
            if data.get("email"):
                user.email = data.get("email")
            await session.commit()
            log.info("Updated existing user from web sync", name=user.full_name)
            
    return web.Response(status=200)


def setup_webhook_app(bot):
    """
    Creates and returns the aiohttp web application for webhooks.
    """
    app = web.Application()
    app["bot"] = bot
    app.router.add_post("/payments/yookassa/webhook", yookassa_webhook_handler)
    app.router.add_post("/api/web/sync-user", sync_web_user_handler)
    return app
