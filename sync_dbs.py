"""
sync_dbs.py - Bidirectional sync between Bot DB and Web CRM DB.

Usage:
    python sync_dbs.py              # bot -> web (default)
    python sync_dbs.py --reverse    # web -> bot
    python sync_dbs.py --both       # both directions
    python sync_dbs.py --status     # show DB stats
"""

import sqlite3
import sys
import os
from datetime import datetime

# Fix Windows console encoding
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BOT_DB  = os.path.join(os.path.dirname(__file__), 'education_center_v2.db')
WEB_DB  = os.path.join(os.path.dirname(__file__), 'web', 'education_center_web.db')


def get_connection(path: str) -> sqlite3.Connection:
    if not os.path.exists(path):
        print(f"  Warning: DB not found: {path}")
        return None
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_columns(conn: sqlite3.Connection, table: str, columns: dict):
    """Adds missing columns to a table."""
    cur = conn.cursor()
    cur.execute(f"PRAGMA table_info({table})")
    existing = {row['name'] for row in cur.fetchall()}
    for col, definition in columns.items():
        if col not in existing:
            try:
                cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {definition}")
            except Exception as e:
                print(f"  ! Error adding column {col}: {e}")
    conn.commit()


def sync_bot_to_web():
    """Full sync from bot DB to web DB: users, courses, groups, lessons, enrollments, payments, reviews."""
    print("\nSyncing BOT -> WEB...")
    bot = get_connection(BOT_DB)
    web = get_connection(WEB_DB)
    if not bot or not web:
        print("  One of the DBs is unavailable")
        return

    ensure_columns(web, 'users', {
        'registration_source': "VARCHAR DEFAULT 'web'",
        'telegram_id': 'BIGINT',
    })
    ensure_columns(web, 'groups', {'bot_group_id': 'INTEGER'})
    ensure_columns(web, 'lessons', {'bot_lesson_id': 'INTEGER'})
    ensure_columns(web, 'payments', {'bot_payment_id': 'INTEGER'})
    ensure_columns(web, 'reviews', {'bot_feedback_id': 'INTEGER'})

    bot_cur = bot.cursor()
    web_cur = web.cursor()

    # ── 1. Users ──
    bot_cur.execute("SELECT telegram_id, full_name, phone, role, created_at FROM users")
    bot_users = bot_cur.fetchall()
    added = updated = 0

    for u in bot_users:
        tg_id, name, phone, role, created_at = u['telegram_id'], u['full_name'], u['phone'], u['role'], u['created_at']
        web_cur.execute("SELECT id FROM users WHERE telegram_id = ?", (tg_id,))
        by_tg = web_cur.fetchone()
        by_phone = None
        if phone:
            web_cur.execute("SELECT id FROM users WHERE phone = ? AND telegram_id IS NULL", (phone,))
            by_phone = web_cur.fetchone()

        if by_tg:
            web_cur.execute("UPDATE users SET name=? WHERE telegram_id=?", (name, tg_id))
            updated += 1
        elif by_phone:
            web_cur.execute("UPDATE users SET telegram_id=?, registration_source='telegram' WHERE id=?", (tg_id, by_phone['id']))
            updated += 1
        else:
            web_role = 'student' if role == 'student' else ('teacher' if role == 'teacher' else 'pending')
            web_cur.execute("""
                INSERT INTO users (name, telegram_id, phone, email, role, password_hash, registration_source, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, '', 'telegram', 1, ?)
            """, (name, tg_id, phone, f"tg_{tg_id}@bot.local", web_role, created_at))
            added += 1

    web.commit()
    print(f"  Users: added {added}, updated {updated}")

    # ── 2. Courses ──
    try:
        bot_cur.execute("SELECT id, name, description FROM courses")
        c_added = 0
        for c in bot_cur.fetchall():
            web_cur.execute("SELECT id FROM courses WHERE title = ?", (c['name'],))
            if not web_cur.fetchone():
                web_cur.execute(
                    "INSERT INTO courses (title, description, duration, price, is_active) VALUES (?, ?, '3 months', 0, 1)",
                    (c['name'], c['description'] or '')
                )
                c_added += 1
        web.commit()
        print(f"  Courses: added {c_added}")
    except Exception as e:
        print(f"  Courses skipped: {e}")

    # ── 3. Groups ──
    try:
        bot_cur.execute("""
            SELECT g.id as bot_gid, g.name, g.max_students, g.is_active,
                   c.name as course_name, u.telegram_id as teacher_tg
            FROM groups g
            LEFT JOIN courses c ON g.course_id = c.id
            LEFT JOIN teachers t ON g.teacher_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
        """)
        web_cur.execute("SELECT bot_group_id FROM groups WHERE bot_group_id IS NOT NULL")
        existing_gids = {r[0] for r in web_cur.fetchall()}
        g_added = 0

        for g in bot_cur.fetchall():
            if g['bot_gid'] in existing_gids:
                continue
            web_cur.execute("SELECT id FROM courses WHERE title = ?", (g['course_name'] or '',))
            web_course = web_cur.fetchone()
            course_id = web_course['id'] if web_course else None

            teacher_id = None
            if g['teacher_tg']:
                web_cur.execute("SELECT id FROM users WHERE telegram_id = ?", (g['teacher_tg'],))
                wu = web_cur.fetchone()
                if wu:
                    web_cur.execute("SELECT id FROM teachers WHERE user_id = ?", (wu['id'],))
                    tr = web_cur.fetchone()
                    teacher_id = tr['id'] if tr else None

            web_cur.execute("""
                INSERT INTO groups (name, course_id, teacher_id, max_students, is_active, bot_group_id)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (g['name'], course_id, teacher_id, g['max_students'] or 8, g['is_active'], g['bot_gid']))
            g_added += 1

        web.commit()
        print(f"  Groups: added {g_added}")
    except Exception as e:
        print(f"  Groups skipped: {e}")

    # ── 4. Lessons ──
    try:
        bot_cur.execute("SELECT id, group_id, lesson_date, lesson_time, topic, is_completed FROM lessons")
        web_cur.execute("SELECT bot_lesson_id FROM lessons WHERE bot_lesson_id IS NOT NULL")
        existing_lids = {r[0] for r in web_cur.fetchall()}
        l_added = 0

        for l in bot_cur.fetchall():
            if l['id'] in existing_lids:
                continue
            web_cur.execute("SELECT id FROM groups WHERE bot_group_id = ?", (l['group_id'],))
            wg = web_cur.fetchone()
            if not wg:
                continue
            dt_str = f"{l['lesson_date']} {l['lesson_time'] or '09:00'}:00"
            web_cur.execute("""
                INSERT INTO lessons (group_id, topic, scheduled_at, is_completed, bot_lesson_id)
                VALUES (?, ?, ?, ?, ?)
            """, (wg['id'], l['topic'] or 'Lesson', dt_str, l['is_completed'], l['id']))
            l_added += 1

        web.commit()
        print(f"  Lessons: added {l_added}")
    except Exception as e:
        print(f"  Lessons skipped: {e}")

    # ── 5. Student Enrollments ──
    try:
        bot_cur.execute("""
            SELECT sg.group_id as bot_group_id, u.telegram_id
            FROM student_groups sg
            JOIN students s ON sg.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE sg.status = 'active'
        """)
        e_added = 0

        for e in bot_cur.fetchall():
            web_cur.execute("SELECT id FROM users WHERE telegram_id = ?", (e['telegram_id'],))
            wu = web_cur.fetchone()
            if not wu:
                continue
            web_cur.execute("SELECT id, course_id FROM groups WHERE bot_group_id = ?", (e['bot_group_id'],))
            wg = web_cur.fetchone()
            if not wg:
                continue
            web_cur.execute("SELECT id FROM enrollments WHERE student_id = ? AND group_id = ?",
                            (wu['id'], wg['id']))
            if web_cur.fetchone():
                continue
            web_cur.execute("""
                INSERT INTO enrollments (student_id, course_id, group_id, progress, xp)
                VALUES (?, ?, ?, 0, 0)
            """, (wu['id'], wg['course_id'], wg['id']))
            e_added += 1

        web.commit()
        print(f"  Enrollments: added {e_added}")
    except Exception as e:
        print(f"  Enrollments skipped: {e}")

    # ── 6. Payments ──
    try:
        bot_cur.execute("""
            SELECT p.id as pid, u.telegram_id, p.amount, p.payment_method,
                   p.payment_date, p.purpose
            FROM payments p JOIN users u ON p.user_id = u.id
        """)
        web_cur.execute("SELECT bot_payment_id FROM payments WHERE bot_payment_id IS NOT NULL")
        existing_pids = {r[0] for r in web_cur.fetchall()}
        pay_added = 0

        for p in bot_cur.fetchall():
            if p['pid'] in existing_pids:
                continue
            web_cur.execute("SELECT id FROM users WHERE telegram_id = ?", (p['telegram_id'],))
            wu = web_cur.fetchone()
            if not wu:
                continue
            web_cur.execute("""
                INSERT INTO payments (student_id, amount, method, currency, status, description, created_at, bot_payment_id)
                VALUES (?, ?, ?, 'UZS', 'paid', ?, ?, ?)
            """, (wu['id'], p['amount'], p['payment_method'] or 'cash', p['purpose'], p['payment_date'], p['pid']))
            pay_added += 1

        web.commit()
        print(f"  Payments: added {pay_added}")
    except Exception as e:
        print(f"  Payments skipped: {e}")

    # ── 7. Reviews / Feedback ──
    try:
        bot_cur.execute("""
            SELECT f.id as fid, u.full_name as student_name, f.rating, f.comment as text
            FROM feedback f JOIN users u ON f.user_id = u.id
        """)
        web_cur.execute("SELECT bot_feedback_id FROM reviews WHERE bot_feedback_id IS NOT NULL")
        existing_fids = {r[0] for r in web_cur.fetchall()}
        f_added = 0

        for fb in bot_cur.fetchall():
            if fb['fid'] in existing_fids:
                continue
            web_cur.execute(
                "INSERT INTO reviews (student_name, text, rating, bot_feedback_id) VALUES (?, ?, ?, ?)",
                (fb['student_name'], fb['text'], fb['rating'], fb['fid'])
            )
            f_added += 1

        web.commit()
        print(f"  Reviews: added {f_added}")
    except Exception as e:
        print(f"  Reviews skipped: {e}")

    bot.close()
    web.close()
    print("  Sync BOT -> WEB complete")


def sync_web_to_bot():
    """Sync new web users back to bot DB."""
    print("\nSyncing WEB -> BOT...")
    bot = get_connection(BOT_DB)
    web = get_connection(WEB_DB)
    if not bot or not web:
        print("  One of the DBs is unavailable")
        return

    web_cur = web.cursor()
    bot_cur = bot.cursor()

    web_cur.execute("""
        SELECT name, telegram_id, phone, role FROM users
        WHERE telegram_id IS NOT NULL AND role IN ('student','teacher','admin')
    """)
    web_users = web_cur.fetchall()
    added = 0

    for u in web_users:
        tg_id = u['telegram_id']
        bot_cur.execute("SELECT id FROM users WHERE telegram_id = ?", (tg_id,))
        if bot_cur.fetchone():
            continue
        bot_role = u['role'] if u['role'] in ('student', 'teacher', 'admin') else 'student'
        try:
            bot_cur.execute("""
                INSERT INTO users (telegram_id, full_name, phone, role, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (tg_id, u['name'], u['phone'], bot_role, datetime.now().isoformat()))
            added += 1
        except Exception as e:
            print(f"  ! Error adding {u['name']}: {e}")

    bot.commit()
    print(f"  Added to bot DB: {added} users")
    bot.close()
    web.close()
    print("  Sync WEB -> BOT complete")


def show_status():
    """Show stats for both DBs."""
    print("\nDB Status")
    print("=" * 50)

    for label, path in [("BOT", BOT_DB), ("WEB", WEB_DB)]:
        print(f"\n{label}: {os.path.basename(path)}")
        if not os.path.exists(path):
            print("  File not found")
            continue
        conn = get_connection(path)
        cur = conn.cursor()

        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [r[0] for r in cur.fetchall()]
        for t in sorted(tables):
            try:
                cur.execute(f"SELECT COUNT(*) FROM {t}")
                count = cur.fetchone()[0]
                print(f"  {t}: {count}")
            except:
                pass

        if label == "WEB":
            try:
                cur.execute("SELECT role, COUNT(*) as c FROM users GROUP BY role")
                for row in cur.fetchall():
                    print(f"    -> {row[0]}: {row[1]}")
            except:
                pass

        conn.close()
    print("\n" + "=" * 50)


if __name__ == '__main__':
    args = sys.argv[1:]

    if '--status' in args:
        show_status()
    elif '--reverse' in args:
        sync_web_to_bot()
    elif '--both' in args:
        sync_bot_to_web()
        sync_web_to_bot()
        show_status()
    else:
        sync_bot_to_web()
        show_status()
