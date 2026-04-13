from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton
from bot.keyboards.common import get_main_menu_button

def get_student_cabinet_kb() -> InlineKeyboardMarkup:
    """Главное меню личного кабинета."""
    buttons = [
        [
            InlineKeyboardButton(text="📚 Мои курсы", callback_data="student:courses"),
            InlineKeyboardButton(text="🗓 Расписание", callback_data="student:schedule")
        ],
        [
            InlineKeyboardButton(text="📝 Домашние задания", callback_data="student:homework"),
            InlineKeyboardButton(text="📂 Материалы", callback_data="student:materials")
        ],
        [
            InlineKeyboardButton(text="💰 Мои оплаты", callback_data="student:payments"),
            InlineKeyboardButton(text="👤 Мой профиль", callback_data="student:profile")
        ]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_back_to_cabinet_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [get_main_menu_button(role="student")]
    ])

def get_student_main_reply_kb() -> ReplyKeyboardMarkup:
    """Нижнее меню."""
    keyboard = [
        [KeyboardButton(text="🎓 Кабинет"), KeyboardButton(text="❓ Помощь")]
    ]
    return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True)
