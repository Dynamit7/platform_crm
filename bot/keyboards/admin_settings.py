from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

def get_admin_settings_main_kb() -> InlineKeyboardMarkup:
    buttons = [
        [InlineKeyboardButton(text="🏢 Информация о центре", callback_data="admin_set:info")],
        [InlineKeyboardButton(text="🔔 Настройки уведомлений", callback_data="admin_set:notify")],
        [InlineKeyboardButton(text="🕒 Время напоминаний", callback_data="admin_set:time")],
        [InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:main")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_settings_edit_kb(key: str) -> InlineKeyboardMarkup:
    buttons = [
        [InlineKeyboardButton(text="✏️ Изменить значение", callback_data=f"set_edit:{key}")],
        [InlineKeyboardButton(text="⬅️ Назад", callback_data="admin_menu:settings")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)
