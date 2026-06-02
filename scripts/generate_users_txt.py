"""
Generate users.txt with plaintext passwords.

Strategy:
  1) Try a dictionary of common passwords against each bcrypt hash.
  2) For unmatched users, reset the password to DEFAULT_RESET and write it.
  3) Output a human-readable users.txt with name, email, role, password.

Run:
    .venv\\Scripts\\python.exe scripts\\generate_users_txt.py
"""
from __future__ import annotations
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from sqlalchemy import create_engine, text
import bcrypt

PG_URL = "postgresql+psycopg2://postgres:root@localhost:5432/education_crm"
DEFAULT_RESET = "Test123!"
OUT_PATH = ROOT / "users.txt"

# Common-password dictionary for the brute-force pass.
DICTIONARY = [
    "admin", "admin123", "Admin123", "Admin123!",
    "password", "Password1", "Password123", "password123",
    "12345", "123456", "1234567", "12345678", "123456789",
    "qwerty", "qwerty123", "qwertyuiop",
    "test", "test123", "Test123", "Test123!", "test1234",
    "student", "student123", "Student123",
    "teacher", "teacher123", "Teacher123",
    "user", "user123", "User123",
    "demo", "demo123", "Demo123",
    "tiluser", "TilUser", "tiluser123", "TilUser123",
    "smartedu", "SmartEdu",
    "1q2w3e", "1q2w3e4r",
    "abc123", "abcdef",
    "iloveyou", "letmein",
    "welcome", "welcome123",
    "root", "toor",
    "changeme", "changeme123",
    "secret", "secret123",
]


def try_dictionary(password_hash: str) -> str | None:
    """Return matching plaintext password or None."""
    if not password_hash:
        return None
    try:
        h = password_hash.encode("utf-8")
    except Exception:
        return None
    for candidate in DICTIONARY:
        try:
            if bcrypt.checkpw(candidate.encode("utf-8"), h):
                return candidate
        except (ValueError, TypeError):
            return None
    return None


def make_hash(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def main():
    engine = create_engine(PG_URL, future=True)
    rows = []
    cracked = 0
    reset = 0
    no_hash = 0

    with engine.connect() as conn:
        users = conn.execute(text("""
            SELECT id, name, email, role, telegram_id, phone, password_hash, is_active
            FROM users
            ORDER BY id
        """)).mappings().all()

    print(f"\n  Found {len(users)} users in Postgres\n")

    new_default_hash = make_hash(DEFAULT_RESET)

    for u in users:
        password_hash = u["password_hash"]
        if not password_hash:
            plain = "(нет пароля — login невозможен)"
            no_hash += 1
            status = "BLANK"
        else:
            match = try_dictionary(password_hash)
            if match:
                plain = match
                cracked += 1
                status = "CRACKED"
            else:
                # Reset the user's password to default
                with engine.begin() as conn:
                    conn.execute(text("UPDATE users SET password_hash = :h WHERE id = :id"),
                                 {"h": new_default_hash, "id": u["id"]})
                plain = DEFAULT_RESET + " (сброшен)"
                reset += 1
                status = "RESET"

        rows.append({
            "id": u["id"],
            "name": u["name"] or "—",
            "email": u["email"] or "—",
            "role": u["role"] or "—",
            "telegram_id": u["telegram_id"] or "—",
            "phone": u["phone"] or "—",
            "is_active": "✓" if u["is_active"] else "✗",
            "password": plain,
            "status": status,
            "hash": password_hash or "—",
        })
        print(f"  [{status:<7}] #{u['id']:<3} {u['email'] or 'no-email':<35} {u['role']:<12} -> {plain}")

    # Write human-readable txt
    lines = []
    lines.append("═" * 120)
    lines.append("  TIL USER — Все пользователи (Postgres: education_crm)")
    lines.append("═" * 120)
    lines.append("")
    lines.append(f"  Всего пользователей  : {len(users)}")
    lines.append(f"  Подобрано из словаря : {cracked}")
    lines.append(f"  Сброшено на дефолт   : {reset}")
    lines.append(f"  Без пароля в БД       : {no_hash}")
    lines.append("")
    lines.append(f"  Дефолтный пароль (после сброса): {DEFAULT_RESET}")
    lines.append("")
    lines.append("  ВАЖНО:")
    lines.append("    - bcrypt-хэши математически нельзя расшифровать обратно.")
    lines.append("    - Пароли со статусом 'CRACKED' были подобраны словарём (значит они были простыми).")
    lines.append("    - Пароли со статусом 'RESET' были перезаписаны на дефолтный — войти можно по нему.")
    lines.append("    - SQLite-файл оставлен как backup (web/education_center.db.backup.before_pg.*).")
    lines.append("")
    lines.append("─" * 120)
    lines.append(f"  {'ID':<4} {'Email':<32} {'Имя':<22} {'Роль':<14} {'Пароль':<26} {'Статус':<8} TG")
    lines.append("─" * 120)
    for r in rows:
        lines.append(
            f"  {r['id']:<4} "
            f"{r['email'][:31]:<32} "
            f"{(r['name'] or '')[:21]:<22} "
            f"{r['role']:<14} "
            f"{r['password'][:25]:<26} "
            f"{r['status']:<8} "
            f"{r['telegram_id']}"
        )
    lines.append("─" * 120)
    lines.append("")
    lines.append("═" * 120)
    lines.append("  Детальная информация (с bcrypt-хэшами)")
    lines.append("═" * 120)
    for r in rows:
        lines.append("")
        lines.append(f"  #{r['id']} — {r['name']}")
        lines.append(f"    Email      : {r['email']}")
        lines.append(f"    Роль       : {r['role']}")
        lines.append(f"    Телефон    : {r['phone']}")
        lines.append(f"    Telegram ID: {r['telegram_id']}")
        lines.append(f"    Активен    : {r['is_active']}")
        lines.append(f"    Пароль     : {r['password']}")
        lines.append(f"    Статус     : {r['status']}")
        lines.append(f"    Hash (новый, если был reset):")
        lines.append(f"      {r['hash'] if r['status'] != 'RESET' else new_default_hash}")

    OUT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n  Файл создан: {OUT_PATH}")
    print(f"  Подобрано: {cracked}  Сброшено: {reset}  Без пароля: {no_hash}\n")


if __name__ == "__main__":
    main()
