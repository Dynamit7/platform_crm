from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton

def get_student_cabinet_kb() -> InlineKeyboardMarkup:
    """Клавиатура личного кабинета ученика."""
    buttons = [
        [
            InlineKeyboardButton(text="📚 Мои курсы", callback_data="student:courses"),
            InlineKeyboardButton(text="🗓 Расписание", callback_data="student:schedule")
        ],
        [
            InlineKeyboardButton(text="📝 Домашние задания", callback_data="student:homework"),
            InlineKeyboardButton(text="💰 Оплаты", callback_data="student:payments")
        ],
        [
            InlineKeyboardButton(text="👤 Профиль", callback_data="student:profile")
        ]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_student_main_reply_kb() -> ReplyKeyboardMarkup:
    """Главное меню ученика (кнопки внизу экрана)."""
    keyboard = [
        [KeyboardButton(text="🎓 Кабинет"), KeyboardButton(text="❓ Помощь")]
    ]
    return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True)
