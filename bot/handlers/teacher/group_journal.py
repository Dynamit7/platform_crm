import logging
from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from bot.models.education import Lesson, Attendance, StudentGroup, HomeworkSubmission
from bot.models.user import Student
from bot.keyboards.teacher import get_group_manage_kb
from aiogram.utils.keyboard import InlineKeyboardBuilder

router = Router(name="teacher_journal")
logger = logging.getLogger(__name__)

class LessonEditStates(StatesGroup):
    waiting_for_new_date = State()

@router.callback_query(F.data.startswith("t_journal:"))
async def view_group_journal(callback: types.CallbackQuery, session: AsyncSession):
    """Сводная таблица успеваемости и посещаемости группы."""
    group_id = int(callback.data.split(":")[1])
    
    # Получаем группу и учеников
    stmt = (
        select(StudentGroup)
        .where(StudentGroup.group_id == group_id)
        .options(selectinload(StudentGroup.student).selectinload(Student.user))
    )
    students = (await session.execute(stmt)).scalars().all()
    
    text = f"📖 *Учебный журнал группы ID {group_id}*\n\n"
    text += "👤 Ученик | Посещ. | Ср. балл\n"
    text += "--------------------------------\n"
    
    for link in students:
        s_id = link.student_id
        # Посещаемость
        att_stmt = select(func.count(Attendance.id)).where(Attendance.student_id == s_id, Attendance.status == "present")
        attended = await session.scalar(att_stmt) or 0
        
        # Средний балл по ДЗ
        grade_stmt = select(func.avg(HomeworkSubmission.grade)).where(HomeworkSubmission.student_id == s_id, HomeworkSubmission.status == "accepted")
        avg_grade = await session.scalar(grade_stmt) or 0
        
        text += f"{link.student.user.full_name[:12]} | {attended} зан. | {float(avg_grade):.1f}\n"

    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=get_group_manage_kb(group_id))

@router.callback_query(F.data.startswith("t_lessons_manage:"))
async def list_group_lessons_for_edit(callback: types.CallbackQuery, session: AsyncSession):
    group_id = int(callback.data.split(":")[1])
    stmt = select(Lesson).where(Lesson.group_id == group_id).order_by(Lesson.lesson_date.desc()).limit(10)
    lessons = (await session.execute(stmt)).scalars().all()
    
    builder = InlineKeyboardBuilder()
    for l in lessons:
        builder.row(types.InlineKeyboardButton(text=f"✏️ {l.lesson_date.strftime('%d.%m')} - {l.topic[:15]}", callback_data=f"t_edit_lesson:{l.id}"))
    
    builder.row(types.InlineKeyboardButton(text="⬅️ Назад", callback_data=f"t_group:{group_id}"))
    
    await callback.message.edit_text("📅 *Управление уроками*\nВыберите урок для переноса или редактирования:", parse_mode="Markdown", reply_markup=builder.as_markup())

@router.callback_query(F.data.startswith("t_edit_lesson:"))
async def start_lesson_edit(callback: types.CallbackQuery, state: FSMContext, session: AsyncSession):
    lesson_id = int(callback.data.split(":")[1])
    stmt = select(Lesson).where(Lesson.id == lesson_id)
    lesson = (await session.execute(stmt)).scalar_one()
    
    await state.update_data(lesson_id=lesson_id, group_id=lesson.group_id)
    await callback.message.edit_text(
        f"✏️ *Редактирование урока*\n\nТема: {lesson.topic}\nТекущая дата: {lesson.lesson_date}\nВремя: {lesson.lesson_time}\n\n"
        f"Введите новую дату и время в формате: `ДД.ММ.ГГГГ ЧЧ:ММ`",
        parse_mode="Markdown"
    )
    await state.set_state(LessonEditStates.waiting_for_new_date)

@router.message(LessonEditStates.waiting_for_new_date)
async def process_new_lesson_date(message: types.Message, state: FSMContext, session: AsyncSession):
    from datetime import datetime
    data = await state.get_data()
    lesson_id = data['lesson_id']
    
    try:
        new_dt = datetime.strptime(message.text, "%d.%m.%Y %H:%M")
        stmt = select(Lesson).where(Lesson.id == lesson_id)
        lesson = (await session.execute(stmt)).scalar_one()
        
        lesson.lesson_date = new_dt.date()
        lesson.lesson_time = new_dt.strftime("%H:%M")
        await session.commit()
        
        await message.answer(f"✅ Урок «{lesson.topic}» перенесен на {message.text}", reply_markup=get_group_manage_kb(lesson.group_id))
        await state.clear()
    except ValueError:
        await message.answer("❌ Неверный формат. Используйте: `ДД.ММ.ГГГГ ЧЧ:ММ`")
