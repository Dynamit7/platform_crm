from typing import Optional, List
from sqlalchemy import select, and_
from datetime import date
from bot.models.user import Teacher, User, Student
from bot.models.education import Group, Lesson, StudentGroup
from bot.repositories.base import BaseRepository


class TeacherRepository(BaseRepository[Teacher]):
    def __init__(self, session):
        super().__init__(Teacher, session)

    async def get_by_user_id(self, user_id: int) -> Optional[Teacher]:
        stmt = select(Teacher).where(Teacher.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_groups(self, teacher_id: int) -> List[Group]:
        stmt = select(Group).where(Group.teacher_id == teacher_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_lessons_for_date(self, teacher_id: int, target_date: date) -> List[Lesson]:
        stmt = select(Lesson).where(
            and_(
                Lesson.teacher_id == teacher_id,
                Lesson.lesson_date == target_date
            )
        ).order_by(Lesson.lesson_time)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_students_in_group(self, group_id: int) -> List[Student]:
        stmt = (
            select(Student)
            .join(StudentGroup)
            .where(StudentGroup.group_id == group_id)
            .join(User)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_lesson_by_id(self, lesson_id: int) -> Optional[Lesson]:
        stmt = select(Lesson).where(Lesson.id == lesson_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
