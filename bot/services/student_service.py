from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from bot.models.user import Student

class StudentService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def freeze_student(self, student_id: int, days: int, reason: str = "По просьбе ученика"):
        """Заморозка обучения на N дней."""
        frozen_until = date.today() + timedelta(days=days)
        stmt = (
            update(Student)
            .where(Student.id == student_id)
            .values(frozen_until=frozen_until, freeze_reason=reason)
        )
        await self.session.execute(stmt)
        await self.session.commit()
        return frozen_until

    async def unfreeze_student(self, student_id: int):
        """Ручная разморозка."""
        stmt = (
            update(Student)
            .where(Student.id == student_id)
            .values(frozen_until=None, freeze_reason=None)
        )
        await self.session.execute(stmt)
        await self.session.commit()

    async def is_student_frozen(self, student_id: int) -> bool:
        """Проверка, заморожен ли ученик на данный момент."""
        stmt = select(Student).where(Student.id == student_id)
        result = await self.session.execute(stmt)
        student = result.scalar_one_or_none()
        
        if not student or not student.frozen_until:
            return False
            
        if student.frozen_until < date.today():
            # Срок заморозки истёк — автоматически размораживаем
            await self.unfreeze_student(student_id)
            return False
            
        return True
