import logging
from typing import Any, Awaitable, Callable, Dict
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject
from bot.repositories.user import UserRepository
from bot.models.user import Student
from sqlalchemy import select

logger = logging.getLogger(__name__)

class AuthMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any]
    ) -> Any:
        session = data["session"]
        user_repo = UserRepository(session)
        user = data.get("event_from_user")
        if not user:
            return await handler(event, data)
            
        telegram_id = user.id

        # 1. Получаем пользователя из БД
        db_user = await user_repo.get_by_telegram_id(telegram_id)
        
        if db_user:
            # Block check
            if not db_user.is_active:
                if getattr(event, "message", None):
                    await event.message.answer("🚫 Ваш аккаунт в боте заблокирован администрацией.")
                elif getattr(event, "callback_query", None):
                    await event.callback_query.answer("🚫 Ваш аккаунт заблокирован.", show_alert=True)
                return  # Drop the event

            # 2. Если роль STUDENT, проверяем наличие профиля в таблице students
            if db_user.role == "student":
                stmt = select(Student).where(Student.user_id == db_user.id)
                result = await session.execute(stmt)
                student_profile = result.scalar_one_or_none()
                
                # 3. Если профиля нет (например, только что одобрили), создаем его автоматом
                if not student_profile:
                    new_student = Student(user_id=db_user.id)
                    session.add(new_student)
                    await session.commit()
                    logger.info(f"Auto-created student profile for user {db_user.id}")

            data["db_user"] = db_user
        else:
            data["db_user"] = None

        return await handler(event, data)
