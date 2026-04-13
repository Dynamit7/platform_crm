from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
from typing import List

def get_start_keyboard(is_registered: bool) -> InlineKeyboardMarkup:
    """Стартовая клавиатура в зависимости от регистрации."""
    buttons = []
    if is_registered:
        buttons.append([InlineKeyboardButton(text="📱 Личный кабинет", callback_data="student:main")])
    else:
        buttons.append([InlineKeyboardButton(text="📝 Записаться", callback_data="apply_start")])
        buttons.append([InlineKeyboardButton(text="ℹ️ О центре", callback_data="about:info")])
    
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_back_button(callback_data: str) -> InlineKeyboardButton:
    """Кнопка возврата с кастомным callback_data."""
    return InlineKeyboardButton(text="⬅️ Назад", callback_data=callback_data)

def get_main_menu_button(role: str = "main") -> InlineKeyboardButton:
    """Кнопка перехода в главное меню в зависимости от роли."""
    if role == "student":
        callback = "student:main"
    elif role == "teacher":
        callback = "teacher:panel"
    else:
        callback = "admin:main"
        
    return InlineKeyboardButton(text="🏠 Главное меню", callback_data=callback)

def get_navigation_row(back_callback: str, role: str = "main") -> List[InlineKeyboardButton]:
    """Строка кнопок: Назад + Главное меню."""
    return [
        get_back_button(back_callback),
        get_main_menu_button(role)
    ]
