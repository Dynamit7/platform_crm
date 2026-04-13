import asyncio
import logging
# import sys

import structlog
from aiogram import Bot, Dispatcher
from aiogram.fsm.storage.memory import MemoryStorage
# from aiogram.utils.callback_answer import CallbackAnswerMiddleware

from bot.config import config
from bot.database import async_session_factory
from bot.middlewares.db import DbSessionMiddleware
from bot.middlewares.auth import AuthMiddleware
from bot.handlers import get_root_router
from bot.notifications.scheduler import NotificationScheduler
from bot.payments.webhooks import setup_webhook_app
from aiohttp import web

# Configure logging
def setup_logging():
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
        
        # AUTO SCHEMA CHECK: сравниваем реальную БД с моделями
        import sqlite3 as _sqlite3
        import sys as _sys
        import os as _os
        _db_path = _os.path.join(_os.path.dirname(_os.path.dirname(__file__)), "education_center_v2.db")
        if _os.path.exists(_db_path):
            _conn = _sqlite3.connect(_db_path)
            _cur = _conn.cursor()
            _cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
            _real_tables = {row[0] for row in _cur.fetchall()}
            # Ключевые таблицы и обязательные колонки
            _required = {
                "users": ["id", "telegram_id", "full_name", "role", "created_at"],
                "students": ["id", "user_id", "is_active"],
                "training_types": ["id", "name", "created_at"],
                "registrations": ["id", "user_id", "course_id", "created_at"],
                "payments": ["id", "user_id", "amount", "created_at"],
                "lessons": ["id", "group_id", "lesson_date"],
            }
            _issues = []
            for _tbl, _cols in _required.items():
                if _tbl not in _real_tables:
                    _issues.append(f"MISSING TABLE: {_tbl}")
                    continue
                _cur.execute(f"PRAGMA table_info({_tbl})")
                _existing = {row[1] for row in _cur.fetchall()}
                for _col in _cols:
                    if _col not in _existing:
                        _issues.append(f"MISSING COLUMN: {_tbl}.{_col}")
            _conn.close()
            if _issues:
                log.warning("Schema issues detected! Run fix_database_columns.py", issues=_issues)
            else:
                log.info("Schema validation passed — all critical columns present")
        
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
