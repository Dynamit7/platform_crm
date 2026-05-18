import base64
import structlog
from aiohttp import web
from bot.database import async_session_factory
from bot.payments.service import PaymentService


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

    log.info("Received ЮKassa webhook", event=data.get("event"))

    # Process in a background session
    async with async_session_factory() as session:
        # We need the bot instance to send notifications. 
        # It's usually stored in the aiohttp app state.
        bot = request.app.get("bot")
        service = PaymentService(session, bot=bot)
        
        try:
            await service.process_webhook_notification(data)
        except Exception as e:
            log.error("Error processing webhook in service", error=str(e))
            return web.Response(status=500)

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
    import random
    
    async with async_session_factory() as session:
        # Check if user already exists
        stmt = select(User).where(User.email == data.get("email"))
        user = (await session.execute(stmt)).scalar_one_or_none()
        
        if not user and data.get("phone"):
            stmt = select(User).where(User.phone == data.get("phone"))
            user = (await session.execute(stmt)).scalar_one_or_none()
            
        if not user:
            # Generate a negative telegram ID using user's web ID (guaranteed unique)
            dummy_telegram_id = -abs(int(data.get("id", 0)))
            if dummy_telegram_id >= 0:
                dummy_telegram_id = -random.randint(10000000, 99999999)
                
            user = User(
                telegram_id=dummy_telegram_id,
                full_name=data.get("name"),
                phone=data.get("phone"),
                email=data.get("email"),
                role=UserRole.STUDENT if data.get("role") == "student" else UserRole.PENDING
            )
            session.add(user)
            await session.flush()
            
            if user.role == UserRole.STUDENT:
                # Add to Student table
                code = f"STU{random.randint(100000, 999999)}"
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
