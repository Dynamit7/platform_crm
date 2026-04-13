import re
import logging
from aiogram import Bot
from aiogram.exceptions import TelegramBadRequest

logger = logging.getLogger(__name__)

def escape_markdown(text: str) -> str:
    """Экранирует спецсимволы для классического Markdown (V1)."""
    if not text:
        return ""
    # В Markdown V1 экранируются _, *, [, `
    return re.sub(r'([_*\[`])', r'\\\1', text)

def escape_markdown_v2(text: str) -> str:
    """Экранирует спецсимволы для MarkdownV2."""
    if not text:
        return ""
    # Список символов для V2 гораздо шире
    escape_chars = r'_*[]()~`>#+-=|{}.!'
    return re.sub(f'([{re.escape(escape_chars)}])', r'\\\1', text)

async def safe_send_message(bot: Bot, chat_id: int, text: str, parse_mode: str = "Markdown", **kwargs):
    """
    Безопасная отправка сообщения. 
    Если Markdown не прошел валидацию, отправляет как обычный текст.
    """
    try:
        return await bot.send_message(chat_id, text, parse_mode=parse_mode, **kwargs)
    except TelegramBadRequest as e:
        if "can't parse entities" in str(e).lower():
            logger.warning(f"Markdown parsing failed for chat {chat_id}. Sending as plain text. Error: {e}")
            # Пробуем отправить БЕЗ разметки
            return await bot.send_message(chat_id, text, parse_mode=None, **kwargs)
        raise e
