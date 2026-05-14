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
        print(f"  ⚠️  БД не найдена: {path}")
        return None
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_columns(conn: sqlite3.Connection, table: str, columns: dict):
    """Добавляет отсутствующие колонки в таблицу."""
    cur = conn.cursor()
    cur.execute(f"PRAGMA table_info({table})")
    existing = {row['name'] for row in cur.fetchall()}
    for col, definition in columns.items():
        if col not in existing:
            try:
                cur.execute(f"ALTER TABLE {table} ADD COLUMN {col} {definition}")
                print(f"  + Колонка '{col}' добавлена в {table}")
            except Exception as e:
                print(f"  ! Ошибка добавления колонки {col}: {e}")
    conn.commit()


def sync_bot_to_web():
    """Синхронизирует пользователей и платежи из бот-БД в веб-БД."""
    print("\n🔄 Синхронизация БОТ → ВЕБ...")
    bot = get_connection(BOT_DB)
    web = get_connection(WEB_DB)
    if not bot or not web:
        print("  ❌ Одна из БД недоступна")
        return

    # Убеждаемся что нужные колонки есть в web.users
    ensure_columns(web, 'users', {
        'registration_source': "VARCHAR DEFAULT 'web'",
        'telegram_id': 'BIGINT',
    })

    bot_cur = bot.cursor()
    web_cur = web.cursor()

    # ── Users ──
    bot_cur.execute("SELECT telegram_id, full_name, phone, role, created_at FROM users")
    bot_users = bot_cur.fetchall()
    added = updated = skipped = 0

    for u in bot_users:
        tg_id, name, phone, role, created_at = u['telegram_id'], u['full_name'], u['phone'], u['role'], u['created_at']

        # Ищем в вебе по telegram_id
        web_cur.execute("SELECT id, role FROM users WHERE telegram_id = ?", (tg_id,))
        by_tg = web_cur.fetchone()

        # Ищем по телефону
        by_phone = None
        if phone:
            web_cur.execute("SELECT id, role FROM users WHERE phone = ? AND telegram_id IS NULL", (phone,))
            by_phone = web_cur.fetchone()

        if by_tg:
            # Обновляем имя если изменилось
            web_cur.execute("UPDATE users SET name=? WHERE telegram_id=?", (name, tg_id))
            updated += 1
        elif by_phone:
            # Привязываем telegram_id к существующему аккаунту по телефону
            web_cur.execute("UPDATE users SET telegram_id=?, registration_source='telegram' WHERE id=?", (tg_id, by_phone['id']))
            updated += 1
        else:
            # Создаём нового пользователя
            web_role = 'student' if role == 'student' else ('teacher' if role == 'teacher' else 'pending')
            web_cur.execute("""
                INSERT INTO users (name, telegram_id, phone, email, role, password_hash, registration_source, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, '', 'telegram', 1, ?)
            """, (name, tg_id, phone, f"tg_{tg_id}@bot.local", web_role, created_at))
            added += 1

    web.commit()
    print(f"  👤 Пользователи: добавлено {added}, обновлено {updated}, пропущено {skipped}")

    # ── Payments from bot → web ──
    try:
        bot_cur.execute("SELECT * FROM payments LIMIT 1")
        bot_cur.execute("SELECT p.id as pid, u.telegram_id, p.amount, p.payment_method, p.payment_date, p.purpose FROM payments p JOIN users u ON p.user_id = u.id")
        bot_pays = bot_cur.fetchall()
        pay_added = 0

        ensure_columns(web, 'payments', {'bot_payment_id': 'INTEGER'})
        web_cur.execute("SELECT bot_payment_id FROM payments WHERE bot_payment_id IS NOT NULL")
        existing_ids = {r[0] for r in web_cur.fetchall()}

        for p in bot_pays:
            if p['pid'] in existing_ids:
                continue
            web_cur.execute("SELECT id FROM users WHERE telegram_id = ?", (p['telegram_id'],))
            web_user = web_cur.fetchone()
            if not web_user:
                continue
            web_cur.execute("""
                INSERT INTO payments (student_id, amount, method, currency, status, description, created_at, bot_payment_id)
                VALUES (?, ?, ?, 'UZS', 'paid', ?, ?, ?)
            """, (web_user['id'], p['amount'], p['payment_method'] or 'cash', p['purpose'], p['payment_date'], p['pid']))
            pay_added += 1

        web.commit()
        print(f"  💳 Платежи: добавлено {pay_added} из бота")
    except Exception as e:
        print(f"  ⚠️  Платежи из бота пропущены: {e}")

    bot.close()
    web.close()
    print("  ✅ Синхронизация БОТ → ВЕБ завершена")


def sync_web_to_bot():
    """Синхронизирует новых веб-пользователей обратно в бот-БД."""
    print("\n🔄 Синхронизация ВЕБ → БОТ...")
    bot = get_connection(BOT_DB)
    web = get_connection(WEB_DB)
    if not bot or not web:
        print("  ❌ Одна из БД недоступна")
        return

    web_cur = web.cursor()
    bot_cur = bot.cursor()

    # Только пользователи с telegram_id, которых нет в боте
    web_cur.execute("""
        SELECT name, telegram_id, phone, role, email FROM users
        WHERE telegram_id IS NOT NULL AND role IN ('student','teacher','admin')
    """)
    web_users = web_cur.fetchall()
    added = 0

    for u in web_users:
        tg_id = u['telegram_id']
        bot_cur.execute("SELECT id FROM users WHERE telegram_id = ?", (tg_id,))
        if bot_cur.fetchone():
            continue  # уже есть в боте
        # Маппинг роли
        bot_role = u['role'] if u['role'] in ('student', 'teacher', 'admin') else 'student'
        try:
            bot_cur.execute("""
                INSERT INTO users (telegram_id, full_name, phone, role, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (tg_id, u['name'], u['phone'], bot_role, datetime.now().isoformat()))
            added += 1
        except Exception as e:
            print(f"  ! Ошибка добавления {u['name']}: {e}")

    bot.commit()
    print(f"  👤 Добавлено в бот-БД: {added} пользователей")
    bot.close()
    web.close()
    print("  ✅ Синхронизация ВЕБ → БОТ завершена")


def show_status():
    """Показывает статистику обеих БД."""
    print("\n📊 Статус баз данных")
    print("=" * 50)

    for label, path in [("🤖 БОТ", BOT_DB), ("🌐 ВЕБ", WEB_DB)]:
        print(f"\n{label}: {os.path.basename(path)}")
        if not os.path.exists(path):
            print("  ❌ Файл не найден")
            continue
        conn = get_connection(path)
        cur = conn.cursor()

        tables = ['users', 'payments', 'leads']
        for t in tables:
            try:
                cur.execute(f"SELECT COUNT(*) FROM {t}")
                count = cur.fetchone()[0]
                print(f"  📋 {t}: {count} записей")
            except:
                pass

        # Дополнительная статистика для веб
        if label == "🌐 ВЕБ":
            try:
                cur.execute("SELECT registration_source, COUNT(*) FROM users GROUP BY registration_source")
                for row in cur.fetchall():
                    src = row[0] or 'unknown'
                    print(f"     └── {src}: {row[1]}")
            except:
                pass
            try:
                cur.execute("SELECT role, COUNT(*) FROM users GROUP BY role")
                for row in cur.fetchall():
                    print(f"  👤 {row[0]}: {row[1]}")
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
        # Default: bot -> web
        sync_bot_to_web()
        show_status()
