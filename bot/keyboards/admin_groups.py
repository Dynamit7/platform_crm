from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from bot.utils.schedule_helper import DAYS_LIST

def get_days_selection_kb(current_mask: int) -> InlineKeyboardMarkup:
    """Генерирует сетку кнопок для выбора дней недели."""
    buttons = []
    row = []
    
    for val, label in DAYS_LIST:
        is_selected = current_mask & val
        icon = "✅ " if is_selected else ""
        row.append(InlineKeyboardButton(text=f"{icon}{label}", callback_data=f"group_day_toggle:{val}"))
        
        if len(row) == 3:
            buttons.append(row)
            row = []
    
    if row:
        buttons.append(row)
        
    # Дополнительная кнопка сохранения
    buttons.append([InlineKeyboardButton(text="💾 Сохранить график", callback_data="group_day_save")])
    buttons.append([InlineKeyboardButton(text="❌ Отмена", callback_data="admin_menu:groups")])
    
    return InlineKeyboardMarkup(inline_keyboard=buttons)
