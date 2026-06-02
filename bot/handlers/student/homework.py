from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from bot.models.user import User, Student
from bot.models.education import Lesson, HomeworkSubmission
from bot.keyboards.student import get_back_to_cabinet_kb
import aiohttp
from bot.config import config


router = Router(name="student_homework")

class StudentHomeworkStates(StatesGroup):
    waiting_for_homework_file = State()
    waiting_for_hw_confirm = State()

@router.callback_query(F.data == "student:homework")
async def list_lessons_for_hw(callback: types.CallbackQuery, session: AsyncSession, db_user: User, state: FSMContext = None):
    """Список уроков, по которым можно сдать ДЗ."""
    if state:
        await state.clear()
    # Получаем студента и его группы
    stmt = select(Student).where(Student.user_id == db_user.id)
    res = await session.execute(stmt)
    student = res.scalar_one_or_none()
    
    if not student:
        await callback.answer("Ошибка профиля")
        return

    # Показываем последние 5 уроков для сдачи
    text = "📝 *Сдача домашних заданий*\n\nВыберите урок для отправки решения или посмотрите свои оценки:"
    
    # Правильная фильтрация: показываем уроки только из групп ученика
    from bot.models.education import StudentGroup
    
    from bot.services.finance_service import FinanceService
    finance_service = FinanceService(session)
    if await finance_service.is_student_debtor(student):
        await callback.message.edit_text(
            "❄️ *Доступ ограничен*\n\n"
            "К сожалению, доступ к отправке домашних заданий заморожен. Возможно, у вас имеется задолженность по оплате за обучение или ваш аккаунт временно приостановлен.\n\n"
            "Пожалуйста, свяжитесь с администрацией или проверьте раздел «Оплата».",
            parse_mode="Markdown",
            reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[[types.InlineKeyboardButton(text="⬅️ Назад", callback_data="student:main")]])
        )
        return
    groups_stmt = select(StudentGroup.group_id).where(StudentGroup.student_id == student.id, StudentGroup.status == "active")
    group_ids = (await session.execute(groups_stmt)).scalars().all()
    
    if not group_ids:
        text = "ℹ️ Вы пока не состоите ни в одной активной группе."
        buttons = [[types.InlineKeyboardButton(text="⬅️ Назад", callback_data="student:main")]]
        await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=types.InlineKeyboardMarkup(inline_keyboard=buttons))
        return
        
    stmt = select(Lesson).where(Lesson.group_id.in_(group_ids)).order_by(Lesson.lesson_date.desc()).limit(10)
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

@router.message(StudentHomeworkStates.waiting_for_homework_file, F.photo | F.document | F.text)
async def process_hw_file(message: types.Message, state: FSMContext, session: AsyncSession, db_user: User):
    """Прием файла ДЗ и запрос подтверждения."""
    if message.photo:
        file_id = message.photo[-1].file_id
        file_type = "photo"
        caption = message.caption or ""
    elif message.document:
        file_id = message.document.file_id
        file_type = "document"
        caption = message.caption or ""
    else:
        file_id = "text"
        file_type = "text"
        caption = message.text

    await state.update_data(file_id=file_id, file_type=file_type, caption=caption)
    
    kb = types.InlineKeyboardMarkup(inline_keyboard=[
        [types.InlineKeyboardButton(text="✅ Подтвердить отправку", callback_data="hw_confirm")],
        [types.InlineKeyboardButton(text="❌ Отмена", callback_data="student:homework")]
    ])
    
    if file_type == "text":
        await message.answer(f"Вы прикрепили текст:\n\n_{caption}_\n\nВсё верно? Отправляем учителю?", parse_mode="Markdown", reply_markup=kb)
    else:
        await message.answer("Файл получен! Нажмите кнопку ниже, чтобы окончательно отправить его учителю.", reply_markup=kb)
        
    await state.set_state(StudentHomeworkStates.waiting_for_hw_confirm)

@router.callback_query(StudentHomeworkStates.waiting_for_hw_confirm, F.data == "hw_confirm")
async def confirm_hw_submission(callback: types.CallbackQuery, state: FSMContext, session: AsyncSession, db_user: User):
    """Окончательное сохранение ДЗ."""
    data = await state.get_data()
    lesson_id = data.get('lesson_id')
    file_id = data.get('file_id')
    file_type = data.get('file_type')
    caption = data.get('caption')
    
    if not lesson_id:
        await callback.answer("Ошибка сессии")
        return
        
    stmt = select(Student).where(Student.user_id == db_user.id)
    student = (await session.execute(stmt)).scalar_one()
    
    new_sub = HomeworkSubmission(
        student_id=student.id,
        lesson_id=lesson_id,
        file_id=file_id,
        file_type=file_type,
        text=caption
    )
    
    session.add(new_sub)
    await session.commit()
    
    # Уведомление для учителя
    from bot.models.education import Lesson, Group
    from bot.models.user import Teacher, User as UserModel
    from sqlalchemy.orm import selectinload
    
    lesson_stmt = (
        select(Lesson)
        .where(Lesson.id == lesson_id)
        .options(
            selectinload(Lesson.group).selectinload(Group.teacher).selectinload(Teacher.user)
        )
    )
    lesson = await session.scalar(lesson_stmt)
    
    if lesson and lesson.group and lesson.group.teacher and lesson.group.teacher.user:
        teacher_tg_id = lesson.group.teacher.user.telegram_id
        student_name = db_user.full_name
        group_name = lesson.group.name
        date_str = lesson.lesson_date.strftime('%d.%m.%Y')
        time_str = lesson.lesson_time if lesson.lesson_time else ""
        lesson_dt = f"{date_str} {time_str}".strip()
        
        notification_text = (
            f"📝 *Новое домашнее задание!*\n\n"
            f"👤 *Студент:* {student_name}\n"
            f"👥 *Группа:* {group_name}\n"
            f"🕒 *Урок:* {lesson_dt}\n\n"
            f"Пожалуйста, проверьте его в разделе 'Домашние задания'."
        )
        
        try:
            await callback.bot.send_message(
                chat_id=teacher_tg_id,
                text=notification_text,
                parse_mode="Markdown"
            )
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to send HW notification to teacher: {e}")
            
    # Sync with CRM
    try:
        headers = {"X-Bot-Secret": config.BOT_TOKEN.get_secret_value()}
        async with aiohttp.ClientSession() as http_session:
            payload = {
                "telegram_id": db_user.telegram_id,
                "course_id": lesson.group.course_id if lesson and lesson.group else None,
                "group_id": lesson.group_id if lesson else None,
                "title": f"ДЗ к уроку {lesson_dt}" if lesson else "ДЗ из бота",
                "content": caption if file_type == "text" else f"[{file_type.upper()}] {file_id}"
            }
            await http_session.post(f"{config.API_URL}/sync-homework", json=payload, headers=headers, timeout=3)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to sync homework to CRM: {e}")
    
    await callback.message.edit_text("✅ *Ваше задание успешно отправлено на проверку!*", parse_mode="Markdown", reply_markup=get_back_to_cabinet_kb())
    await state.clear()
