import logging
from aiogram import Bot
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from bot.config import config
from bot.notifications.service import NotificationService as NewNotificationService
from bot.notifications.types import NotificationType
from bot.utils.helpers import safe_send_message, escape_markdown

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self, bot: Bot):
        self._inner = NewNotificationService(bot)
        self.bot = bot
        self.channel_id = config.CHANNEL_ID
        self.notify_channel = config.NOTIFY_CHANNEL

    async def notify_lesson_reminder(self, user_id: int, topic: str, time: str):
        await self._inner.send_notification(user_id, NotificationType.LESSON_REMINDER, topic=topic, time=time)
        if self.notify_channel:
            await safe_send_message(self.bot, self.channel_id, f"🔔 [LOG] Напоминание: {topic} в {time}", parse_mode="Markdown")

    async def notify_new_homework(self, user_id: int, course: str, topic: str):
        await self._inner.send_notification(user_id, NotificationType.NEW_HOMEWORK, course=course, topic=topic)
        if self.notify_channel:
            await safe_send_message(self.bot, self.channel_id, f"🔔 [LOG] ДЗ: {course} — {topic}", parse_mode="Markdown")

    async def notify_grade(self, user_id: int, grade: str, comment: str):
        await self._inner.send_notification(user_id, NotificationType.GRADE_REVIEW, grade=grade, comment=comment)

    async def notify_payment_limit(self, user_id: int, name: str, amount: float):
        await self._inner.send_notification(user_id, NotificationType.PAYMENT_REMINDER, name=name, balance=amount)

    async def notify_feedback_request(self, user_id: int, topic: str, lesson_id: int):
        kb = InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(text="⭐ Оценить", callback_data=f"rate_lesson:{lesson_id}")
        ]])
        text = "🎬 *Урок «{topic}» завершён!*\n\nКак всё прошло? Пожалуйста, оцените занятие — это займёт не более 30 секунд. ⭐".format(topic=escape_markdown(topic))
        await safe_send_message(self.bot, user_id, text, parse_mode="Markdown", reply_markup=kb)

    async def notify_user_status_change(self, user_telegram_id: int, status_text: str):
        await safe_send_message(self.bot, user_telegram_id, status_text, parse_mode="Markdown")

    async def notify_channel_action(self, action_text: str):
        if self.notify_channel and self.channel_id:
            await safe_send_message(self.bot, self.channel_id, action_text, parse_mode="Markdown")
