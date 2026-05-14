import logging
from aiogram import Bot
from bot.config import config
from bot.utils.helpers import safe_send_message, escape_markdown

logger = logging.getLogger(__name__)

class NotificationService:
    TEMPLATES = {
        "lesson_reminder": "⏰ *Напоминание об уроке!*\n\n📖 Тема: {topic}\n🕒 Время: {time}\n\nЖдем вас на занятии!",
        "new_homework": "📝 *Новое домашнее задание!*\n\n🎓 Курс: {course}\n📖 Урок: {topic}\n\nЗадание уже доступно в личном кабинете.",
        "grade_review": "⭐ *Ваше задание проверено!*\n\n📊 Оценка: *{grade}*\n💬 Отзыв: _{comment}_\n\nПосмотреть детали можно в кабинете.",
        "payment_reminder": "⚠️ *Напоминание об оплате*\n\nУважаемый {name}, напоминаем о необходимости оплатить обучение.\n💰 Сумма к оплате: *{amount}* сум.\n\n_Если вы уже оплатили, проигнорируйте это сообщение._",
        "feedback_request": "🎬 *Урок «{topic}» завершён!*\n\nКак всё прошло? Пожалуйста, оцените занятие — это займёт не более 30 секунд. ⭐",
    }

    def __init__(self, bot: Bot):
        self.bot = bot
        self.channel_id = config.CHANNEL_ID
        self.notify_channel = config.NOTIFY_CHANNEL

    async def _send(self, user_id: int, template_key: str, **kwargs):
        """Внутренний метод отправки по шаблону с автоматическим экранированием."""
        template = self.TEMPLATES.get(template_key)
        if not template:
            logger.error(f"Template {template_key} not found")
            return

        # Экранируем все строковые значения перед вставкой в шаблон
        safe_kwargs = {
            k: (escape_markdown(v) if isinstance(v, str) else v) 
            for k, v in kwargs.items()
        }
        
        # Специальный формат для денег (не экранируем запятую-разделитель если она добавлена кодом)
        if 'amount' in safe_kwargs:
            safe_kwargs['amount'] = f"{kwargs['amount']:,}".replace(',', ' ')

        text = template.format(**safe_kwargs)
        
        try:
            await safe_send_message(self.bot, user_id, text, parse_mode="Markdown")
            if self.notify_channel:
                await safe_send_message(self.bot, self.channel_id, f"🔔 [LOG] Уведомление {template_key}:\n{text}", parse_mode="Markdown")
        except Exception as e:
            logger.error(f"Critical notification failure {template_key} to {user_id}: {e}")

    # Public methods
    async def notify_lesson_reminder(self, user_id: int, topic: str, time: str):
        await self._send(user_id, "lesson_reminder", topic=topic, time=time)

    async def notify_new_homework(self, user_id: int, course: str, topic: str):
        await self._send(user_id, "new_homework", course=course, topic=topic)

    async def notify_grade(self, user_id: int, grade: str, comment: str):
        await self._send(user_id, "grade_review", grade=grade, comment=comment)

    async def notify_payment_limit(self, user_id: int, name: str, amount: float):
        await self._send(user_id, "payment_reminder", name=name, amount=amount)

    async def notify_feedback_request(self, user_id: int, topic: str, lesson_id: int):
        from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
        kb = InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(text="⭐ Оценить", callback_data=f"rate_lesson:{lesson_id}")
        ]])
        text = self.TEMPLATES["feedback_request"].format(topic=escape_markdown(topic))
        await safe_send_message(self.bot, user_id, text, parse_mode="Markdown", reply_markup=kb)

    async def notify_user_status_change(self, user_telegram_id: int, status_text: str):
        # Здесь текст уже может содержать Markdown от администратора, используем safe_send напрямую
        await safe_send_message(self.bot, user_telegram_id, status_text, parse_mode="Markdown")

    async def notify_channel_action(self, action_text: str):
        """Отправка уведомления в лог-канал (например, для админов/менеджеров)."""
        if self.notify_channel and self.channel_id:
            await safe_send_message(self.bot, self.channel_id, action_text, parse_mode="Markdown")
