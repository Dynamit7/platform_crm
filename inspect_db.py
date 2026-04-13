import sqlite3

DB = "education_center_v2.db"
conn = sqlite3.connect(DB)
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [row[0] for row in cursor.fetchall()]
print("TABLES:", tables)
for t in tables:
    cursor.execute(f"PRAGMA table_info({t})")
    cols = [(row[1], row[2]) for row in cursor.fetchall()]
    print(f"\n{t}:")
    for c in cols:
        print(f"  {c[0]} ({c[1]})")
conn.close()
