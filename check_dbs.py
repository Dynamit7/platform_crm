import sqlite3, os, sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

bot_db = 'education_center_v2.db'
web_db = os.path.join('web', 'education_center_web.db')

for path, label in [(bot_db, 'BOT'), (web_db, 'WEB')]:
    if not os.path.exists(path):
        print(f'--- {label}: NOT FOUND ({path}) ---')
        continue
    conn = sqlite3.connect(path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = [r[0] for r in cur.fetchall()]
    print(f'\n--- {label}: {path} ({os.path.getsize(path)//1024} KB) ---')
    for t in tables:
        cur.execute(f'SELECT COUNT(*) FROM "{t}"')
        print(f'  {t}: {cur.fetchone()[0]} rows')
    conn.close()

print('\nDone.')
