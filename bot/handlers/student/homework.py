from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from bot.models.user import User, Student
from bot.models.education import Lesson, HomeworkSubmission
from bot.keyboards.student import get_back_to_cabinet_kb

router = Router(name="student_homework")

class StudentHomeworkStates(StatesGroup):
    waiting_for_homework_file = State()

@router.callback_query(F.data == "student:homework")
async def list_lessons_for_hw(callback: types.CallbackQuery, session: AsyncSession, db_user: User):
    """Список уроков, по которым можно сдать ДЗ."""
    # Получаем студента и его группы
    stmt = select(Student).where(Student.user_id == db_user.id)
    res = await session.execute(stmt)
    student = res.scalar_one_or_none()
    
    if not student:
        await callback.answer("Ошибка профиля")
        return

    # Показываем последние 5 уроков для сдачи
    text = "📝 *Сдача домашних заданий*\n\nВыберите урок для отправки решения или посмотрите свои оценки:"
    
    # Это упрощенный запрос, в идеале нужно фильтровать по группам ученика
    stmt = select(Lesson).order_by(Lesson.lesson_date.desc()).limit(5)
    res = await session.execute(stmt)
    lessons = res.scalars().all()
    
    buttons = []
    for l in lessons:
        buttons.append([types.InlineKeyboardButton(text=f"📤 {l.lesson_date.strftime('%d.%m')} - {l.topic[:20]}", callback_data=f"hw_send:{l.id}")])
    
    buttons.append([types.InlineKeyboardButton(text="⭐ Мои оценки", callback_data="hw_student_grades")])
    buttons.append([types.InlineKeyboardButton(text="⬅️ Назад", callback_data="student:main")])
    
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=types.InlineKeyboardMarkup(inline_keyboard=buttons))

@router.callback_query(F.data == "hw_student_grades")
async def view_my_grades(callback: types.CallbackQuery, session: AsyncSession, db_user: User):
    """Просмотр оценок ученика."""
    stmt = (
        select(HomeworkSubmission)
        .join(Student)
        .where(Student.user_id == db_user.id)
        .where(HomeworkSubmission.status == "accepted")
        .order_by(HomeworkSubmission.created_at.desc())
        .limit(10)
    )
    res = await session.execute(stmt)
    submissions = res.scalars().all()
    
    if not submissions:
        await callback.answer("У вас пока нет проверенных заданий", show_alert=True)
        return

    text = "⭐ *Ваши последние оценки:*\n\n"
    for s in submissions:
        text += f"🔹 {s.created_at.strftime('%d.%m')} | Оценка: *{s.grade}*\n"
    
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=get_back_to_cabinet_kb())

@router.callback_query(F.data.startswith("hw_send:"))
async def start_hw_submission(callback: types.CallbackQuery, state: FSMContext):
    lesson_id = int(callback.data.split(":")[1])
    await state.update_data(lesson_id=lesson_id)
    
    await callback.message.edit_text(
        "📎 *Отправка решения*\n\nПожалуйста, отправьте ваше домашнее задание (фото или документ).",
        parse_mode="Markdown",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
            [types.InlineKeyboardButton(text="❌ Отмена", callback_data="student:homework")]
        ])
    )
    await state.set_state(StudentHomeworkStates.waiting_for_homework_file)

@router.message(StudentHomeworkStates.waiting_for_homework_file, F.photo | F.document)
async def process_hw_file(message: types.Message, state: FSMContext, session: AsyncSession, db_user: User):
    """Прием и сохранение файла ДЗ."""
    data = await state.get_data()
    lesson_id = data['lesson_id']
    
    # Получаем ID студента
    stmt = select(Student).where(Student.user_id == db_user.id)
    res = await session.execute(stmt)
    student = res.scalar_one()
    
    file_id = message.photo[-1].file_id if message.photo else message.document.file_id
    file_type = "photo" if message.photo else "document"
    
    new_sub = HomeworkSubmission(
        student_id=student.id,
        lesson_id=lesson_id,
        file_id=file_id,
        file_type=file_type,
        comment=message.caption or ""
    )
    
    session.add(new_sub)
    await session.commit()
    
    await message.answer("✅ *Ваше задание успешно отправлено на проверку!*", parse_mode="Markdown", reply_markup=get_back_to_cabinet_kb())
    await state.clear()
