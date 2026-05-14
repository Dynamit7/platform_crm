from aiogram import Router, types, F, Bot
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from bot.models.user import User, Teacher, Student
from aiogram.fsm.context import FSMContext
from bot.states.teacher import TeacherLessonStates, TeacherGradingStates
from bot.models.education import Lesson, StudentGroup, HomeworkSubmission
from bot.keyboards.teacher import get_teacher_main_kb

router = Router(name="teacher_homework")

@router.callback_query(F.data == "teacher:hw_review")
async def list_homeworks_for_review(callback: types.CallbackQuery, session: AsyncSession, db_user: User):
    """Список всех ДЗ, присланных учениками учителю."""
    # Получаем запись учителя
    stmt = select(Teacher).where(Teacher.user_id == db_user.id)
    res = await session.execute(stmt)
    teacher = res.scalar_one_or_none()
    
    if not teacher:
        await callback.answer("Ошибка профиля учителя")
        return

    # Ищем непроверенные ДЗ (pending)
    stmt = (
        select(HomeworkSubmission)
        .options(selectinload(HomeworkSubmission.student).selectinload(Student.user))
        .where(HomeworkSubmission.status == "pending")
        .order_by(HomeworkSubmission.created_at.desc())
        .limit(10)
    )
    res = await session.execute(stmt)
    submissions = res.scalars().all()
    
    if not submissions:
        try:
            await callback.message.edit_text("✅ Все домашние задания проверены!", reply_markup=get_teacher_main_kb())
        except Exception:
            await callback.message.delete()
            await callback.message.answer("✅ Все домашние задания проверены!", reply_markup=get_teacher_main_kb())
        return

    text = "📚 *Задания на проверку:*\n\nВыберите для просмотра:"
    buttons = []
    for sub in submissions:
        user = sub.student.user
        buttons.append([
            types.InlineKeyboardButton(text=f"📌 {user.full_name} ({sub.created_at.strftime('%d.%m')})", callback_data=f"hw_rev:{sub.id}")
        ])
    
    buttons.append([types.InlineKeyboardButton(text="⬅️ Назад", callback_data="teacher:main")])
    
    try:
        await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=types.InlineKeyboardMarkup(inline_keyboard=buttons))
    except Exception:
        await callback.message.delete()
        await callback.message.answer(text, parse_mode="Markdown", reply_markup=types.InlineKeyboardMarkup(inline_keyboard=buttons))

@router.callback_query(F.data.startswith("hw_rev:"))
async def view_homework_file(callback: types.CallbackQuery, session: AsyncSession, bot: Bot):
    """Просмотр конкретного файла ДЗ."""
    sub_id = int(callback.data.split(":")[1])
    stmt = select(HomeworkSubmission).where(HomeworkSubmission.id == sub_id).options(selectinload(HomeworkSubmission.student).selectinload(Student.user))
    res = await session.execute(stmt)
    sub = res.scalar_one_or_none()
    
    if not sub:
        await callback.answer("Задание не найдено")
        return

    user = sub.student.user
    caption = f"👤 *Отправил:* {user.full_name}\n💬 *Комментарий:* {sub.text or 'Нет комментария'}\n\nВыберите действие:"
    
    kb = types.InlineKeyboardMarkup(inline_keyboard=[
        [
            types.InlineKeyboardButton(text="✅ Оценить и Принять", callback_data=f"hw_action:{sub.id}:grade"),
        ],
        [
            types.InlineKeyboardButton(text="🔄 На пересдачу", callback_data=f"hw_action:{sub.id}:retry"),
            types.InlineKeyboardButton(text="❌ Отклонить", callback_data=f"hw_action:{sub.id}:rejected")
        ],
        [types.InlineKeyboardButton(text="⬅️ Назад к списку", callback_data="teacher:hw_review")]
    ])
    
    if sub.file_type == "photo":
        await bot.send_photo(callback.from_user.id, photo=sub.file_id, caption=caption, parse_mode="Markdown", reply_markup=kb)
    elif sub.file_type == "text":
        await bot.send_message(callback.from_user.id, text=caption, parse_mode="Markdown", reply_markup=kb)
    else:
        await bot.send_document(callback.from_user.id, document=sub.file_id, caption=caption, parse_mode="Markdown", reply_markup=kb)
    
    await callback.message.delete()
    await callback.answer()

