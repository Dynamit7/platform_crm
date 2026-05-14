"""Quick migration: add missing columns to leads table."""
import sqlite3

conn = sqlite3.connect('education_center_web.db')
cur = conn.cursor()

existing = [r[1] for r in cur.execute('PRAGMA table_info(leads)')]
print('Current columns:', existing)

if 'email' not in existing:
    cur.execute("ALTER TABLE leads ADD COLUMN email TEXT")
    print('Added: email')

if 'source' not in existing:
    cur.execute("ALTER TABLE leads ADD COLUMN source TEXT DEFAULT 'manual'")
    print('Added: source')

conn.commit()
conn.close()
print('Done! Columns now:', [r[1] for r in sqlite3.connect('education_center_web.db').execute('PRAGMA table_info(leads)')])
