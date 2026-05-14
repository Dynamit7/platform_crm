import sqlite3, sys, os

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

conn = sqlite3.connect('education_center_v2.db')
cur = conn.cursor()

for table in ['students', 'users', 'teachers', 'lessons']:
    cur.execute(f"PRAGMA table_info({table})")
    cols = cur.fetchall()
    print(f'\n=== {table} ===')
    for c in cols:
        print(f'  {c[1]} {c[2]}')

conn.close()
