from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from bot.models.user import Teacher, User, UserRole
from typing import List

class TeacherService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all_teachers(self, only_active: bool = True) -> List[Teacher]:
        from sqlalchemy.orm import selectinload
        stmt = select(Teacher).options(selectinload(Teacher.user))
        if only_active:
            stmt = stmt.where(Teacher.is_active == True)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create_teacher(self, name: str, phone: str, email: str = None, specialization: str = None) -> Teacher:
        user = User(full_name=name, phone=phone, email=email, role=UserRole.TEACHER)
        self.session.add(user)
        await self.session.flush()
        teacher = Teacher(user_id=user.id, specialization=specialization, is_active=True)
        self.session.add(teacher)
        await self.session.commit()
        await self.session.refresh(teacher)
        return teacher

    async def update_teacher(self, teacher_id: int, **kwargs):
        stmt = update(Teacher).where(Teacher.id == teacher_id).values(**kwargs)
        await self.session.execute(stmt)
        await self.session.commit()

    async def delete_teacher(self, teacher_id: int):
        """Мягкое удаление."""
        await self.update_teacher(teacher_id, is_active=False)

    async def assign_user_to_teacher(self, teacher_id: int, user_id: int):
        """Привязка Telegram-аккаунта к записи учителя."""
        teacher_stmt = select(Teacher).where(Teacher.id == teacher_id)
        teacher = (await self.session.execute(teacher_stmt)).scalar_one()
        
        user_stmt = select(User).where(User.id == user_id)
        user = (await self.session.execute(user_stmt)).scalar_one()
        
        teacher.user_id = user.id
        user.role = UserRole.TEACHER
        await self.session.commit()
