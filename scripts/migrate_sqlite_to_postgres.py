"""
SQLite -> Postgres data migration.

Usage:
    python scripts/migrate_sqlite_to_postgres.py

Reads from web/education_center.db (sqlite, sync) and copies all rows
into the local Postgres instance using SQLAlchemy reflection. The Postgres
schema must already be created (run alembic upgrade head against PG first).
"""
from __future__ import annotations
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from sqlalchemy import create_engine, MetaData, text, inspect
from sqlalchemy.exc import IntegrityError

SQLITE_PATH = ROOT / "web" / "education_center.db"
SQLITE_URL = f"sqlite:///{SQLITE_PATH.as_posix()}"
PG_URL = "postgresql+psycopg2://postgres:root@localhost:5432/education_crm"

# Order matters for FK constraints: parents first, children later.
TABLE_ORDER = [
    # standalone / lookup
    "settings", "training_types", "student_statuses", "promo_codes",
    "lesson_templates",
    # core users
    "users", "admins", "teachers", "students",
    # courses / groups (depend on users/teachers)
    "courses", "groups",
    # leads / registrations
    "leads", "lead_history", "registrations", "referrals",
    # enrollments depend on users + groups + courses
    "enrollments", "student_groups",
    # lessons depend on groups
    "lessons", "schedules",
    # homework depends on lessons
    "homeworks", "homework_submissions",
    # attendance depends on lessons + students
    "attendance", "student_progress",
    # money
    "payments",
    # achievements
    "achievements", "user_achievements", "student_achievements",
    # comms
    "messages", "notifications", "broadcast_campaigns", "reminders",
    "feedback", "reviews",
    # auth / system
    "sessions", "login_attempts", "materials",
]


def migrate():
    print(f"\n  SQLite source : {SQLITE_URL}")
    print(f"  Postgres target: {PG_URL}\n")

    sq = create_engine(SQLITE_URL, future=True)
    pg = create_engine(PG_URL, future=True)

    # Reflect both
    sq_meta = MetaData()
    sq_meta.reflect(bind=sq)
    pg_meta = MetaData()
    pg_meta.reflect(bind=pg)

    sq_tables = set(sq_meta.tables.keys())
    pg_tables = set(pg_meta.tables.keys())

    # Use predefined order, then any leftover tables present in both
    seen = set()
    plan = []
    for name in TABLE_ORDER:
        if name in sq_tables and name in pg_tables:
            plan.append(name)
            seen.add(name)
    for name in sq_tables & pg_tables:
        if name not in seen and name != "alembic_version":
            plan.append(name)
            seen.add(name)

    print(f"  Tables found in both: {len(plan)}")
    print(f"  In SQLite only      : {sorted(sq_tables - pg_tables)}")
    print(f"  In Postgres only    : {sorted(pg_tables - sq_tables - {'alembic_version'})}\n")

    inspector_pg = inspect(pg)
    totals_copied = 0
    totals_skipped = 0

    with sq.connect() as sq_conn:
        for tname in plan:
            sq_table = sq_meta.tables[tname]
            pg_table = pg_meta.tables[tname]

            # Skip tables that have data already in Postgres
            with pg.connect() as pg_conn:
                existing = pg_conn.execute(text(f'SELECT COUNT(*) FROM "{tname}"')).scalar_one()
            if existing:
                print(f"  ! {tname:<28} skipped (already has {existing} rows in Postgres)")
                totals_skipped += existing
                continue

            rows = sq_conn.execute(sq_table.select()).mappings().all()
            if not rows:
                print(f"  - {tname:<28} 0 rows")
                continue

            # Only keep columns that exist in BOTH tables
            common_cols = set(c.name for c in sq_table.columns) & set(c.name for c in pg_table.columns)
            filtered = [{k: v for k, v in dict(r).items() if k in common_cols} for r in rows]

            try:
                with pg.begin() as pg_conn:
                    pg_conn.execute(pg_table.insert(), filtered)
                print(f"  + {tname:<28} {len(rows)} rows")
                totals_copied += len(rows)
            except (IntegrityError, Exception) as e:
                # Retry one-by-one to skip bad rows
                print(f"  ! {tname:<28} bulk failed ({type(e).__name__}), retrying row-by-row…")
                ok = 0
                fail = 0
                for r in filtered:
                    try:
                        with pg.begin() as pg_conn:
                            pg_conn.execute(pg_table.insert(), [r])
                        ok += 1
                    except Exception:
                        fail += 1
                print(f"  + {tname:<28} {ok} rows (skipped {fail} with FK/unique errors)")
                totals_copied += ok

    # Reset Postgres sequences (SQLite uses ROWID, PG uses sequences)
    print("\n  Resetting Postgres sequences…")
    for tname in plan:
        try:
            with pg.connect() as pg_conn:
                row = pg_conn.execute(text(f"""
                    SELECT pg_get_serial_sequence(:t, c.column_name) AS seq, c.column_name
                    FROM information_schema.columns c
                    WHERE c.table_name = :t
                      AND c.table_schema = 'public'
                      AND pg_get_serial_sequence(:t, c.column_name) IS NOT NULL
                    LIMIT 1
                """), {"t": tname}).first()
                if not row or not row.seq:
                    continue
                seq = row.seq
                col = row.column_name
                max_id = pg_conn.execute(text(f'SELECT COALESCE(MAX("{col}"), 0) FROM "{tname}"')).scalar_one()
            if max_id and max_id > 0:
                with pg.begin() as pg_conn:
                    pg_conn.execute(text(f"SELECT setval('{seq}', {max_id}, true)"))
                print(f"    sequence {tname}.{col} -> {max_id}")
        except Exception as e:
            print(f"    ! sequence reset for {tname} failed: {e}")

    print(f"\n  DONE. Copied {totals_copied} rows total.\n")


if __name__ == "__main__":
    migrate()
