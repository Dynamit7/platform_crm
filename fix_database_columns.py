import sys
import sqlite3
from datetime import datetime

sys.stdout.reconfigure(encoding="utf-8")

DB_NAME = "education_center_v2.db"

# Эталонная схема: таблица -> [(колонка, тип, DEFAULT-значение для UPDATE или None)]
EXPECTED_SCHEMA = {
    "users": [
        ("telegram_id",  "INTEGER",       None),
        ("username",     "VARCHAR(255)",  None),
        ("full_name",    "VARCHAR(255)",  None),
        ("phone",        "VARCHAR(50)",   None),
        ("email",        "VARCHAR(255)",  None),
        ("role",         "VARCHAR(20)",   None),
        ("is_active",    "BOOLEAN",       "1"),
        ("created_at",   "TIMESTAMP",     "CURRENT_TIMESTAMP"),
        ("updated_at",   "TIMESTAMP",     "CURRENT_TIMESTAMP"),
    ],
    "admins": [
        ("user_id",      "INTEGER",  None),
        ("permissions",  "TEXT",     None),
    ],
    "teachers": [
        ("user_id",        "INTEGER",      None),
        ("specialization", "VARCHAR(255)", None),
        ("bio",            "TEXT",         None),
        ("is_active",      "BOOLEAN",      "1"),
    ],
    "students": [
        ("user_id",            "INTEGER",      None),
        ("student_code",       "VARCHAR(50)",  None),
        ("enrollment_date",    "DATE",         "CURRENT_DATE"),
        ("frozen_until",       "DATE",         None),
        ("freeze_reason",      "VARCHAR(255)", None),
        ("last_debt_reminder", "DATE",         None),
        ("is_active",          "BOOLEAN",      "1"),
    ],
    "courses": [
        ("name",             "VARCHAR(255)", None),
        ("description",      "TEXT",         None),
        ("duration_months",  "INTEGER",      None),
        ("lessons_count",    "INTEGER",      None),
        ("price_group",      "INTEGER",      None),
        ("price_individual", "INTEGER",      None),
        ("is_active",        "BOOLEAN",      "1"),
    ],
    "schedules": [
        ("name",       "VARCHAR(255)", None),
        ("time_start", "VARCHAR(50)",  None),
        ("time_end",   "VARCHAR(50)",  None),
        ("is_active",  "BOOLEAN",      "1"),
    ],
    "training_types": [
        ("name",       "VARCHAR(255)", None),
        ("description","TEXT",         None),
        ("is_active",  "BOOLEAN",      "1"),
        ("created_at", "TIMESTAMP",    "CURRENT_TIMESTAMP"),
    ],
    "groups": [
        ("name",             "VARCHAR(255)", None),
        ("course_id",        "INTEGER",      None),
        ("teacher_id",       "INTEGER",      None),
        ("schedule_id",      "INTEGER",      None),
        ("days_bitmask",     "INTEGER",      "0"),
        ("max_students",     "INTEGER",      "10"),
        ("current_students", "INTEGER",      "0"),
        ("start_date",       "DATE",         None),
        ("is_active",        "BOOLEAN",      "1"),
    ],
    "student_groups": [
        ("student_id", "INTEGER",     None),
        ("group_id",   "INTEGER",     None),
        ("status",     "VARCHAR(50)", None),
    ],
    "lessons": [
        ("group_id",    "INTEGER",      None),
        ("lesson_date", "DATE",         None),
        ("teacher_id",  "INTEGER",      None),
        ("topic",       "VARCHAR(255)", None),
        ("lesson_time", "VARCHAR(50)",  None),
        ("is_completed","BOOLEAN",      "0"),
    ],
    "attendance": [
        ("lesson_id",  "INTEGER",      None),
        ("student_id", "INTEGER",      None),
        ("status",     "VARCHAR(50)",  None),
        ("notes",      "VARCHAR(255)", None),
    ],
    "registrations": [
        ("user_id",           "INTEGER",      None),
        ("course_id",         "INTEGER",      None),
        ("training_type_id",  "INTEGER",      None),
        ("status_code",       "VARCHAR(50)",  None),
        ("trial_lesson_time", "TIMESTAMP",    None),
        ("notes",             "VARCHAR(500)", None),
        ("created_at",        "TIMESTAMP",    "CURRENT_TIMESTAMP"),
    ],
    "payments": [
        ("user_id",       "INTEGER",        None),
        ("amount",        "NUMERIC(10, 2)", None),
        ("payment_type",  "VARCHAR(50)",    None),
        ("purpose",       "VARCHAR(255)",   None),
        ("student_id",    "INTEGER",        None),
        ("status",        "VARCHAR(50)",    None),
        ("payment_method","VARCHAR(50)",    None),
        ("yookassa_id",   "VARCHAR(100)",   None),
        ("admin_id",      "INTEGER",        None),
        ("payment_date",  "TIMESTAMP",      "CURRENT_TIMESTAMP"),
        ("created_at",    "TIMESTAMP",      "CURRENT_TIMESTAMP"),
        ("updated_at",    "TIMESTAMP",      "CURRENT_TIMESTAMP"),
    ],
    "settings": [
        ("key",         "VARCHAR(50)", None),
        ("value",       "TEXT",        None),
        ("description", "VARCHAR(255)",None),
    ],
    "materials": [
        ("uploader_id", "INTEGER",      None),
        ("file_id",     "VARCHAR(255)", None),
        ("file_type",   "VARCHAR(50)",  None),
        ("title",       "VARCHAR(255)", None),
        ("group_id",    "INTEGER",      None),
        ("lesson_id",   "INTEGER",      None),
        ("created_at",  "TIMESTAMP",    "CURRENT_TIMESTAMP"),
    ],
    "student_statuses": [
        ("code",        "VARCHAR(50)",  None),
        ("name",        "VARCHAR(100)", None),
        ("description", "VARCHAR(255)", None),
    ],
    "student_progress": [
        ("student_id", "INTEGER",      None),
        ("course_id",  "INTEGER",      None),
        ("lesson_id",  "INTEGER",      None),
        ("grade",      "INTEGER",      None),
        ("comment",    "VARCHAR(500)", None),
        ("created_at", "TIMESTAMP",    "CURRENT_TIMESTAMP"),
    ],
    "homework_submissions": [
        ("student_id",      "INTEGER",       None),
        ("lesson_id",       "INTEGER",       None),
        ("file_id",         "VARCHAR(255)",  None),
        ("text",            "VARCHAR(2000)", None),
        ("status",          "VARCHAR(50)",   None),
        ("grade",           "INTEGER",       None),
        ("teacher_comment", "VARCHAR(500)",  None),
        ("created_at",      "TIMESTAMP",     "CURRENT_TIMESTAMP"),
    ],
    "feedback": [
        ("user_id",    "INTEGER",       None),
        ("rating",     "INTEGER",       None),
        ("student_id", "INTEGER",       None),
        ("lesson_id",  "INTEGER",       None),
        ("course_id",  "INTEGER",       None),
        ("comment",    "VARCHAR(1000)", None),
        ("created_at", "TIMESTAMP",     "CURRENT_TIMESTAMP"),
    ],
    "reminders": [
        ("user_id",    "INTEGER",      None),
        ("text",       "VARCHAR(500)", None),
        ("due_date",   "DATETIME",     None),
        ("sent",       "BOOLEAN",      "0"),
        ("created_at", "DATETIME",     "CURRENT_TIMESTAMP"),
    ],
    "achievements": [
        ("name",        "VARCHAR(100)", None),
        ("description", "VARCHAR(255)", None),
        ("icon",        "VARCHAR(10)",  None),
        ("xp_reward",   "INTEGER",      "0"),
        ("created_at",  "DATETIME",     "CURRENT_TIMESTAMP"),
    ],
    "student_achievements": [
        ("student_id",     "INTEGER",  None),
        ("achievement_id", "INTEGER",  None),
        ("earned_at",      "DATETIME", "CURRENT_TIMESTAMP"),
    ],
}


