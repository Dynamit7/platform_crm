from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton


def get_teacher_main_menu() -> ReplyKeyboardMarkup:
    """Main menu keyboard for teachers."""
    keyboard = [
        [KeyboardButton(text="📅 Моё расписание"), KeyboardButton(text="👥 Мои группы")],
        [KeyboardButton(text="📋 Отчёты"), KeyboardButton(text="📚 Материалы")],
        [KeyboardButton(text="🏠 Главное меню")]
    ]
    return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True)


def get_teacher_panel_keyboard() -> InlineKeyboardMarkup:
    """Inline menu for teacher panel."""
    buttons = [
        [InlineKeyboardButton(text="📅 Моё расписание", callback_data="teacher_schedule")],
        [InlineKeyboardButton(text="👥 Мои группы", callback_data="teacher_groups")],
        [InlineKeyboardButton(text="✍️ Выставить оценки", callback_data="teacher_marks")],
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)
