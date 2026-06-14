"""
make_superadmin.py — назначает Telegram-пользователей супер-админами.

Читает DATABASE_URL из .env проекта (через bot.config), поэтому работает
и локально, и на сервере с любыми кредами БД.

Идемпотентен: можно запускать сколько угодно раз.
  - Если пользователь с таким telegram_id уже есть  -> ставим role=super_admin, is_active=True
  - Если пользователя нет                            -> создаём запись super_admin
  - Гарантируем строку в таблице admins (permissions="all")

Запуск (из корня проекта):
    # с дефолтными ID из задачи:
    python -m scripts.make_superadmin

    # со своими ID:
    python -m scripts.make_superadmin 866916345 512985813

На сервере (если venv):
    .venv/bin/python -m scripts.make_superadmin 866916345 512985813
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from sqlalchemy import select

from bot.database import async_session_factory
from core.models import Admin, User, UserRole

# ID по умолчанию (из задачи). Можно переопределить аргументами командной строки.
DEFAULT_IDS = [866916345, 512985813]


async def promote(telegram_id: int) -> str:
    async with async_session_factory() as s:
        user = await s.scalar(select(User).where(User.telegram_id == telegram_id))

        if user is None:
            user = User(
                telegram_id=telegram_id,
                name="Super Admin",
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                registration_source="bot",
            )
            s.add(user)
            await s.flush()
            action = "СОЗДАН"
        else:
            user.role = UserRole.SUPER_ADMIN
            user.is_active = True
            action = "ОБНОВЛЁН"

        # Строка в admins (для CRM/совместимости). Боту достаточно users.role,
        # но держим консистентно.
        admin = await s.scalar(select(Admin).where(Admin.user_id == user.id))
        if admin is None:
            s.add(Admin(user_id=user.id, permissions="all"))

        await s.commit()
        return f"  tg_id={telegram_id:<12} user_id={user.id:<5} role={user.role}  [{action}]"


async def main() -> None:
    args = sys.argv[1:]
    ids = [int(a) for a in args] if args else DEFAULT_IDS

    print("=" * 60)
    print(" Назначение супер-админов")
    print("=" * 60)
    for tid in ids:
        print(await promote(tid))
    print("=" * 60)
    print(" Готово. Перезапускать бот не обязательно — роль читается из БД")
    print(" при каждом сообщении.")


if __name__ == "__main__":
    asyncio.run(main())
