from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, InlineKeyboardMarkup, InlineKeyboardButton
from datetime import date, timedelta
from typing import List
from bot.models.education import Lesson

def get_teacher_main_menu() -> ReplyKeyboardMarkup:
    keyboard = [
        [KeyboardButton(text="📅 Моё расписание"), KeyboardButton(text="👥 Мои группы")],
        [KeyboardButton(text="📋 Отчёты"), KeyboardButton(text="📚 Материалы")],
        [KeyboardButton(text="💬 Чат")],
        [KeyboardButton(text="🏠 Главное меню")]
    ]
    return ReplyKeyboardMarkup(keyboard=keyboard, resize_keyboard=True)

def get_teacher_panel_keyboard() -> InlineKeyboardMarkup:
    buttons = [
        [InlineKeyboardButton(text="📅 Моё расписание", callback_data="teacher_schedule")],
        [InlineKeyboardButton(text="👥 Мои группы", callback_data="teacher_groups")],
        [InlineKeyboardButton(text="✍️ Выставить оценки", callback_data="teacher_marks")],
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_teacher_main_kb() -> InlineKeyboardMarkup:
    """Главное меню преподавателя."""
    buttons = [
        [InlineKeyboardButton(text="👥 Мои группы", callback_data="teacher:groups")],
        [InlineKeyboardButton(text="📚 Проверка ДЗ", callback_data="teacher:hw_review")],
        [InlineKeyboardButton(text="🗓 Расписание уроков", callback_data="teacher:schedule")],
        [InlineKeyboardButton(text="👤 Профиль", callback_data="teacher:profile")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_teacher_groups_kb(groups) -> InlineKeyboardMarkup:
    """Список групп преподавателя."""
    buttons = []
    for g in groups:
        buttons.append([InlineKeyboardButton(text=f"🏢 {g.name}", callback_data=f"t_group:{g.id}")])
    buttons.append([InlineKeyboardButton(text="⬅️ Назад", callback_data="teacher:main")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_group_manage_kb(group_id: int) -> InlineKeyboardMarkup:
    """Действия внутри группы."""
    buttons = [
        [InlineKeyboardButton(text="📖 Учебный журнал", callback_data=f"t_journal:{group_id}")],
        [InlineKeyboardButton(text="📢 Рассылка группе", callback_data=f"t_broadcast_start:{group_id}")],
        [InlineKeyboardButton(text="📅 Управление уроками", callback_data=f"t_lessons_manage:{group_id}")],
        [InlineKeyboardButton(text="📝 Перекличка", callback_data=f"t_att_lessons:{group_id}")],
        [InlineKeyboardButton(text="⬅️ К группам", callback_data="teacher:groups")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_teacher_lessons_kb(lessons, group_id: int) -> InlineKeyboardMarkup:
    """Выбор урока для переклички или загрузки материалов."""
    buttons = []
    for l in lessons:
        buttons.append([
            InlineKeyboardButton(text=f"📖 {l.lesson_date.strftime('%d.%m')} - {l.topic[:15]}", callback_data=f"t_att_start:{l.id}"),
            InlineKeyboardButton(text="📤", callback_data=f"t_mat_upload:{l.id}")
        ])
    buttons.append([InlineKeyboardButton(text="⬅️ Назад", callback_data=f"t_group:{group_id}")])
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_attendance_status_kb(lesson_id: int, student_id: int) -> InlineKeyboardMarkup:
    """Кнопки выбора статуса для конкретного ученика."""
    buttons = [
        [
            InlineKeyboardButton(text="✅ Был", callback_data=f"att_set:{lesson_id}:{student_id}:present"),
            InlineKeyboardButton(text="❌ Нет", callback_data=f"att_set:{lesson_id}:{student_id}:absent"),
            InlineKeyboardButton(text="⏳ Опоздал", callback_data=f"att_set:{lesson_id}:{student_id}:late")
        ],
        [InlineKeyboardButton(text="⬅️ К списку", callback_data=f"t_att_start:{lesson_id}")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_week_navigation_kb(target_date: date) -> InlineKeyboardMarkup:
    start_of_week = target_date - timedelta(days=target_date.weekday())
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
    buttons = [
        [InlineKeyboardButton(text="✅ Отметить посещаемость", callback_data=f"t_att_start_{lesson_id}")],
        [InlineKeyboardButton(text="📝 Домашнее задание", callback_data=f"t_hw_set_{lesson_id}")],
        [InlineKeyboardButton(text="📚 Материалы", callback_data=f"t_mat_send_{lesson_id}")],
        [InlineKeyboardButton(text="📊 Отчёт по уроку", callback_data=f"t_rep_gen_{lesson_id}")],
        [InlineKeyboardButton(text="🔙 К расписанию", callback_data="teacher_schedule_today")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_grading_kb(submission_id: int) -> InlineKeyboardMarkup:
    """Выбор оценки 1-5."""
    buttons = [
        [
            InlineKeyboardButton(text="1", callback_data=f"hw_set_grade:{submission_id}:1"),
            InlineKeyboardButton(text="2", callback_data=f"hw_set_grade:{submission_id}:2"),
            InlineKeyboardButton(text="3", callback_data=f"hw_set_grade:{submission_id}:3"),
            InlineKeyboardButton(text="4", callback_data=f"hw_set_grade:{submission_id}:4"),
            InlineKeyboardButton(text="5", callback_data=f"hw_set_grade:{submission_id}:5")
        ],
        [InlineKeyboardButton(text="❌ Отмена", callback_data="teacher:hw_review")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)
