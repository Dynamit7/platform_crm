from typing import Optional, List
from sqlalchemy import select, or_
from bot.models.user import User, Admin
from bot.repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self, session):
        super().__init__(User, session)

    async def get_by_telegram_id(self, telegram_id: int) -> Optional[User]:
        from sqlalchemy.orm import selectinload
        stmt = (
            select(User)
            .where(User.telegram_id == telegram_id)
            .options(
                selectinload(User.student),
                selectinload(User.teacher),
                selectinload(User.admin)
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_username(self, username: str) -> Optional[User]:
        stmt = select(User).where(User.username == username)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def search_users(self, query: str, limit: int = 20) -> List[User]:
        pattern = f"%{query}%"
        stmt = select(User).where(
            or_(
                User.full_name.ilike(pattern),
                User.username.ilike(pattern),
                User.phone.ilike(pattern)
            )
        ).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_admins(self) -> List[User]:
        """Fetch all users that have an admin record."""
        stmt = select(User).join(Admin).order_by(User.created_at)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
