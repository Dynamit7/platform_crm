import sqlite3

def print_schema(db_path):
    print(f"--- Schema for {db_path} ---")
    try:
        conn = sqlite3.connect(db_path)
        tables = conn.execute("SELECT sql FROM sqlite_master WHERE type='table'").fetchall()
        for t in tables:
            if t[0]:
                print(t[0])
        conn.close()
    except Exception as e:
        print(f"Error reading {db_path}: {e}")
    print("\n")

print_schema("education_center_web.db")
print_schema(r"frontend\bot\education_center_v2.db")
