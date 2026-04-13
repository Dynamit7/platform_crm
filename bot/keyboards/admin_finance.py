from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

def get_finance_main_kb() -> InlineKeyboardMarkup:
    """Главное меню финансов."""
    buttons = [
        [InlineKeyboardButton(text="📋 Все платежи", callback_data="admin_fin:list_all")],
        [InlineKeyboardButton(text="📥 Внести оплату вручную", callback_data="admin_fin:manual_add")],
        [InlineKeyboardButton(text="🔔 Напоминания о долгах", callback_data="admin_fin:remind_debt")],
        [InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:main")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_payment_method_kb() -> InlineKeyboardMarkup:
    """Выбор способа оплаты."""
    buttons = [
        [InlineKeyboardButton(text="💵 Наличные", callback_data="fin_method:Cash")],
        [InlineKeyboardButton(text="💳 Карта (Терминал)", callback_data="fin_method:Card")],
        [InlineKeyboardButton(text="🏦 Перевод (Uzum/Payme)", callback_data="fin_method:Transfer")],
        [InlineKeyboardButton(text="❌ Отмена", callback_data="admin:finance")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_finance_back_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:finance")]
    ])
