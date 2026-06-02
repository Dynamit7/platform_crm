import logging
from typing import Any, Awaitable, Callable, Dict
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject
from bot.models.user import User, UserRole

logger = logging.getLogger(__name__)

class AdminAccessMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any]
    ) -> Any:
        db_user: User | None = data.get("db_user")
        if not db_user or db_user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN):
            if hasattr(event, "message") and event.message:
                await event.message.answer("⛔ Доступ запрещён. Только для администраторов.")
            elif hasattr(event, "callback_query") and event.callback_query:
                await event.callback_query.answer("⛔ Доступ запрещён", show_alert=True)
            return
        return await handler(event, data)
