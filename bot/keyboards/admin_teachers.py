from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

def get_teachers_main_kb() -> InlineKeyboardMarkup:
    buttons = [
        [InlineKeyboardButton(text="➕ Добавить преподавателя", callback_data="admin:teacher_add")],
        [InlineKeyboardButton(text="📋 Список всех", callback_data="admin:teachers_list:1")],
        [InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:main")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_teacher_view_kb(teacher_id: int) -> InlineKeyboardMarkup:
    buttons = [
        [
            InlineKeyboardButton(text="✏️ Изменить", callback_data=f"admin:teacher_edit:{teacher_id}"),
            InlineKeyboardButton(text="🗑 Удалить", callback_data=f"admin:teacher_del:{teacher_id}")
        ],
        [InlineKeyboardButton(text="📚 Назначить на курс", callback_data=f"admin:teacher_assign:{teacher_id}")],
        [InlineKeyboardButton(text="⬅️ К списку", callback_data="admin:teachers_list:1")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)
