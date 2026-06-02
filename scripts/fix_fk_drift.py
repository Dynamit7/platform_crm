"""
fix_fk_drift.py — выравнивает FK `attendance.student_id` и `payments.student_id`
с моделями ORM.

В коде (core/models.py) эти колонки декларированы как FK на `users.id`,
а в реальной БД FK указывают на `students.id`. Из-за этого:
  * API ищет посещаемость / платежи по `user_id`, а в БД хранятся `students.id`
    → дашборд показывает 0.
  * Сид-скрипт вынужден костылить и подкладывать `student.id`.

Действия (атомарно в одной транзакции):
  1. ALTER TABLE attendance DROP CONSTRAINT
  2. UPDATE attendance SET student_id = students.user_id (по mapping)
  3. ALTER TABLE attendance ADD CONSTRAINT → users(id)
  4. То же для payments

Безопасно перезапускать: если FK уже на users(id), миграция шага не делает.
"""
from __future__ import annotations

import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from sqlalchemy import create_engine, text

DB_URL = "postgresql+psycopg2://postgres:root@localhost:5432/education_crm"


def fk_target(conn, table: str, column: str) -> str | None:
    row = conn.execute(text("""
        SELECT ccu.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = :t AND kcu.column_name = :c
    """), {"t": table, "c": column}).fetchone()
    return row[0] if row else None


def migrate(conn, table: str, on_delete: str) -> None:
    fk = f"{table}_student_id_fkey"
    target = fk_target(conn, table, "student_id")
    if target == "users":
        print(f"  [{table}] FK уже на users.id — пропуск.")
        return
    if target != "students":
        print(f"  [{table}] неожиданное состояние FK ({target}) — пропуск.")
        return

    print(f"  [{table}] FK на students.id → мигрирую → users.id")
    conn.execute(text(f"ALTER TABLE {table} DROP CONSTRAINT IF EXISTS {fk}"))
    res = conn.execute(text(f"""
        UPDATE {table} AS t
        SET student_id = s.user_id
        FROM students s
        WHERE s.id = t.student_id
    """))
    print(f"  [{table}] обновлено строк: {res.rowcount}")
    conn.execute(text(f"""
        ALTER TABLE {table}
        ADD CONSTRAINT {fk}
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE {on_delete}
    """))
    print(f"  [{table}] FK пересоздан → users(id) ON DELETE {on_delete}")


def main() -> None:
    engine = create_engine(DB_URL, client_encoding="utf8")
    with engine.begin() as conn:
        print("=" * 60)
        print(" FK DRIFT FIX")
        print("=" * 60)
        migrate(conn, "attendance", "CASCADE")
        migrate(conn, "payments", "SET NULL")

    # верификация
    with engine.connect() as conn:
        print()
        print("--- verification ---")
        for tbl in ("attendance", "payments"):
            target = fk_target(conn, tbl, "student_id")
            print(f"  {tbl}.student_id FK → {target}")


if __name__ == "__main__":
    main()
