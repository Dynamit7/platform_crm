import sqlite3, sys
sys.stdout.reconfigure(encoding='utf-8')
conn = sqlite3.connect('web/education_center_web.db')
cur = conn.cursor()
cur.execute("SELECT id, name, email, role, password_hash FROM users WHERE email LIKE '%admin%' OR email LIKE '%anna%' OR email LIKE '%elena%' OR email LIKE '%samat%'")
for r in cur.fetchall():
    print(f'{r[0]}: {r[1]} | {r[2]} | role={r[3]} | hash={r[4][:20] if r[4] else "(empty)"}')
conn.close()
