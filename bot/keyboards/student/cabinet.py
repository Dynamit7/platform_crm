from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton


def get_cabinet_inline_kb() -> InlineKeyboardMarkup:
    """Dashboard contextual buttons."""
    buttons = [
        [InlineKeyboardButton(text="📖 Подробнее о следующем уроке", callback_data="st_next_lesson_info")],
        [InlineKeyboardButton(text="📈 Детальный прогресс", callback_data="st_progress_details")],
        [InlineKeyboardButton(text="💎 Мои достижения", callback_data="st_achievements")],
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_lesson_feedback_kb(lesson_id: int) -> InlineKeyboardMarkup:
    """Rating buttons for feedback."""
    buttons = []
    # 5 stars in one row
    stars_row = []
    for i in range(1, 6):
        stars_row.append(InlineKeyboardButton(text=f"{i} ⭐", callback_data=f"st_rate_{lesson_id}_{i}"))
    buttons.append(stars_row)
    
    buttons.append([InlineKeyboardButton(text="❌ Пропустить", callback_data="st_rate_skip")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)
