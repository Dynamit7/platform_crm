-- Скрипт оптимизации базы данных SmartEdu Bot
-- Добавление индексов для ускорения поиска и отчетов

-- USERS
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- STUDENTS
CREATE INDEX IF NOT EXISTS idx_students_is_active ON students(is_active);
CREATE INDEX IF NOT EXISTS idx_students_code ON students(student_code);

-- LESSONS
CREATE INDEX IF NOT EXISTS idx_lessons_group_id ON lessons(group_id);
CREATE INDEX IF NOT EXISTS idx_lessons_date ON lessons(lesson_date);
CREATE INDEX IF NOT EXISTS idx_lessons_completed ON lessons(is_completed);

-- ATTENDANCE
CREATE INDEX IF NOT EXISTS idx_att_lesson_id ON attendance(lesson_id);
CREATE INDEX IF NOT EXISTS idx_att_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_att_status ON attendance(status);

-- PAYMENTS
CREATE INDEX IF NOT EXISTS idx_pay_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_pay_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_pay_date ON payments(created_at);

-- REGISTRATIONS
CREATE INDEX IF NOT EXISTS idx_reg_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_reg_status ON registrations(status_code);

-- FEEDBACK
CREATE INDEX IF NOT EXISTS idx_feed_student_id ON feedback(student_id);
CREATE INDEX IF NOT EXISTS idx_feed_lesson_id ON feedback(lesson_id);

PRAGMA optimize;
