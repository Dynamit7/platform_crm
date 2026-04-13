import structlog
from aiogram import Bot
from bot.notifications.types import NotificationType
from bot.notifications.templates import TEMPLATES

log = structlog.get_logger()

class NotificationService:
    def __init__(self, bot: Bot):
        self.bot = bot

    async def send_notification(
        self, 
        user_id: int, 
        notification_type: NotificationType, 
        **kwargs
    ) -> bool:
        """
        Sends a formatted notification to a specific user.
        """
        template = TEMPLATES.get(notification_type)
        if not template:
            log.error("Template not found", type=notification_type.value)
            return False

        try:
            text = template.format(**kwargs)
            await self.bot.send_message(
                chat_id=user_id,
                text=text,
                parse_mode="Markdown"
            )
            log.info("Notification sent", user_id=user_id, type=notification_type.value)
            return True
        except Exception as e:
            log.error("Failed to send notification", user_id=user_id, error=str(e))
            return False

    async def broadcast(
        self, 
        user_ids: list[int], 
        notification_type: NotificationType, 
        **kwargs
    ):
        """
        Sends notifications to multiple users.
        """
        for user_id in user_ids:
            await self.send_notification(user_id, notification_type, **kwargs)
