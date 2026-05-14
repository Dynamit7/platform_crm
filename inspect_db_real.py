import sqlite3
import os

db_path = "education_center_v2.db"
if not os.path.exists(db_path):
    print(f"File {db_path} not found")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check table names
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables in DB:", [t[0] for t in tables])

# Check schema of users table
cursor.execute("PRAGMA table_info(users);")
columns = cursor.fetchall()
print("\nSchema of 'users' table:")
for col in columns:
    print(col)

# Check first few rows of users table
cursor.execute("SELECT * FROM users LIMIT 5;")
rows = cursor.fetchall()
print("\nRows in 'users' table:")
for row in rows:
    print(row)

conn.close()
