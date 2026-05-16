"""Tests for sync_dbs.py and status unification."""
import sqlite3, os, sys, tempfile, unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from sync_dbs import (
    normalize_role, normalize_hw_status, normalize_hw_status_rev,
    normalize_pay_status, normalize_pay_status_rev,
)


class TestStatusMapping(unittest.TestCase):
    """Verify status mappings are consistent (no data loss)."""

    def test_homework_bot_to_web_roundtrip(self):
        for bot_s in ("pending", "accepted", "rejected"):
            web_s = normalize_hw_status(bot_s)
            back = normalize_hw_status_rev(web_s)
            self.assertEqual(back, bot_s, f"HW status roundtrip failed for {bot_s}")

    def test_homework_bot_to_web_all_statuses(self):
        cases = {"pending": "submitted", "accepted": "graded", "rejected": "returned"}
        for bot_s, expected in cases.items():
            self.assertEqual(normalize_hw_status(bot_s), expected)

    def test_homework_web_to_bot_all_statuses(self):
        cases = {"submitted": "pending", "graded": "accepted", "returned": "rejected"}
        for web_s, expected in cases.items():
            self.assertEqual(normalize_hw_status_rev(web_s), expected)

    def test_homework_unknown_status(self):
        self.assertEqual(normalize_hw_status("unknown"), "unknown")
        self.assertEqual(normalize_hw_status_rev("unknown"), "pending")

    def test_payment_bot_to_web_roundtrip(self):
        for bot_s in ("pending", "succeeded", "canceled"):
            web_s = normalize_pay_status(bot_s)
            back = normalize_pay_status_rev(web_s)
            self.assertEqual(back, bot_s, f"Payment status roundtrip failed for {bot_s}")

    def test_payment_bot_to_web_all(self):
        cases = {"pending": "pending", "succeeded": "paid", "canceled": "failed"}
        for bot_s, expected in cases.items():
            self.assertEqual(normalize_pay_status(bot_s), expected)

    def test_payment_web_to_bot_all(self):
        cases = {"paid": "succeeded", "pending": "pending", "failed": "canceled", "refunded": "canceled"}
        for web_s, expected in cases.items():
            self.assertEqual(normalize_pay_status_rev(web_s), expected)

    def test_payment_unknown_status(self):
        # Unknown statuses fall back to "pending" (safe default)
        self.assertEqual(normalize_pay_status("unknown"), "pending")
        self.assertEqual(normalize_pay_status_rev("unknown"), "pending")

    def test_normalize_role(self):
        self.assertEqual(normalize_role("student"), "student")
        self.assertEqual(normalize_role("teacher"), "teacher")
        self.assertEqual(normalize_role("pending"), "pending")
        self.assertEqual(normalize_role("unknown"), "student")


