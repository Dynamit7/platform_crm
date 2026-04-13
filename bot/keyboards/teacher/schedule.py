from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from datetime import date, timedelta
from typing import List
from bot.models.education import Lesson


def get_week_navigation_kb(target_date: date) -> InlineKeyboardMarkup:
    """Keyboard for navigating weeks and selecting days."""
    start_of_week = target_date - timedelta(days=target_date.weekday())
    
    # Days of the week buttons
    day_buttons = []
    days_ru = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    
    row = []
    for i in range(7):
        current_day = start_of_week + timedelta(days=i)
        prefix = "✅ " if current_day == target_date else ""
        row.append(InlineKeyboardButton(
            text=f"{prefix}{days_ru[i]}", 
            callback_data=f"t_sch_date_{current_day.isoformat()}"
        ))
    day_buttons.append(row)
    
    # Navigation buttons
    prev_week = target_date - timedelta(days=7)
    next_week = target_date + timedelta(days=7)
    
    day_buttons.append([
        InlineKeyboardButton(text="⬅️ Пред. неделя", callback_data=f"t_sch_date_{prev_week.isoformat()}"),
        InlineKeyboardButton(text="След. неделя ➡️", callback_data=f"t_sch_date_{next_week.isoformat()}"),
    ])
    
    day_buttons.append([
        InlineKeyboardButton(text="🔄 Сегодня", callback_data="teacher_schedule_today")
    ])
    
    return InlineKeyboardMarkup(inline_keyboard=day_buttons)


def get_lessons_list_kb(lessons: List[Lesson]) -> InlineKeyboardMarkup:
    """Keyboard listing lessons for a specific day."""
    buttons = []
    for lesson in lessons:
        time_str = lesson.lesson_time or "--:--"
        buttons.append([
            InlineKeyboardButton(
                text=f"🕒 {time_str} | {lesson.group.name} | {lesson.topic[:20]}...", 
                callback_data=f"t_lesson_view_{lesson.id}"
            )
        ])
    
    if not lessons:
        buttons.append([InlineKeyboardButton(text="Занятий нет", callback_data="none")])
        
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def get_lesson_action_kb(lesson_id: int) -> InlineKeyboardMarkup:
    """Actions available for a selected lesson."""
    buttons = [
        [InlineKeyboardButton(text="✅ Отметить посещаемость", callback_data=f"t_att_start_{lesson_id}")],
        [InlineKeyboardButton(text="📝 Домашнее задание", callback_data=f"t_hw_set_{lesson_id}")],
        [InlineKeyboardButton(text="📚 Материалы", callback_data=f"t_mat_send_{lesson_id}")],
        [InlineKeyboardButton(text="📊 Отчёт по уроку", callback_data=f"t_rep_gen_{lesson_id}")],
        [InlineKeyboardButton(text="🔙 К расписанию", callback_data="teacher_schedule_today")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)
