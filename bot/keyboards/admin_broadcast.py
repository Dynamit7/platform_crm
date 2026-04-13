from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

def get_broadcast_audience_kb() -> InlineKeyboardMarkup:
    buttons = [
        [InlineKeyboardButton(text="🌍 Всем пользователям", callback_data="br_target:all")],
        [InlineKeyboardButton(text="🎓 Только студентам", callback_data="br_target:student")],
        [InlineKeyboardButton(text="👨‍🏫 Только учителям", callback_data="br_target:teacher")],
        [InlineKeyboardButton(text="🕒 Ожидающим (Pending)", callback_data="br_target:pending")],
        [InlineKeyboardButton(text="❌ Отмена", callback_data="admin:main")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_broadcast_confirm_kb() -> InlineKeyboardMarkup:
    buttons = [
        [
            InlineKeyboardButton(text="✅ Подтвердить и отправить", callback_data="br_action:send"),
            InlineKeyboardButton(text="🔄 Сбросить", callback_data="admin:broadcast")
        ],
        [InlineKeyboardButton(text="❌ Отмена", callback_data="admin:main")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)
