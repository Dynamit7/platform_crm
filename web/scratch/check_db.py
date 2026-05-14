
import sqlite3

conn = sqlite3.connect('education_center_web.db')
cursor = conn.cursor()

tables = ['courses', 'teachers', 'reviews', 'leads', 'users', 'enrollments', 'homeworks', 'homework_submissions', 'notifications']

for table in tables:
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"Table {table}: {count} rows")
    except Exception as e:
        print(f"Error checking table {table}: {e}")

conn.close()
