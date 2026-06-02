import logging
from datetime import date, timedelta
from aiogram import Router, types, F
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from bot.models.education import Lesson, Attendance, StudentGroup, Group
from bot.models.user import Teacher, Student
from bot.keyboards.teacher import get_week_navigation_kb, get_lessons_list_kb, get_lesson_action_kb
from bot.services.attendance_service import AttendanceService
from bot.utils.constants import AttendanceStatus

router = Router(name="teacher_schedule")
logger = logging.getLogger(__name__)


@router.callback_query(F.data == "teacher_schedule")
async def teacher_schedule_handler(callback: types.CallbackQuery, session: AsyncSession, db_user):
    today = date.today()
    await show_schedule_for_date(callback, session, db_user, today)


@router.callback_query(F.data == "teacher_schedule_today")
async def teacher_schedule_today_handler(callback: types.CallbackQuery, session: AsyncSession, db_user):
    today = date.today()
    await show_schedule_for_date(callback, session, db_user, today)


@router.callback_query(F.data.startswith("t_sch_date_"))
async def teacher_schedule_by_date(callback: types.CallbackQuery, session: AsyncSession, db_user):
    date_str = callback.data.replace("t_sch_date_", "")
    try:
        target_date = date.fromisoformat(date_str)
    except ValueError:
        await callback.answer("Неверный формат даты", show_alert=True)
        return
    await show_schedule_for_date(callback, session, db_user, target_date)


async def show_schedule_for_date(callback: types.CallbackQuery, session: AsyncSession, db_user, target_date: date):
    stmt = select(Teacher).where(Teacher.user_id == db_user.id)
    teacher = (await session.execute(stmt)).scalar_one_or_none()

    if not teacher:
        await callback.answer("Профиль преподавателя не найден", show_alert=True)
        return

    stmt = select(Lesson).where(
        Lesson.teacher_id == teacher.id,
        Lesson.lesson_date == target_date
    ).options(selectinload(Lesson.group))
    lessons = (await session.execute(stmt)).scalars().all()

    weekday_names = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"]
    text = (f"📅 *{target_date.strftime('%d.%m.%Y')} ({weekday_names[target_date.weekday()]})*\n"
            f"――――――――――――――――――\n")

    if lessons:
        for lesson in lessons:
            time_str = lesson.lesson_time or "--:--"
            text += f"🕐 *{time_str}* | {lesson.group.name}\n"
            text += f"📖 {lesson.topic[:40]}\n\n"
    else:
        text += "🎉 Занятий нет\n"

    nav_kb = get_week_navigation_kb(target_date)
    lessons_kb = get_lessons_list_kb(lessons)
    combined = nav_kb.inline_keyboard + lessons_kb.inline_keyboard
    full_kb = types.InlineKeyboardMarkup(inline_keyboard=combined)

    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=full_kb)


@router.callback_query(F.data.startswith("t_lesson_view_"))
async def teacher_lesson_view(callback: types.CallbackQuery, session: AsyncSession):
    lesson_id = int(callback.data.split("_")[-1])

    stmt = select(Lesson).where(Lesson.id == lesson_id).options(
        selectinload(Lesson.group).selectinload(Group.course)
    )
    lesson = (await session.execute(stmt)).scalar_one_or_none()

    if not lesson:
        await callback.answer("Урок не найден", show_alert=True)
        return

    service = AttendanceService(session)
    stats = await service.get_lesson_stats(lesson_id)

    stmt_sg = select(StudentGroup).where(StudentGroup.group_id == lesson.group_id)
    student_links = (await session.execute(stmt_sg)).scalars().all()
    total_students = len(student_links)

    text = (f"📖 *Детали урока*\n"
            f"――――――――――――――――――\n"
            f"👥 Группа: `{lesson.group.name}`\n"
            f"📅 Дата: `{lesson.lesson_date.strftime('%d.%m.%Y')}`\n"
            f"🕐 Время: `{lesson.lesson_time or '--:--'}`\n"
            f"📌 Тема: `{lesson.topic}`\n\n"
            f"📊 Посещаемость:\n"
            f"✅ Присутствовало: `{stats.get('present', 0) + stats.get('late', 0)}/{total_students}`\n"
            f"❌ Отсутствовало: `{stats.get('absent', 0)}`\n")

    if lesson.homework:
        text += f"\n📝 ДЗ: {lesson.homework[:50]}..."

    await callback.message.edit_text(
        text,
        parse_mode="Markdown",
        reply_markup=get_lesson_action_kb(lesson_id)
    )


