from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from bot.models.user import Student
from bot.models.education import StudentGroup, Group, Lesson, StudentProgress
from bot.repositories.base import BaseRepository

if TYPE_CHECKING:
    from bot.models.education import Group, StudentGroup, Lesson, StudentProgress

class StudentRepository(BaseRepository[Student]):
    def __init__(self, session):
        super().__init__(Student, session)

    async def get_by_user_id(self, user_id: int) -> Optional[Student]:
        """
        Fetch student by user ID with related user data.
        """
        stmt = select(Student).where(Student.user_id == user_id).options(selectinload(Student.user))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_student_code(self, student_code: str) -> Optional[Student]:
        """
        Fetch student by unique code.
        """
        stmt = select(Student).where(Student.student_code == student_code).options(selectinload(Student.user))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_student_groups(self, student_id: int) -> List[StudentGroup]:
        """
        Fetch all groups a student is enrolled in, with course details.
        """
        stmt = (
            select(StudentGroup)
            .where(StudentGroup.student_id == student_id)
            .options(
                selectinload(StudentGroup.group).selectinload(Group.course)
            )
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_upcoming_lessons(self, student_id: int, limit: int = 5) -> List[Lesson]:
        """
        Fetch N upcoming lessons for the student.
        """
        from sqlalchemy import and_
        from datetime import date
        
        stmt = (
            select(Lesson)
            .join(Group)
            .join(StudentGroup)
            .where(
                and_(
                    StudentGroup.student_id == student_id,
                    Lesson.lesson_date >= date.today()
                )
            )
            .order_by(Lesson.lesson_date, Lesson.lesson_time)
            .limit(limit)
            .options(selectinload(Lesson.group).selectinload(Group.course))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_progress(self, student_id: int) -> List[StudentProgress]:
        """
        Get student course progress data.
        """
        stmt = (
            select(StudentProgress)
            .where(StudentProgress.student_id == student_id)
            .options(selectinload(StudentProgress.course))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
