import asyncio
import logging
import logging.handlers
import os
from pathlib import Path

import structlog
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage

from bot.config import config
from bot.database import async_session_factory
from bot.middlewares.db import DbSessionMiddleware
from bot.middlewares.auth import AuthMiddleware
from bot.handlers import get_root_router
from bot.notifications.scheduler import NotificationScheduler
from bot.payments.webhooks import setup_webhook_app
from aiohttp import web

# ── Log rotation setup ──────────────────────────────────────────
_LOG_FILE = Path(__file__).parent.parent / "bot.log"

def setup_logging():
    # Rotating file handler: max 5 MB, keep 3 backups
    file_handler = logging.handlers.RotatingFileHandler(
        _LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8"
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(logging.Formatter(
        "[%(asctime)s] %(levelname)-8s [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    ))

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)

    logging.basicConfig(level=logging.INFO, handlers=[file_handler, console_handler])

    structlog.configure(
        processors=[
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.dev.ConsoleRenderer()
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )

async def on_startup(bot: Bot, dispatcher: Dispatcher):
    log = structlog.get_logger()
    bot_info = await bot.get_me()
    log.info("Bot started", name=bot_info.full_name, username=bot_info.username)
    
    # Start Scheduler
    scheduler = NotificationScheduler(bot)
    scheduler.start()
    dispatcher["scheduler"] = scheduler
    
    # DB connection check
    try:
        from sqlalchemy import text
        from bot.database import engine
        from bot.models.base import Base

        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            # Автоматическая синхронизация схемы (создаст недостающие таблицы, но не изменит колонки существующих)
            await conn.run_sync(Base.metadata.create_all)
            
        log.info("Database connection and automatic schema sync successful")
        
        log.info("Database connection and schematic initialization successful")
        
        # Seed basic data
        from bot.database import async_session_factory
        from bot.utils.seed import seed_basic_data
        async with async_session_factory() as session:
            await seed_basic_data(session)
        log.info("Database seeding completed")
        
    except Exception as e:
        log.error("Database connection failed", error=str(e))

async def main():
    setup_logging()
    log = structlog.get_logger()

    # Initialize bot and dispatcher
    bot = Bot(token=config.BOT_TOKEN.get_secret_value())
    dp = Dispatcher(storage=MemoryStorage())

    # Register middlewares
    dp.update.middleware(DbSessionMiddleware(async_session_factory))
    dp.update.middleware(AuthMiddleware())
    # dp.callback_query.middleware(CallbackAnswerMiddleware())

    # Register routers
    dp.include_router(get_root_router())

    # Register startup hook
    dp.startup.register(on_startup)

    # Start Webhook Server for Payments
    webhook_app = setup_webhook_app(bot)
    runner = web.AppRunner(webhook_app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', 8080)
    await site.start()
    log.info("Payment webhook server started on port 8080")

    try:
        log.info("Starting polling...")
        await dp.start_polling(bot)
    finally:
        await runner.cleanup()
        scheduler = dp.get("scheduler")
        if scheduler:
            scheduler.shutdown()
        await bot.session.close()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
