"""Tests for core.models schema definition."""
import sys, os, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


class TestCoreModels(unittest.TestCase):
    """Verify the unified models are self-consistent."""

    def setUp(self):
        from core.models import Base
        self.metadata = Base.metadata

    def test_all_37_tables(self):
        """Count must match expected 37 unified tables."""
        self.assertEqual(len(self.metadata.tables), 37,
                         f"Expected 37 tables, got {len(self.metadata.tables)}. "
                         f"If you added/removed tables, update this test.")

    def test_shared_tables_exist(self):
        required = ["users", "students", "teachers", "courses", "groups",
                     "lessons", "payments", "homework_submissions",
                     "lesson_templates", "promo_codes", "referrals"]
        for t in required:
            self.assertIn(t, self.metadata.tables, f"Missing table: {t}")

    def test_bot_only_tables_exist(self):
        required = ["admins", "training_types", "schedules", "student_groups",
                     "registrations", "attendance", "feedback", "materials",
                     "student_statuses", "student_progress", "settings",
                     "reminders", "achievements", "student_achievements"]
        for t in required:
            self.assertIn(t, self.metadata.tables, f"Missing bot table: {t}")

    def test_web_only_tables_exist(self):
        required = ["reviews", "leads", "enrollments", "homeworks",
                     "messages", "vocabulary_words", "notifications",
                     "lead_history", "broadcast_campaigns",
                     "login_attempts", "sessions", "user_achievements"]
        for t in required:
            self.assertIn(t, self.metadata.tables, f"Missing web table: {t}")

    def test_users_merged_columns(self):
        tbl = self.metadata.tables["users"]
        bot_fields = {"telegram_id", "name", "username", "full_name_placeholder",
                      "role", "is_active", "referral_code", "updated_at"}
        web_fields = {"email", "password_hash", "avatar_url", "registration_source",
                      "google_id", "date_of_birth", "reset_token",
                      "reset_token_expires", "last_login_at"}
        cols = {c.name for c in tbl.columns}
        for f in bot_fields - {"full_name_placeholder", "username"}:
            self.assertIn(f, cols, f"User missing bot column: {f}")
        for f in web_fields:
            self.assertIn(f, cols, f"User missing web column: {f}")
        self.assertIn("name", cols)
        self.assertNotIn("full_name", cols)

    def test_attendance_merged(self):
        tbl = self.metadata.tables["attendance"]
        cols = {c.name for c in tbl.columns}
        self.assertIn("status", cols)
        self.assertIn("attended", cols)

    def test_payments_merged(self):
        tbl = self.metadata.tables["payments"]
        cols = {c.name for c in tbl.columns}
        bot_cols = {"user_id", "payment_type", "yookassa_id", "admin_id",
                     "confirmation_url", "payment_date", "updated_at"}
        web_cols = {"student_id", "course_id", "currency", "method",
                     "period_month", "period_year", "bot_payment_id"}
        for c in bot_cols: self.assertIn(c, cols)
        for c in web_cols: self.assertIn(c, cols)

    def test_courses_name_and_synonym(self):
        from core.models import Course
        self.assertTrue(hasattr(Course, "name"))
        self.assertTrue(hasattr(Course, "title"))
        # synonym resolves to same column in queries
        from sqlalchemy import inspect
        col = inspect(Course).c
        self.assertIn("name", col)

    def test_two_achievement_tables(self):
        self.assertIn("achievements", self.metadata.tables)
        self.assertIn("student_achievements", self.metadata.tables)
        self.assertIn("user_achievements", self.metadata.tables)


if __name__ == "__main__":
    unittest.main()
