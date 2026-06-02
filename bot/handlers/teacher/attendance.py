import logging
from aiogram import Router, types, F
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from bot.models.education import StudentGroup, Attendance, Lesson
from bot.models.user import Student
from bot.keyboards.teacher import get_teacher_lessons_kb, get_attendance_status_kb
from bot.services.attendance_service import AttendanceService
from bot.utils.constants import AttendanceStatus

router = Router(name="teacher_attendance")
logger = logging.getLogger(__name__)

@router.callback_query(F.data.startswith("t_att_lessons:"))
async def list_group_lessons(callback: types.CallbackQuery, session: AsyncSession):
    group_id = int(callback.data.split(":")[1])
    stmt = select(Lesson).where(Lesson.group_id == group_id).order_by(Lesson.lesson_date.desc()).limit(5)
    result = await session.execute(stmt)
    lessons = result.scalars().all()
    
    if not lessons:
        await callback.answer("У этой группы еще нет запланированных уроков", show_alert=True)
        return

    await callback.message.edit_text(
        "📝 *Выбор урока для переклички:*\nВыберите занятие из списка:",
        parse_mode="Markdown",
        reply_markup=get_teacher_lessons_kb(lessons, group_id)
    )

@router.callback_query(F.data.startswith("t_att_start:"))
async def show_attendance_list(callback: types.CallbackQuery, session: AsyncSession):
    lesson_id = int(callback.data.split(":")[1])
    
    stmt = select(Lesson).where(Lesson.id == lesson_id).options(selectinload(Lesson.group))
    lesson = (await session.execute(stmt)).scalar_one()
    
    stmt = (
        select(StudentGroup)
        .where(StudentGroup.group_id == lesson.group_id)
        .options(selectinload(StudentGroup.student).selectinload(Student.user))
    )
    student_links = (await session.execute(stmt)).scalars().all()
    
    # Используем сервис для получения статистики
    service = AttendanceService(session)
    stats = await service.get_lesson_stats(lesson_id)
    
    # Получаем статусы учеников
    stmt_att = select(Attendance).where(Attendance.lesson_id == lesson_id)
    att_records = (await session.execute(stmt_att)).scalars().all()
    att_dict = {a.student_id: a.status for a in att_records}
    
    text = (
        f"📝 *Перекличка*\n"
        f"📖 Урок: `{lesson.topic}`\n"
        f"📅 Дата: `{lesson.lesson_date.strftime('%d.%m')}`\n\n"
        f"📊 Присутствует: `{stats['present'] + stats['late']}/{len(student_links)}`\n"
        f"❌ Отсутствует: `{stats['absent']}`\n\n"
        f"Нажмите на ученика, чтобы изменить статус:"
    )
    
    buttons = []
    for link in student_links:
        user_id = link.student.user_id
        status = att_dict.get(user_id)
        icon = AttendanceStatus.ICONS.get(status, AttendanceStatus.ICONS[None])
        buttons.append([
            types.InlineKeyboardButton(
                text=f"{icon} {link.student.user.full_name}", 
                callback_data=f"t_att_pick:{lesson_id}:{user_id}"
            )
        ])
    
    buttons.append([types.InlineKeyboardButton(text="✅ Завершить", callback_data=f"t_group:{lesson.group_id}")])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=types.InlineKeyboardMarkup(inline_keyboard=buttons))

@router.callback_query(F.data.startswith("t_att_pick:"))
async def pick_status(callback: types.CallbackQuery):
    _, lesson_id, student_id = callback.data.split(":")
    await callback.message.edit_reply_markup(reply_markup=get_attendance_status_kb(int(lesson_id), int(student_id)))

@router.callback_query(F.data.startswith("att_set:"))
async def set_attendance_status(callback: types.CallbackQuery, session: AsyncSession):
    _, lesson_id, student_id, status = callback.data.split(":")
    
    service = AttendanceService(session)
    await service.mark_attendance(int(lesson_id), int(student_id), status)
    
    # Автоматическое уведомление об отсутствии
    if status == "absent":
        stmt = select(Student).where(Student.user_id == int(student_id)).options(selectinload(Student.user))
        student = (await session.execute(stmt)).scalar_one_or_none()
        
        stmt_l = select(Lesson).where(Lesson.id == int(lesson_id))
        lesson = (await session.execute(stmt_l)).scalar_one_or_none()
        
        if student and student.user and lesson:
            from bot.services.notification_service import NotificationService
            notifier = NotificationService(callback.bot)
            try:
                await notifier.notify_user_status_change(
                    student.user.telegram_id,
                    f"⚠️ *Отметка об отсутствии*\n\n"
                    f"Преподаватель отметил, что вас нет на занятии:\n"
                    f"📖 Тема: `{lesson.topic}`\n"
                    f"Если это ошибка, обратитесь к преподавателю."
                )
            except Exception as e:
                logger.error(f"Failed to send absent alert to {student.id}: {e}")
                
    rate = await service.get_student_attendance_rate(int(student_id))
    await callback.answer(f"✅ Статус: {status}\nОбщая посещаемость ученика: {rate:.1f}%")
    
    await show_attendance_list(callback, session)

@router.callback_query(F.data.startswith("t_att_save_"))
async def save_attendance_and_exit(callback: types.CallbackQuery, session: AsyncSession):
    lesson_id = int(callback.data.split("_")[-1])
    stmt = select(Lesson).where(Lesson.id == lesson_id).options(selectinload(Lesson.group))
    lesson = (await session.execute(stmt)).scalar_one_or_none()
    if not lesson:
        await callback.answer("Урок не найден", show_alert=True)
        return
    group_id = lesson.group_id
    await callback.answer("✅ Посещаемость сохранена!", show_alert=True)
    await callback.message.edit_text(
        f"📖 *Урок*\nГруппа: `{lesson.group.name}`\nДата: `{lesson.lesson_date.strftime('%d.%m.%Y')}`\n\nПосещаемость сохранена.",
        parse_mode="Markdown",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
            [types.InlineKeyboardButton(text="⬅️ К уроку", callback_data=f"t_lesson_view_{lesson_id}")],
            [types.InlineKeyboardButton(text="👥 К группе", callback_data=f"t_group:{group_id}")]
        ])
    )