@router.callback_query(F.data.startswith("hw_action:"))
async def start_homework_action(callback: types.CallbackQuery, state: FSMContext):
    """Начало процесса оценки или отклонения ДЗ."""
    _, sub_id, action = callback.data.split(":")
    await state.update_data(sub_id=int(sub_id), hw_action=action)
    
    await callback.message.delete()
    
    from bot.states.teacher import TeacherGradingStates
    
    if action == "grade":
        await callback.message.answer(
            "🔢 *Введите оценку* за это задание (число, например, 5 или 100):\n"
            "_(Или отправьте 0, если оценка не требуется)_",
            parse_mode="Markdown"
        )
        await state.set_state(TeacherGradingStates.waiting_for_grade)
    else:
        status_name = "ПЕРЕСДАЧУ" if action == "retry" else "ОТКЛОНЕНИЕ"
        await callback.message.answer(
            f"✍️ Вы выбрали *{status_name}*.\n\n"
            "Пожалуйста, отправьте **комментарий** ученику. Это может быть текст, голосовое сообщение, фото или документ с пояснениями ошибок:",
            parse_mode="Markdown"
        )
        await state.set_state(TeacherGradingStates.waiting_for_comment)

@router.message(TeacherGradingStates.waiting_for_grade, F.text)
async def process_homework_grade(message: types.Message, state: FSMContext):
    if not message.text.isdigit():
        return await message.answer("❌ Пожалуйста, введите число (например: 5).")
    
    await state.update_data(grade=int(message.text))
    await message.answer(
        "✅ Оценка принята.\n\n"
        "Теперь отправьте **комментарий** ученику (текст, голосовое сообщение, фото) "
        "или отправьте /skip, чтобы принять без комментария."
    )
    from bot.states.teacher import TeacherGradingStates
    await state.set_state(TeacherGradingStates.waiting_for_comment)

