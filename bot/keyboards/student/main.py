from aiogram.types import ReplyKeyboardMarkup, KeyboardButton


def get_student_main_menu() -> ReplyKeyboardMarkup:
    """Main menu keyboard for students."""
    keyboard = [
        [KeyboardButton(text="🏠 Личный кабинет")],
        [KeyboardButton(text="📅 Расписание"), KeyboardButton(text="📝 Домашние задания")],
        [KeyboardButton(text="🎓 Мой прогресс"), KeyboardButton(text="💳 Оплата")],
        [KeyboardButton(text="📚 Материалы"), KeyboardButton(text="💬 Обратная связь")]
    ]
    return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True)
