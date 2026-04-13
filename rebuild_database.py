import os
import sqlite3
from datetime import datetime
import sys

# Set encoding for Windows compatibility
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# DB file names
DB_NAME = "education_center_v2.db"
SQL_FILE = "optimized_schema.sql"

print("=" * 60)
print("DATABASE REBUILD SCRIPT")
print("=" * 60)
print()

# STEP 1: Backup/Remove old files
print("Step 1: Cleaning up old database files...")

# List of potential DB locations (root and bot folder)
db_paths = [DB_NAME, os.path.join("bot", DB_NAME)]

for path in db_paths:
    if os.path.exists(path):
        backup_name = f"{path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        try:
            os.rename(path, backup_name)
            print(f"   [OK] {path} moved to {backup_name}")
        except Exception as e:
            try:
                os.remove(path)
                print(f"   [OK] {path} deleted")
            except:
                print(f"   [ERR] Could not remove {path}: {e}")

if os.path.exists(SQL_FILE):
    try:
        os.remove(SQL_FILE)
        print(f"   [OK] {SQL_FILE} removed")
    except Exception as e:
        print(f"   [ERR] Could not remove {SQL_FILE}: {e}")

print()

# STEP 2: Define and Write Schema
print("Step 2: Generating schema...")

SCHEMA_SQL = """
PRAGMA foreign_keys = ON;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE NOT NULL,
    username VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    role VARCHAR(20) DEFAULT 'PENDING',
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    permissions TEXT DEFAULT 'all',
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    specialization VARCHAR(255),
    bio TEXT,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    student_code VARCHAR(50) UNIQUE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    frozen_until DATE,
    freeze_reason VARCHAR(255),
    last_debt_reminder DATE,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    duration_months INTEGER,
    lessons_count INTEGER,
    price_group INTEGER,
    price_individual INTEGER,
    is_active BOOLEAN DEFAULT 1
);

-- Schedules
CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,
    time_start VARCHAR(50) NOT NULL,
    time_end VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT 1
);

-- Training types
CREATE TABLE IF NOT EXISTS training_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups
CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,
    course_id INTEGER NOT NULL,
    teacher_id INTEGER,
    schedule_id INTEGER,
    days_bitmask INTEGER DEFAULT 0,
    max_students INTEGER DEFAULT 10,
    current_students INTEGER DEFAULT 0,
    start_date DATE,
    is_active BOOLEAN DEFAULT 1,
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY(teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
    FOREIGN KEY(schedule_id) REFERENCES schedules(id) ON DELETE SET NULL
);

-- Student-Group links
CREATE TABLE IF NOT EXISTS student_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE,
    UNIQUE(student_id, group_id)
);

-- Lessons
CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    lesson_date DATE NOT NULL,
    teacher_id INTEGER,
    topic VARCHAR(255) DEFAULT 'Занятие по расписанию',
    lesson_time VARCHAR(50),
    is_completed BOOLEAN DEFAULT 0,
    FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY(teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'present',
    notes VARCHAR(255),
    FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE(lesson_id, student_id)
);

-- Payments (Finance)
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_type VARCHAR(50) DEFAULT 'monthly_fee',
    registration_id INTEGER,
    purpose VARCHAR(255),
    student_id INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    yookassa_id VARCHAR(100) UNIQUE,
    admin_id INTEGER,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES students(id),
    FOREIGN KEY(admin_id) REFERENCES users(id)
);

-- Global Settings
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    description VARCHAR(255)
);

-- Materials
CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uploader_id INTEGER NOT NULL,
    file_id VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    group_id INTEGER,
    lesson_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(uploader_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY(group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- Student Statuses Catalog (Optional but used in seed)
CREATE TABLE IF NOT EXISTS student_statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255)
);

-- Student Progress
CREATE TABLE IF NOT EXISTS student_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER,
    lesson_id INTEGER,
    grade INTEGER,
    comment VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
);

-- Homework Submissions
CREATE TABLE IF NOT EXISTS homework_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    file_id VARCHAR(255),
    text VARCHAR(2000),
    status VARCHAR(50) DEFAULT 'pending',
    grade INTEGER,
    teacher_comment VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- Registrations
CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    training_type_id INTEGER,
    status_code VARCHAR(50) DEFAULT 'pending',
    trial_lesson_time TIMESTAMP,
    notes VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY(training_type_id) REFERENCES training_types(id) ON DELETE SET NULL
);

-- Feedback
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    student_id INTEGER,
    lesson_id INTEGER,
    course_id INTEGER,
    comment VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_date ON lessons(lesson_date);

"""

with open(SQL_FILE, "w", encoding="utf-8") as f:
    f.write(SCHEMA_SQL)
print(f"   [OK] {SQL_FILE} written")

# STEP 3: Create Database
print("Step 3: Building database instance...")

conn = sqlite3.connect(DB_NAME)
cursor = conn.cursor()
cursor.executescript(SCHEMA_SQL)
print("   [OK] Tables created")

# STEP 4: Initial Data
print("Step 4: Inserting initial data...")

# Initial Admin (using provided ID)
ADMIN_TG_ID = 866916345
cursor.execute("INSERT INTO users (telegram_id, full_name, role) VALUES (?, 'System Admin', 'ADMIN')", (ADMIN_TG_ID,))
user_id = cursor.lastrowid
cursor.execute("INSERT INTO admins (user_id, permissions) VALUES (?, 'all')", (user_id,))
print(f"   [OK] Admin user created (TG ID: {ADMIN_TG_ID})")

# Sample Data for Directories
statuses = [
    ('active', 'Активен', 'Текущие активные ученики'),
    ('frozen', 'Заморожен', 'Временно приостановили обучение'),
    ('graduated', 'Выпускник', 'Завершили обучение'),
    ('left', 'Ушел', 'Прекратили обучение')
]
cursor.executemany("INSERT INTO student_statuses (code, name, description) VALUES (?, ?, ?)", statuses)

training_types = [
    ('Групповое', 'Занятия в группах от 3 до 10 человек'), 
    ('Индивидуальное', 'Занятия один на один с преподавателем')
]
cursor.executemany("INSERT INTO training_types (name, description) VALUES (?, ?)", training_types)

courses = [
    ('English Beginner (A1)', 'Базовый курс английского языка', 3, 24, 500000, 1200000),
    ('Russian for Foreigners', 'Курс русского языка', 6, 48, 600000, 1500000)
]
cursor.executemany("INSERT INTO courses (name, description, duration_months, lessons_count, price_group, price_individual) VALUES (?, ?, ?, ?, ?, ?)", courses)

settings = [
    ('bot_name', 'SmartEdu Bot', 'Название бота в интерфейсе'),
    ('contact_phone', '+998 90 123 45 67', 'Контактный телефон центра'),
    ('is_registration_open', '1', 'Разрешена ли свободная регистрация')
]
cursor.executemany("INSERT INTO settings (key, value, description) VALUES (?, ?, ?)", settings)

conn.commit()
conn.close()

print()
print("=" * 60)
print("SUCCESS: Database education_center_v2.db is ready.")
print("=" * 60)