@router.message(TeacherGradingStates.waiting_for_comment)
async def process_homework_comment(message: types.Message, state: FSMContext, session: AsyncSession, bot: Bot):
    import logging
    data = await state.get_data()
    sub_id = data.get("sub_id")
    action = data.get("hw_action")
    grade = data.get("grade", None)
    
    if not sub_id:
        await message.answer("Сессия истекла.", reply_markup=get_teacher_main_kb())
        await state.clear()
        return

    comment_text = ""
    file_id = ""
    file_type = ""
    
    if message.text and message.text != "/skip":
        comment_text = message.text
    elif message.voice:
        file_id = message.voice.file_id
        file_type = "voice"
    elif message.photo:
        file_id = message.photo[-1].file_id
        file_type = "photo"
    elif message.video:
        file_id = message.video.file_id
        file_type = "video"
    elif message.document:
        file_id = message.document.file_id
        file_type = "document"
        
    caption = message.caption or ""
    if caption:
        comment_text = caption

    if message.text == "/skip":
        comment_text = "Нет комментариев."

    stmt = select(HomeworkSubmission).where(HomeworkSubmission.id == sub_id).options(
        selectinload(HomeworkSubmission.student).selectinload(Student.user),
        selectinload(HomeworkSubmission.lesson).selectinload(Lesson.group)
    )
    sub = (await session.execute(stmt)).scalar_one_or_none()
    
    if not sub:
        await message.answer("Ошибка: Задание не найдено.")
        await state.clear()
        return

    if action == "grade":
        sub.status = "accepted"
        sub.grade = grade
    else:
        sub.status = action  # "retry" or "rejected"
        
    sub.teacher_comment = f"{file_type}:{file_id}:{comment_text}"
    await session.commit()
    
    status_ru = {
        "accepted": "✅ Твое задание ПРИНЯТО!",
        "retry": "🔄 Твое задание отправлено НА ПЕРЕСДАЧУ.",
        "rejected": "❌ Твое задание ОТКЛОНЕНО."
    }
    
    student_tg_id = sub.student.user.telegram_id
    if student_tg_id:
        group_name = sub.lesson.group.name if sub.lesson and sub.lesson.group else "Неизвестная группа"
        lesson_date = sub.lesson.lesson_date.strftime('%d.%m.%Y') if sub.lesson else ""
        
        notify_text = f"📝 *Результат проверки домашнего задания:*\n\n"
        notify_text += f"👥 *Группа:* {group_name}\n"
        notify_text += f"🕒 *Урок от:* {lesson_date}\n\n"
        notify_text += f"{status_ru[sub.status]}\n"
        
        if grade and grade > 0:
            notify_text += f"⭐ *Оценка:* {grade}\n"
        notify_text += "\n*Комментарий преподавателя:*"
        if comment_text and comment_text != "Нет комментариев.":
            notify_text += f"\n_{comment_text}_"
            
        try:
            if file_id:
                if file_type == "voice":
                    await bot.send_voice(student_tg_id, voice=file_id, caption=notify_text, parse_mode="Markdown")
                elif file_type == "photo":
                    await bot.send_photo(student_tg_id, photo=file_id, caption=notify_text, parse_mode="Markdown")
                elif file_type == "video":
                    await bot.send_video(student_tg_id, video=file_id, caption=notify_text, parse_mode="Markdown")
                elif file_type == "document":
                    await bot.send_document(student_tg_id, document=file_id, caption=notify_text, parse_mode="Markdown")
            else:
                await bot.send_message(student_tg_id, text=notify_text, parse_mode="Markdown")
        except Exception as e:
            logging.error(f"Failed to notify student {student_tg_id}: {e}")
            
    if sub.status == "accepted":
        from bot.services.gamification_service import GamificationService
        await GamificationService(session, bot).check_homework_achievements(sub.student_id, student_tg_id)

    await message.answer(f"✅ Задание обработано! Ученик получил уведомление.", reply_markup=get_teacher_main_kb())
    await state.clear()

@router.callback_query(F.data.startswith("t_hw_set_"))
async def start_assign_homework(callback: types.CallbackQuery, state: FSMContext):
    lesson_id = int(callback.data.split("_")[-1])
    await state.update_data(lesson_id=lesson_id)
    
    await callback.message.edit_text(
        "📝 *Задать домашнее задание*\n\nОтправьте текст задания или ссылки:",
        parse_mode="Markdown",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
            [types.InlineKeyboardButton(text="❌ Отмена", callback_data=f"t_lesson_view_{lesson_id}")]
        ])
    )
    await state.set_state(TeacherLessonStates.waiting_for_homework_text)

@router.message(TeacherLessonStates.waiting_for_homework_text)
async def finalize_assign_homework(message: types.Message, state: FSMContext, session: AsyncSession, bot: Bot):
    data = await state.get_data()
    lesson_id = data["lesson_id"]
    
    stmt = select(Lesson).where(Lesson.id == lesson_id).options(selectinload(Lesson.group))
    lesson = (await session.execute(stmt)).scalar_one()
    
    lesson.homework = message.text
    await session.commit()
    
    stmt_st = select(StudentGroup).where(StudentGroup.group_id == lesson.group_id).options(selectinload(StudentGroup.student).selectinload(Student.user))
    links = (await session.execute(stmt_st)).scalars().all()
    
    count = 0
    from bot.services.notification_service import NotificationService
    notifier = NotificationService(bot)
    for link in links:
        if link.student.user.telegram_id:
            await notifier.notify_user_status_change(
                link.student.user.telegram_id,
                f"📝 *Новое домашнее задание!*\n\nГруппа: {lesson.group.name}\nЗадание:\n{message.text}"
            )
            count += 1

    await message.answer(
        f"✅ Домашнее задание успешно сохранено и отправлено {count} ученикам!",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
            [types.InlineKeyboardButton(text="🔙 Обратно к уроку", callback_data=f"t_lesson_view_{lesson_id}")]
        ])
    )
    await state.clear()