def fix_database():
    print("=" * 60)
    print("  DB SYNC SCRIPT")
    print(f"  Database: {DB_NAME}")
    print(f"  Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    existing_tables = {row[0] for row in cursor.fetchall()}

    total_added = 0
    total_missing_tables = 0

    for table, columns in EXPECTED_SCHEMA.items():
        if table not in existing_tables:
            print(f"\n[!!!] TABLE MISSING: '{table}' - run rebuild_database.py")
            total_missing_tables += 1
            continue

        cursor.execute(f"PRAGMA table_info({table})")
        existing_cols = {row[1] for row in cursor.fetchall()}
        header_printed = False

        for col_name, col_type, update_default in columns:
            if col_name not in existing_cols:
                if not header_printed:
                    print(f"\n  Table '{table}':")
                    header_printed = True

                # SQLite не принимает CURRENT_TIMESTAMP как DEFAULT при ALTER TABLE
                # поэтому добавляем без DEFAULT, потом UPDATE-ом заполняем
                ddl = f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type}"
                try:
                    cursor.execute(ddl)
                    if update_default:
                        cursor.execute(
                            f"UPDATE {table} SET {col_name} = {update_default} "
                            f"WHERE {col_name} IS NULL"
                        )
                    print(f"    [OK] Added column: {col_name} ({col_type})")
                    total_added += 1
                except Exception as e:
                    print(f"    [ERR] {col_name}: {e}")

    conn.commit()
    conn.close()

    print("\n" + "=" * 60)
    if total_added == 0 and total_missing_tables == 0:
        print("[OK] Schema is fully synchronized. No changes needed.")
    else:
        if total_added > 0:
            print(f"[OK] Total columns added: {total_added}")
        if total_missing_tables > 0:
            print(f"[!!!] Missing tables: {total_missing_tables} - run rebuild_database.py")
    print("=" * 60)


if __name__ == "__main__":
    fix_database()
