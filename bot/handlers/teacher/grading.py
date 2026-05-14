import logging
from aiogram import Router, types, F, Bot
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from bot.models.education import HomeworkSubmission, StudentProgress
from bot.models.user import Student
from bot.keyboards.teacher import get_grading_kb, get_teacher_main_kb
from bot.states.teacher import TeacherGradingStates
from bot.services.notification_service import NotificationService

router = Router(name="teacher_grading")
logger = logging.getLogger(__name__)

@router.callback_query(F.data.startswith("hw_rev:"))
async def view_homework_for_grading(callback: types.CallbackQuery, session: AsyncSession, bot: Bot):
    """Детальный просмотр ДЗ с кнопками принятия/оценки."""
    sub_id = int(callback.data.split(":")[1])
    stmt = (
        select(HomeworkSubmission)
        .where(HomeworkSubmission.id == sub_id)
        .options(selectinload(HomeworkSubmission.student).selectinload(Student.user))
    )
    result = await session.execute(stmt)
    sub = result.scalar_one_or_none()
    
    if not sub:
        await callback.answer("Задание не найдено")
        return

    user = sub.student.user
    text = (
        f"📖 *Проверка задания*\n\n"
        f"👤 Ученик: {user.full_name}\n"
        f"💬 Комментарий: {sub.comment or 'нет'}\n"
        f"📅 Отправлено: {sub.created_at.strftime('%d.%m %H:%M')}\n\n"
        f"Выберите оценку для работы:"
    )
    
    # Отправляем файл и клавиатуру с оценками
    kb = get_grading_kb(sub.id)
    
    if sub.file_type == "photo":
        await bot.send_photo(callback.from_user.id, photo=sub.file_id, caption=text, parse_mode="Markdown", reply_markup=kb)
    else:
        await bot.send_document(callback.from_user.id, document=sub.file_id, caption=text, parse_mode="Markdown", reply_markup=kb)
    
    await callback.message.delete()
    await callback.answer()

@router.callback_query(F.data.startswith("hw_set_grade:"))
async def process_grade_selection(callback: types.CallbackQuery, state: FSMContext):
    """Шаг после выбора оценки: запрос комментария."""
    _, _, sub_id, grade = callback.data.split(":")
    await state.update_data(sub_id=int(sub_id), grade=grade)
    
    await callback.message.answer(
        f"⭐ Вы выбрали оценку: *{grade}*\n\nНапишите текстовый отзыв для ученика, "
        f"или воспользуйтесь **Голосовым сообщением** 🎤 (просто запишите аудио прямо здесь).\n\n"
        f"_(отправьте `.` если отзыв вообще не нужен)_",
        parse_mode="Markdown"
    )
    await state.set_state(TeacherGradingStates.waiting_for_comment)
    await callback.answer()

@router.message(TeacherGradingStates.waiting_for_comment, F.text | F.voice)
async def finalize_grading(message: types.Message, state: FSMContext, session: AsyncSession, bot: Bot):
    """Сохранение оценки, уведомление и обновление прогресса."""
    data = await state.get_data()
    sub_id = data['sub_id']
    grade = data['grade']
    
    comment_text = None
    voice_id = None
    
    if message.voice:
        comment_text = "🎤 _Учитель оставил вам голосовой комментарий._"
        voice_id = message.voice.file_id
    else:
        text_val = message.text.strip()
        comment_text = text_val if text_val != "." else "Молодец!"
    
    # 1. Обновляем статус ДЗ
    stmt = (
        select(HomeworkSubmission)
        .where(HomeworkSubmission.id == sub_id)
        .options(selectinload(HomeworkSubmission.student).selectinload(Student.user))
    )
    sub = (await session.execute(stmt)).scalar_one()
    sub.status = "accepted"
    sub.grade = grade
    sub.comment = comment_text if not voice_id else "(Голосовое сообщение)"
    
    await session.commit()
    
    # 2. Уведомляем ученика
    notifier = NotificationService(bot)
    student_tg_id = sub.student.user.telegram_id
    
    msg_text = (
        f"📝 *Ваше задание проверено!*\n\n"
        f"⭐ Оценка: *{grade}*\n"
        f"✉️ Отзыв учителя: {comment_text}\n\n"
        f"Продолжайте в том же духе!"
    )
    
    try:
        await notifier.notify_user_status_change(student_tg_id, msg_text)
        if voice_id:
            await bot.send_voice(student_tg_id, voice_id)
    except Exception as e:
        logger.error(f"Failed to send grading notification: {e}")
    
    await message.answer(f"✅ Оценка {grade} выставлена. Ученик уведомлен.", reply_markup=get_teacher_main_kb())
    await state.clear()
