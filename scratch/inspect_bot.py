import sqlite3

BOT_DB = 'education_center_v2.db'

conn = sqlite3.connect(BOT_DB)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

cur.execute("SELECT * FROM lessons LIMIT 3")
rows = cur.fetchall()
for r in rows:
    print("LESSON:", dict(r))

cur.execute("SELECT * FROM groups LIMIT 3")
rows = cur.fetchall()
for r in rows:
    print("GROUP:", dict(r))

cur.execute("SELECT * FROM student_groups LIMIT 5")
rows = cur.fetchall()
for r in rows:
    print("STUDENT_GROUP:", dict(r))

cur.execute("SELECT * FROM schedules")
rows = cur.fetchall()
for r in rows:
    print("SCHEDULE:", dict(r))

cur.execute("SELECT g.*, c.name as course_name, t.user_id as teacher_uid FROM groups g LEFT JOIN courses c ON g.course_id=c.id LEFT JOIN teachers t ON g.teacher_id=t.id LIMIT 3")
rows = cur.fetchall()
for r in rows:
    print("GROUP+:", dict(r))

conn.close()
