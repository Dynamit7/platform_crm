import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'web'))
from auth import verify_password
import sqlite3

for db_path in ['education_center_web.db', 'education_center_v2.db']:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    try:
        cur.execute("SELECT email, password_hash FROM users WHERE role='admin'")
        row = cur.fetchone()
        if row:
            email, pw_hash = row
            print(f"\nDB: {db_path}")
            print(f"Email: {email}")
            for attempt in ['REDACTED_PASSWORD', 'admin123', 'admin', 'password123', '123456', 'adminadmin', 'Admin123', 'Admin123!']:
                if verify_password(attempt, pw_hash):
                    print(f'  ✅ PASSWORD: {attempt}')
                    break
            else:
                print('  ❌ Not in test list')
    except Exception as e:
        print(f"  Error: {e}")
    conn.close()