@router.callback_query(F.data.startswith("t_att_start_"))
async def teacher_att_start_underscore(callback: types.CallbackQuery, session: AsyncSession):
    lesson_id = int(callback.data.split("_")[-1])

    stmt = select(Lesson).where(Lesson.id == lesson_id).options(selectinload(Lesson.group))
    lesson = (await session.execute(stmt)).scalar_one()

    stmt = (
        select(StudentGroup)
        .where(StudentGroup.group_id == lesson.group_id)
        .options(selectinload(StudentGroup.student).selectinload(Student.user))
    )
    student_links = (await session.execute(stmt)).scalars().all()

    service = AttendanceService(session)
    stats = await service.get_lesson_stats(lesson_id)

    stmt_att = select(Attendance).where(Attendance.lesson_id == lesson_id)
    att_records = (await session.execute(stmt_att)).scalars().all()
    att_dict = {a.student_id: a.status for a in att_records}

    text = (
        f"📝 *Перекличка*\n"
        f"📖 Урок: `{lesson.topic}`\n"
        f"📅 Дата: `{lesson.lesson_date.strftime('%d.%m')}`\n\n"
        f"📊 Присутствует: `{stats.get('present', 0) + stats.get('late', 0)}/{len(student_links)}`\n"
        f"❌ Отсутствует: `{stats.get('absent', 0)}`\n\n"
        f"Нажмите на ученика, чтобы изменить статус:"
    )

    buttons = []
    for link in student_links:
        status = att_dict.get(link.student_id)
        icon = AttendanceStatus.ICONS.get(status, AttendanceStatus.ICONS[None])
        buttons.append([
            types.InlineKeyboardButton(
                text=f"{icon} {link.student.user.full_name}",
                callback_data=f"t_att_pick:{lesson_id}:{link.student_id}"
            )
        ])

    buttons.append([types.InlineKeyboardButton(text="✅ Завершить", callback_data=f"t_group:{lesson.group_id}")])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=types.InlineKeyboardMarkup(inline_keyboard=buttons))


@router.callback_query(F.data.startswith("t_rep_gen_"))
async def teacher_lesson_report(callback: types.CallbackQuery, session: AsyncSession):
    lesson_id = int(callback.data.split("_")[-1])

    stmt = select(Lesson).where(Lesson.id == lesson_id).options(selectinload(Lesson.group))
    lesson = (await session.execute(stmt)).scalar_one_or_none()

    if not lesson:
        await callback.answer("Урок не найден", show_alert=True)
        return

    service = AttendanceService(session)
    stats = await service.get_lesson_stats(lesson_id)

    stmt_sg = (
        select(StudentGroup)
        .where(StudentGroup.group_id == lesson.group_id)
        .options(selectinload(StudentGroup.student).selectinload(Student.user))
    )
    student_links = (await session.execute(stmt_sg)).scalars().all()
    total = len(student_links)

    present = stats.get("present", 0)
    absent = stats.get("absent", 0)
    late = stats.get("late", 0)

    text = (f"📊 *Отчёт по уроку*\n"
            f"――――――――――――――――――\n"
            f"📖 Тема: `{lesson.topic}`\n"
            f"👥 Группа: `{lesson.group.name}`\n"
            f"📅 Дата: `{lesson.lesson_date.strftime('%d.%m.%Y')}`\n\n"
            f"*Статистика посещаемости:*\n"
            f"👤 Всего учеников: `{total}`\n"
            f"✅ Присутствовало: `{present}`\n"
            f"⏳ Опоздало: `{late}`\n"
            f"❌ Отсутствовало: `{absent}`\n"
            f"📈 Посещаемость: `{((present + late) / total * 100) if total > 0 else 0:.1f}%`\n\n")

    text += "*Список учеников:*\n"
    for link in student_links:
        stmt_a = select(Attendance).where(
            Attendance.lesson_id == lesson_id,
            Attendance.student_id == link.student_id
        )
        att = (await session.execute(stmt_a)).scalar_one_or_none()
        if att and att.status == "present":
            status_str = "✅"
        elif att and att.status == "late":
            status_str = "⏳"
        elif att and att.status == "absent":
            status_str = "❌"
        else:
            status_str = "⚪️"
        text += f"{status_str} {link.student.user.full_name}\n"

    await callback.message.edit_text(
        text,
        parse_mode="Markdown",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
            [types.InlineKeyboardButton(text="⬅️ К уроку", callback_data=f"t_lesson_view_{lesson_id}")]
        ])
    )
