import sqlite3

def patch_db(db_path):
    print(f"Patching {db_path}...")
    try:
        conn = sqlite3.connect(db_path)
        conn.execute('ALTER TABLE leads ADD COLUMN email VARCHAR')
        conn.commit()
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

patch_db('education_center_v2.db')
patch_db('web/education_center_web.db')
