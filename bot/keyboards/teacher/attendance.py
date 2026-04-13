from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from typing import List, Dict
from bot.models.user import Student


def get_attendance_marking_kb(students: List[Student], attendance_data: Dict[int, str], lesson_id: int) -> InlineKeyboardMarkup:
    """
    students: list of students in the group
    attendance_data: dict {student_id: status_string}
    lesson_id: id of the current lesson
    """
    buttons = []
    for student in students:
        status = attendance_data.get(student.id, "none")
        
        # Color markers/icons for status
        if status == "present":
            status_ico = "✅"
        elif status == "absent":
            status_ico = "❌"
        elif status == "late":
            status_ico = "⏳"
        else:
            status_ico = "⚪️"
            
        full_name = student.user.full_name or "Без имени"
        
        buttons.append([
            InlineKeyboardButton(text=f"{status_ico} {full_name}", callback_data="ignore"),
            InlineKeyboardButton(text="Был", callback_data=f"t_att_set_{lesson_id}_{student.id}_present"),
            InlineKeyboardButton(text="Нет", callback_data=f"t_att_set_{lesson_id}_{student.id}_absent"),
            InlineKeyboardButton(text="Опоздал", callback_data=f"t_att_set_{lesson_id}_{student.id}_late"),
        ])
    
    # Bottom action buttons
    buttons.append([
        InlineKeyboardButton(text="💾 Сохранить и выйти", callback_data=f"t_att_save_{lesson_id}"),
    ])
    buttons.append([
        InlineKeyboardButton(text="🔙 Отмена", callback_data=f"t_lesson_view_{lesson_id}")
    ])
    
    return InlineKeyboardMarkup(inline_keyboard=buttons)
