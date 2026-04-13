from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

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
