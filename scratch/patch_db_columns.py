import sqlite3
import os

DB_PATHS = [
    r"web\education_center_web.db",
    r"education_center_v2.db",
]

# All columns that the model expects in `leads`
MISSING_COLUMNS = {
    "leads": [
        ("email",      "VARCHAR"),
        ("source",     "VARCHAR DEFAULT 'manual'"),
        ("updated_at", "DATETIME"),
    ]
}

for db_path in DB_PATHS:
    if not os.path.exists(db_path):
        print(f"[SKIP] {db_path} — not found")
        continue

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    for table, columns in MISSING_COLUMNS.items():
        # get current columns
        cursor.execute(f"PRAGMA table_info({table})")
        existing = {row[1] for row in cursor.fetchall()}
        if not existing:
            print(f"[SKIP] Table '{table}' not found in {db_path}")
            continue

        for col_name, col_def in columns:
            if col_name not in existing:
                sql = f"ALTER TABLE {table} ADD COLUMN {col_name} {col_def}"
                cursor.execute(sql)
                print(f"[OK] {db_path}: Added '{col_name}' to '{table}'")
            else:
                print(f"[--] {db_path}: '{col_name}' already exists in '{table}'")

    conn.commit()
    conn.close()

print("\nDone! All missing columns patched.")