class TestSyncIdempotency(unittest.TestCase):
    """Verify the sync script logic doesn't corrupt data on re-run."""

    def setUp(self):
        self.tmpdir = tempfile.mkdtemp()
        self.bot_db = os.path.join(self.tmpdir, "bot.db")
        self.web_db = os.path.join(self.tmpdir, "web.db")

        bot = sqlite3.connect(self.bot_db)
        bot.executescript("""
            CREATE TABLE users (id INTEGER PRIMARY KEY, telegram_id INTEGER UNIQUE, full_name TEXT, phone TEXT, role TEXT, is_active INTEGER, email TEXT, username TEXT, avatar_url TEXT, registration_source TEXT, created_at TIMESTAMP, updated_at TIMESTAMP);
            CREATE TABLE students (id INTEGER PRIMARY KEY, user_id INTEGER UNIQUE REFERENCES users(id), student_code TEXT UNIQUE, enrollment_date DATE, frozen_until DATE, freeze_reason TEXT, last_debt_reminder DATE, is_active INTEGER DEFAULT 1);
            CREATE TABLE courses (id INTEGER PRIMARY KEY, name TEXT UNIQUE, description TEXT, duration_months INTEGER, lessons_count INTEGER, price_group INTEGER, price_individual INTEGER, is_active INTEGER DEFAULT 1);
            CREATE TABLE teachers (id INTEGER PRIMARY KEY, user_id INTEGER UNIQUE REFERENCES users(id), specialization TEXT, bio TEXT, is_active INTEGER DEFAULT 1);
            CREATE TABLE groups (id INTEGER PRIMARY KEY, name TEXT UNIQUE, course_id INTEGER REFERENCES courses(id), teacher_id INTEGER REFERENCES teachers(id), schedule_id INTEGER, days_bitmask INTEGER DEFAULT 0, max_students INTEGER DEFAULT 8, current_students INTEGER DEFAULT 0, start_date DATE, is_active INTEGER DEFAULT 1);
            CREATE TABLE lessons (id INTEGER PRIMARY KEY, group_id INTEGER REFERENCES groups(id), lesson_date DATE, lesson_time TEXT, teacher_id INTEGER, topic TEXT, is_completed INTEGER DEFAULT 0, homework TEXT, description TEXT, zoom_link TEXT, recording_url TEXT, is_recorded INTEGER DEFAULT 0);
            CREATE TABLE payments (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id), student_id INTEGER, amount NUMERIC(10,2), payment_type TEXT DEFAULT 'monthly_fee', purpose TEXT, status TEXT DEFAULT 'pending', payment_method TEXT, yookassa_id TEXT UNIQUE, admin_id INTEGER, payment_date TIMESTAMP, created_at TIMESTAMP, updated_at TIMESTAMP, currency TEXT DEFAULT 'UZS', period_month INTEGER, period_year INTEGER);
            CREATE TABLE attendance (id INTEGER PRIMARY KEY, lesson_id INTEGER REFERENCES lessons(id), student_id INTEGER REFERENCES students(id), status TEXT DEFAULT 'present', notes TEXT);
            CREATE TABLE homework_submissions (id INTEGER PRIMARY KEY, student_id INTEGER REFERENCES students(id), lesson_id INTEGER REFERENCES lessons(id), file_id TEXT, file_type TEXT, text TEXT, status TEXT DEFAULT 'pending', grade INTEGER, teacher_comment TEXT, created_at TIMESTAMP);
            CREATE TABLE student_groups (id INTEGER PRIMARY KEY, student_id INTEGER REFERENCES students(id), group_id INTEGER REFERENCES groups(id), status TEXT DEFAULT 'active', created_at TIMESTAMP);
            CREATE TABLE feedback (id INTEGER PRIMARY KEY, user_id INTEGER REFERENCES users(id), rating INTEGER, comment TEXT, lesson_id INTEGER, course_id INTEGER, created_at TIMESTAMP);
            INSERT INTO users (telegram_id, full_name, phone, role, is_active) VALUES (12345, 'Test User', '+79001234567', 'student', 1);
        """)
        bot.commit()
        bot.close()

        web = sqlite3.connect(self.web_db)
        web.executescript("""
            CREATE TABLE users (id INTEGER PRIMARY KEY, telegram_id INTEGER UNIQUE, name TEXT, phone TEXT, role TEXT, is_active INTEGER, email TEXT, full_name TEXT, username TEXT, registration_source TEXT, updated_at TIMESTAMP);
            CREATE TABLE students (id INTEGER PRIMARY KEY, user_id INTEGER UNIQUE REFERENCES users(id), student_code TEXT UNIQUE, enrollment_date DATE, frozen_until DATE, freeze_reason TEXT, last_debt_reminder DATE, is_active INTEGER DEFAULT 1);
            CREATE TABLE courses (id INTEGER PRIMARY KEY, title TEXT, name TEXT, description TEXT, duration TEXT, price FLOAT, duration_months INTEGER, lessons_count INTEGER, price_group INTEGER, price_individual INTEGER, is_active INTEGER DEFAULT 1);
            CREATE TABLE teachers (id INTEGER PRIMARY KEY, name TEXT, bio TEXT, subjects TEXT, user_id INTEGER REFERENCES users(id), specialization TEXT, is_active INTEGER DEFAULT 1);
            CREATE TABLE groups (id INTEGER PRIMARY KEY, name TEXT, course_id INTEGER REFERENCES courses(id), teacher_id INTEGER REFERENCES teachers(id), max_students INTEGER DEFAULT 8, schedule_json TEXT, schedule_id INTEGER, days_bitmask INTEGER DEFAULT 0, start_date DATE, current_students INTEGER DEFAULT 0, bot_group_id INTEGER, is_active INTEGER DEFAULT 1);
            CREATE TABLE lessons (id INTEGER PRIMARY KEY, group_id INTEGER REFERENCES groups(id), topic TEXT, scheduled_at TIMESTAMP, is_completed INTEGER DEFAULT 0, lesson_date DATE, lesson_time TEXT, homework TEXT, description TEXT, zoom_link TEXT, bot_lesson_id INTEGER);
            CREATE TABLE payments (id INTEGER PRIMARY KEY, student_id INTEGER REFERENCES users(id), user_id INTEGER, amount FLOAT, currency TEXT DEFAULT 'UZS', method TEXT DEFAULT 'cash', status TEXT DEFAULT 'paid', description TEXT, payment_type TEXT DEFAULT 'monthly_fee', purpose TEXT, yookassa_id TEXT, admin_id INTEGER, payment_date TIMESTAMP, bot_payment_id INTEGER, created_at TIMESTAMP);
            CREATE TABLE lesson_attendance (id INTEGER PRIMARY KEY, lesson_id INTEGER REFERENCES lessons(id), student_id INTEGER REFERENCES users(id), attended INTEGER DEFAULT 0);
            CREATE TABLE homework_submissions (id INTEGER PRIMARY KEY, homework_id INTEGER, student_id INTEGER REFERENCES users(id), content TEXT, grade TEXT, feedback TEXT, status TEXT DEFAULT 'submitted', lesson_id INTEGER, file_id TEXT, file_type TEXT, teacher_comment TEXT, bot_submission_id INTEGER, submitted_at TIMESTAMP);
            CREATE TABLE homeworks (id INTEGER PRIMARY KEY, course_id INTEGER, group_id INTEGER, title TEXT, description TEXT, due_date TIMESTAMP, created_at TIMESTAMP);
            CREATE TABLE enrollments (id INTEGER PRIMARY KEY, student_id INTEGER REFERENCES users(id), course_id INTEGER REFERENCES courses(id), group_id INTEGER REFERENCES groups(id), progress INTEGER DEFAULT 0, xp INTEGER DEFAULT 0);
            CREATE TABLE reviews (id INTEGER PRIMARY KEY, student_name TEXT, text TEXT, rating INTEGER, user_id INTEGER, lesson_id INTEGER, course_id INTEGER, bot_feedback_id INTEGER, created_at TIMESTAMP);
            INSERT INTO users (telegram_id, name, phone, role, is_active, email, full_name) VALUES (12345, 'Old Name', '+79001234567', 'student', 1, 'old@test.com', 'Old Name');
        """)
        web.commit()
        web.close()

    def test_sync_updates_existing_user(self):
        import sync_dbs
        orig_bot = sync_dbs.BOT_DB
        orig_web = sync_dbs.WEB_DB
        sync_dbs.BOT_DB = self.bot_db
        sync_dbs.WEB_DB = self.web_db
        try:
            sync_dbs.sync_bot_to_web()
        finally:
            sync_dbs.BOT_DB = orig_bot
            sync_dbs.WEB_DB = orig_web

        web = sqlite3.connect(self.web_db)
        cur = web.execute("SELECT name FROM users WHERE telegram_id=12345")
        name = cur.fetchone()[0]
        web.close()
        self.assertEqual(name, "Test User", "Sync should update name from bot")


if __name__ == "__main__":
    unittest.main()
