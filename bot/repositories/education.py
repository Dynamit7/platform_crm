from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from bot.models.education import Course, Group, Registration
from bot.repositories.base import BaseRepository

class CourseRepository(BaseRepository[Course]):
    def __init__(self, session):
        super().__init__(Course, session)

    async def get_by_name(self, name: str) -> Optional[Course]:
        stmt = select(Course).where(Course.name == name)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

class GroupRepository(BaseRepository[Group]):
    def __init__(self, session):
        super().__init__(Group, session)

    async def get_by_name(self, name: str) -> Optional[Group]:
        stmt = select(Group).where(Group.name == name).options(selectinload(Group.course))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_groups_by_course(self, course_id: int) -> List[Group]:
        stmt = select(Group).where(Group.course_id == course_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

class RegistrationRepository(BaseRepository[Registration]):
    def __init__(self, session):
        super().__init__(Registration, session)

    async def get_user_registrations(self, user_id: int) -> List[Registration]:
        stmt = select(Registration).where(Registration.user_id == user_id).options(selectinload(Registration.course))
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_pending_registrations(self) -> List[Registration]:
        """Fetch all registrations with 'active' status and related user/course data."""
        stmt = (
            select(Registration)
            .where(Registration.status_code == "active")
            .options(
                selectinload(Registration.user),
                selectinload(Registration.course)
            )
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id_full(self, reg_id: int) -> Optional[Registration]:
        """Fetch a specific registration by ID with full relations."""
        stmt = (
            select(Registration)
            .where(Registration.id == reg_id)
            .options(
                selectinload(Registration.user),
                selectinload(Registration.course)
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
