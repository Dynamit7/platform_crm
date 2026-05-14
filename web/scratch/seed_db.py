
import sqlite3
from datetime import datetime, timedelta

def seed_db():
    conn = sqlite3.connect('education_center_web.db')
    cursor = conn.cursor()

    # Clear existing data for these tables to avoid duplicates
    tables_to_clear = ['users', 'courses', 'enrollments', 'notifications']
    for table in tables_to_clear:
        cursor.execute(f"DELETE FROM {table}")

    # 1. Add User (Samat)
    cursor.execute("INSERT INTO users (name, email, role) VALUES (?, ?, ?)", 
                   ("Самат", "samat@example.com", "student"))
    user_id = cursor.lastrowid

    # 2. Add Courses
    cursor.execute("INSERT INTO courses (title, description, duration, price) VALUES (?, ?, ?, ?)",
                   ("Японский N4", "Курс подготовки к JLPT N4", "4 месяца", 50000))
    course_jp_id = cursor.lastrowid
    
    cursor.execute("INSERT INTO courses (title, description, duration, price) VALUES (?, ?, ?, ?)",
                   ("Английский (IELTS)", "Подготовка к экзамену IELTS", "3 месяца", 60000))
    course_en_id = cursor.lastrowid

    # 3. Add Enrollments
    cursor.execute("INSERT INTO enrollments (student_id, course_id, progress) VALUES (?, ?, ?)",
                   (user_id, course_jp_id, 58))
    cursor.execute("INSERT INTO enrollments (student_id, course_id, progress) VALUES (?, ?, ?)",
                   (user_id, course_en_id, 30))

    # 4. Add Notifications
    cursor.execute("INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, ?)",
                   (user_id, "ДЗ проверено", "Ваш тест по грамматике проверен.", 0))
    cursor.execute("INSERT INTO notifications (user_id, title, message, is_read) VALUES (?, ?, ?, ?)",
                   (user_id, "Новое занятие", "У вас занятие завтра в 19:00.", 0))

    conn.commit()
    conn.close()
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed_db()
