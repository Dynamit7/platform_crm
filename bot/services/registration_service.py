import random
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from bot.models.user import User, Student, UserRole
from bot.models.education import Registration
from core.models import Lead, Course
from datetime import datetime

logger = logging.getLogger(__name__)

class RegistrationService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_new_application(self, telegram_id: int, full_name: str, phone: str, course_interest: str, trial_time: str) -> User:
        """Создает нового пользователя со статусом PENDING или обновляет существующего, и создает запись о регистрации."""
        stmt = select(User).where(User.telegram_id == telegram_id)
        user = (await self.session.execute(stmt)).scalar_one_or_none()
        
        if not user:
            user = User(
                telegram_id=telegram_id,
                full_name=full_name,
                phone=phone,
                role=UserRole.PENDING
            )
            self.session.add(user)
        else:
            user.full_name = full_name
            user.phone = phone
            if user.role != UserRole.STUDENT:
                user.role = UserRole.PENDING
                
        await self.session.flush() # Получаем ID

        # Попытка сматчить введённый юзером текст с реальным курсом по
        # подстроке (case-insensitive). Если ничего не нашли — course_id None,
        # а название останется в notes.
        course_id = None
        if course_interest:
            ci = course_interest.strip().lower()
            res = await self.session.execute(select(Course))
            for c in res.scalars():
                cname = (c.name or "").lower()
                if cname and (ci in cname or cname in ci):
                    course_id = c.id
                    break

        new_reg = Registration(
            user_id=user.id,
            course_id=course_id,
            trial_lesson_time=None,
            notes=f"Интересует курс: {course_interest} | Удобное время: {trial_time}"
        )
        self.session.add(new_reg)

        lead = Lead(
            name=full_name,
            phone=phone,
            source="telegram",
            course_id=course_id,
            notes=f"Из бота. Интересует курс: {course_interest} | Удобное время: {trial_time}"
        )
        self.session.add(lead)

        await self.session.commit()
        return user

    async def _generate_student_code(self) -> str:
        """Генерирует уникальный код ученика STUXXXXXX."""
        while True:
            code = f"STU{random.randint(100000, 999999)}"
            # Проверяем уникальность
            stmt = select(Student).where(Student.student_code == code)
            res = await self.session.execute(stmt)
            if not res.scalar_one_or_none():
                return code

    async def approve_application(self, user_id: int) -> Student:
        """
        Атомарная активация ученика:
        1. Смена роли на STUDENT
        2. Создание записи в таблице students
        3. Генерация кода
        """
        # 1. Получаем пользователя
        stmt = select(User).where(User.id == user_id)
        user = (await self.session.execute(stmt)).scalar_one_or_none()
        
        if not user:
            raise ValueError(f"User with ID {user_id} not found")

        # 2. Меняем роль
        user.role = UserRole.STUDENT
        user.is_active = True

        # 3. Проверяем, нет ли уже записи в students
        stmt_stu = select(Student).where(Student.user_id == user_id)
        student = (await self.session.execute(stmt_stu)).scalar_one_or_none()
        
        if not student:
            # Создаем новую запись
            code = await self._generate_student_code()
            student = Student(
                user_id=user_id,
                student_code=code,
                is_active=True
            )
            self.session.add(student)
            logger.info(f"Created Student record for user {user.full_name} with code {code}")
        else:
            student.is_active = True
            logger.info(f"Existing Student record found for user {user.full_name}, reactivated.")

        await self.session.commit()
        await self.session.refresh(student)
        return student
