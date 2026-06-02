"""
Data migration: bot.db + web.db → PostgreSQL (or shared SQLite).

Run once after deploying core/models.py and before cutting over to the new DB.

Usage:
    py scripts/migrate_to_postgres.py
"""
import sys, os
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..')))

from datetime import datetime
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

_here = Path(__file__).resolve().parent.parent
BOT_DB = _here / "education_center_v2.db"
WEB_DB = _here / "web" / "education_center_web.db"
NEW_URL = os.getenv("DATABASE_URL", f"sqlite:///{_here / 'education_center.db'}")

from core.models import Base

# Tables shared between bot and web (use bot.db as authoritative source)
SHARED_TABLES = ["users", "students", "teachers", "courses", "groups",
                 "lessons", "homework_submissions", "payments",
                 "lesson_templates", "promo_codes", "referrals"]

# Tables only in bot.db
BOT_ONLY_TABLES = ["admins", "training_types", "schedules", "student_groups",
                   "registrations", "attendance", "feedback", "materials",
                   "student_statuses", "student_progress", "settings",
                   "reminders", "achievements", "student_achievements"]

# Tables only in web.db
WEB_ONLY_TABLES = ["reviews", "leads", "enrollments", "homeworks",
                   "messages", "vocabulary_words", "notifications",
                   "lead_history", "broadcast_campaigns",
                   "login_attempts", "sessions", "user_achievements"]


def fix_url(url: str) -> str:
    """Normalise DB URL to sync engine format."""
    url = url.replace("sqlite+aiosqlite://", "sqlite://")
    url = url.replace("postgresql+asyncpg://", "postgresql://")
    if url.startswith("sqlite:///./"):
        url = f"sqlite:///{_here / url[12:]}"
    return url


def table_columns(engine, table: str) -> list:
    with engine.connect() as conn:
        if engine.url.drivername.startswith("sqlite"):
            row = conn.execute(text(f"PRAGMA table_info({table})")).all()
            return [r[1] for r in row]
        else:
            r = conn.execute(text(f"""
                SELECT column_name FROM information_schema.columns
                WHERE table_name = '{table}' ORDER BY ordinal_position
            """)).all()
            return [row[0] for row in r]


def copy_table(src_engine, dst_engine, table: str, columns: list = None):
    """Copy all rows from src table to dst table, matching column names."""
    with src_engine.connect() as src_conn:
        if columns is None:
            columns = table_columns(src_engine, table)
        if not columns:
            return
        cols_str = ", ".join(f'"{c}"' for c in columns)
        placeholders = ", ".join(f":{c}" for c in columns)
        rows = src_conn.execute(text(f"SELECT {cols_str} FROM \"{table}\"")).mappings().all()

    if not rows:
        return

    with dst_engine.connect() as dst_conn:
        dst_cols = table_columns(dst_engine, table)
        dst_cols_set = set(dst_cols)
        for row in rows:
            filtered = {k: v for k, v in row.items() if k in dst_cols_set}
            if not filtered:
                continue
            fcols = ", ".join(f'"{c}"' for c in filtered)
            fvals = ", ".join(f":{c}" for c in filtered)
            dst_conn.execute(text(f'INSERT INTO "{table}" ({fcols}) VALUES ({fvals}) ON CONFLICT DO NOTHING'), filtered)
        dst_conn.commit()


def main():
    # Fix URL for sync engine
    new_url = fix_url(NEW_URL)
    print(f"Source (shared): {BOT_DB}")
    print(f"Source (web-only): {WEB_DB}")
    print(f"Target: {new_url}")

    bot_engine = create_engine(fix_url(f"sqlite:///{BOT_DB}"))
    web_engine = create_engine(fix_url(f"sqlite:///{WEB_DB}"))
    new_engine = create_engine(new_url)

    # Create all tables in target
    Base.metadata.create_all(bind=new_engine)

    # Copy shared tables from bot.db
    for table in SHARED_TABLES:
        print(f"  Copying {table} from bot.db...")
        copy_table(bot_engine, new_engine, table)

    # Copy bot-only tables from bot.db
    for table in BOT_ONLY_TABLES:
        print(f"  Copying {table} from bot.db...")
        copy_table(bot_engine, new_engine, table)

    # Copy web-only tables from web.db
    for table in WEB_ONLY_TABLES:
        print(f"  Copying {table} from web.db...")
        copy_table(web_engine, new_engine, table)

    print("Done! Data migrated successfully.")


if __name__ == "__main__":
    main()
