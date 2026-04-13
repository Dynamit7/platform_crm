from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton


def get_payment_kb(payment_url: str) -> InlineKeyboardMarkup:
    """
    Keyboard with a button leading to the payment page.
    """
    buttons = [
        [InlineKeyboardButton(text="💳 Оплатить сейчас", url=payment_url)],
        [InlineKeyboardButton(text="✅ Проверить статус", callback_data="check_payment_status")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)
