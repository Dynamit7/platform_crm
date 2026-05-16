"""
Migrate web DB schema to match updated models.py (add sync columns + new tables).
Safe to run multiple times — skips existing columns/tables.
"""
import sqlite3, os

WEB_DB = os.path.join(os.path.dirname(__file__), "web", "education_center_web.db")
BOT_DB = os.path.join(os.path.dirname(__file__), "education_center_v2.db")


def ensure_column(cur, table, col, definition):
    cur.execute(f"PRAGMA table_info({table})")
    existing = {r[1] for r in cur.fetchall()}
    if col not in existing:
        try:
            cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {definition}")
            print(f"  + {table}.{col}")
        except Exception as e:
            print(f"  ! {table}.{col}: {e}")


def ensure_table(cur, name, ddl):
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (name,))
    if not cur.fetchone():
        cur.execute(ddl)
        print(f"  + TABLE {name} created")


def migrate_web():
    print("\nMigrating WEB DB schema...")
    conn = sqlite3.connect(WEB_DB)
    cur = conn.cursor()

    # --- User columns ---
    for col, defn in [
        ("full_name", "VARCHAR"),
        ("username", "VARCHAR"),
        ("updated_at", "TIMESTAMP"),
    ]:
        ensure_column(cur, "users", col, defn)
    # telegram_id → BIGINT (SQLite doesn't enforce types, but good practice)
    ensure_column(cur, "users", "telegram_id_big", "BIGINT")

    # --- Course columns ---
    for col, defn in [
        ("name", "VARCHAR"),
        ("duration_months", "INTEGER"),
        ("lessons_count", "INTEGER"),
        ("price_group", "INTEGER"),
        ("price_individual", "INTEGER"),
    ]:
        ensure_column(cur, "courses", col, defn)

    # --- Teacher columns ---
    for col, defn in [
        ("specialization", "VARCHAR"),
        ("is_active", "INTEGER DEFAULT 1"),
    ]:
        ensure_column(cur, "teachers", col, defn)

    # --- Review columns ---
    for col, defn in [
        ("user_id", "INTEGER"),
        ("lesson_id", "INTEGER"),
        ("course_id", "INTEGER"),
        ("bot_feedback_id", "INTEGER"),
        ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
    ]:
        ensure_column(cur, "reviews", col, defn)

    # --- Group columns ---
    for col, defn in [
        ("bot_group_id", "INTEGER"),
        ("schedule_id", "INTEGER"),
        ("days_bitmask", "INTEGER DEFAULT 0"),
        ("start_date", "DATE"),
        ("current_students", "INTEGER DEFAULT 0"),
    ]:
        ensure_column(cur, "groups", col, defn)

    # --- Lesson columns ---
    for col, defn in [
        ("bot_lesson_id", "INTEGER"),
        ("lesson_date", "DATE"),
        ("lesson_time", "VARCHAR"),
        ("teacher_id", "INTEGER"),
        ("homework", "VARCHAR"),
    ]:
        ensure_column(cur, "lessons", col, defn)

    # --- HomeworkSubmission columns ---
    for col, defn in [
        ("lesson_id", "INTEGER"),
        ("file_id", "VARCHAR"),
        ("file_type", "VARCHAR"),
        ("teacher_comment", "VARCHAR"),
        ("bot_submission_id", "INTEGER"),
    ]:
        ensure_column(cur, "homework_submissions", col, defn)

    # --- Payment columns ---
    for col, defn in [
        ("user_id", "INTEGER"),
        ("payment_type", "VARCHAR DEFAULT 'monthly_fee'"),
        ("purpose", "VARCHAR"),
        ("yookassa_id", "VARCHAR"),
        ("admin_id", "INTEGER"),
        ("payment_date", "TIMESTAMP"),
        ("updated_at", "TIMESTAMP"),
    ]:
        ensure_column(cur, "payments", col, defn)

    # --- New tables ---
    ensure_table(cur, "schedules", """
        CREATE TABLE schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) UNIQUE,
            time_start VARCHAR(50),
            time_end VARCHAR(50),
            is_active INTEGER DEFAULT 1
        )
    """)
    ensure_table(cur, "training_types", """
        CREATE TABLE training_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) UNIQUE,
            description TEXT,
            is_active INTEGER DEFAULT 1
        )
    """)
    ensure_table(cur, "student_statuses", """
        CREATE TABLE student_statuses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code VARCHAR(50) UNIQUE,
            name VARCHAR(100),
            description VARCHAR(255)
        )
    """)
    ensure_table(cur, "registrations", """
        CREATE TABLE registrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            course_id INTEGER REFERENCES courses(id),
            training_type_id INTEGER,
            status_code VARCHAR(50) DEFAULT 'pending',
            trial_lesson_time TIMESTAMP,
            notes VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    ensure_table(cur, "student_progress", """
        CREATE TABLE student_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER REFERENCES students(id),
            course_id INTEGER,
            lesson_id INTEGER,
            grade INTEGER,
            comment VARCHAR(500),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    ensure_table(cur, "materials", """
        CREATE TABLE materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uploader_id INTEGER REFERENCES teachers(id),
            file_id VARCHAR(255),
            file_type VARCHAR(50),
            title VARCHAR(255),
            group_id INTEGER REFERENCES groups(id),
            lesson_id INTEGER REFERENCES lessons(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    ensure_table(cur, "students", """
        CREATE TABLE students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE REFERENCES users(id),
            student_code VARCHAR(50) UNIQUE,
            enrollment_date DATE,
            frozen_until DATE,
            freeze_reason VARCHAR(255),
            last_debt_reminder DATE,
            is_active INTEGER DEFAULT 1
        )
    """)
    ensure_table(cur, "student_achievements", """
        CREATE TABLE student_achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER REFERENCES students(id),
            achievement_id INTEGER,
            earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    ensure_table(cur, "achievements_catalog", """
        CREATE TABLE achievements_catalog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255),
            description TEXT,
            icon VARCHAR(50),
            xp_reward INTEGER DEFAULT 0
        )
    """)
    ensure_table(cur, "reminders", """
        CREATE TABLE reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            text TEXT,
            due_date TIMESTAMP,
            sent INTEGER DEFAULT 0
        )
    """)

    conn.commit()
    conn.close()
    print("WEB migration done.")


def migrate_bot():
    print("\nMigrating BOT DB schema...")
    conn = sqlite3.connect(BOT_DB)
    cur = conn.cursor()

    # Add columns that web has but bot doesn't
    for col, defn in [
        ("email", "VARCHAR"),
        ("username", "VARCHAR"),  # bot has username already, but just in case
    ]:
        ensure_column(cur, "users", col, defn)

    # Bot is missing `avatar_url` and `registration_source` in users
    ensure_column(cur, "users", "avatar_url", "VARCHAR")
    ensure_column(cur, "users", "registration_source", "VARCHAR DEFAULT 'telegram'")

    # Bot groups may need schedule_json field for web compat
    ensure_column(cur, "groups", "schedule_json", "TEXT")

    # Bot lessons may need zoom_link
    ensure_column(cur, "lessons", "zoom_link", "VARCHAR")
    ensure_column(cur, "lessons", "description", "TEXT")
    ensure_column(cur, "lessons", "recording_url", "VARCHAR")
    ensure_column(cur, "lessons", "is_recorded", "INTEGER DEFAULT 0")

    # Bot payments may need currency, period_month, period_year
    ensure_column(cur, "payments", "currency", "VARCHAR DEFAULT 'UZS'")
    ensure_column(cur, "payments", "period_month", "INTEGER")
    ensure_column(cur, "payments", "period_year", "INTEGER")

    conn.commit()
    conn.close()
    print("BOT migration done.")


if __name__ == "__main__":
    # Migrate both legacy web DB and the unified bot DB
    migrate_web()
    migrate_bot()

    # Also apply web columns to the unified DB (единая БД — web reads bot's DB)
    print("\nApplying web columns to unified DB (education_center_v2.db)...")
    conn = sqlite3.connect(BOT_DB)
    cur = conn.cursor()
    # Re-run web column additions against bot DB
    for table, cols in [
        ("users", [("full_name", "VARCHAR"), ("username", "VARCHAR"), ("updated_at", "TIMESTAMP")]),
        ("courses", [("name", "VARCHAR"), ("duration_months", "INTEGER"), ("lessons_count", "INTEGER"),
                     ("price_group", "INTEGER"), ("price_individual", "INTEGER")]),
        ("teachers", [("specialization", "VARCHAR"), ("is_active", "INTEGER DEFAULT 1")]),
        ("groups", [("bot_group_id", "INTEGER"), ("schedule_id", "INTEGER"),
                    ("days_bitmask", "INTEGER DEFAULT 0"), ("start_date", "DATE"),
                    ("current_students", "INTEGER DEFAULT 0")]),
        ("lessons", [("bot_lesson_id", "INTEGER"), ("lesson_date", "DATE"), ("lesson_time", "VARCHAR"),
                     ("teacher_id", "INTEGER"), ("homework", "VARCHAR")]),
        ("payments", [("user_id", "INTEGER"), ("payment_type", "VARCHAR DEFAULT 'monthly_fee'"),
                      ("purpose", "VARCHAR"), ("yookassa_id", "VARCHAR"), ("admin_id", "INTEGER"),
                      ("payment_date", "TIMESTAMP"), ("updated_at", "TIMESTAMP")]),
        ("homework_submissions", [("lesson_id", "INTEGER"), ("file_id", "VARCHAR"), ("file_type", "VARCHAR"),
                                  ("teacher_comment", "VARCHAR"), ("bot_submission_id", "INTEGER")]),
        ("reviews", [("user_id", "INTEGER"), ("lesson_id", "INTEGER"), ("course_id", "INTEGER"),
                     ("bot_feedback_id", "INTEGER"), ("created_at", "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")]),
    ]:
        for col, defn in cols:
            ensure_column(cur, table, col, defn)
    # Extra tables that only web has
    for name, ddl in [
        ("achievements_catalog", """CREATE TABLE achievements_catalog (
            id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(255), description TEXT,
            icon VARCHAR(50), xp_reward INTEGER DEFAULT 0)"""),
        ("reminders", """CREATE TABLE reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER REFERENCES users(id),
            text TEXT, due_date TIMESTAMP, sent INTEGER DEFAULT 0)"""),
        ("leads", """CREATE TABLE leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR, phone VARCHAR,
            course_id INTEGER, status VARCHAR DEFAULT 'new', notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"""),
        ("vocabulary_words", """CREATE TABLE vocabulary_words (
            id INTEGER PRIMARY KEY AUTOINCREMENT, word VARCHAR UNIQUE, translation VARCHAR,
            example TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"""),
        ("notifications", """CREATE TABLE notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title VARCHAR, message TEXT,
            notification_type VARCHAR DEFAULT 'info', is_read INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"""),
        ("messages", """CREATE TABLE messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, text TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"""),
        ("homeworks", """CREATE TABLE homeworks (
            id INTEGER PRIMARY KEY AUTOINCREMENT, course_id INTEGER, group_id INTEGER,
            title VARCHAR, description TEXT, due_date TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"""),
    ]:
        ensure_table(cur, name, ddl)
    conn.commit()
    conn.close()
    print("Unified DB migration done.")

    print("\nMigration complete. Run 'sync_dbs.py --both' to sync data.")
