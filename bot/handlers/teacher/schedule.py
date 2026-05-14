from datetime import date
from aiogram import Router, types, F
from sqlalchemy.ext.asyncio import AsyncSession
from bot.models.user import User
from bot.repositories.teacher import TeacherRepository
from bot.keyboards.teacher.schedule import get_week_navigation_kb, get_lessons_list_kb, get_lesson_action_kb

router = Router(name="teacher_schedule")

@router.message(F.text == "📅 Моё расписание")
@router.callback_query(F.data.in_(["teacher_schedule_today", "teacher:schedule"]))
async def show_schedule_today(event: types.TelegramObject, session: AsyncSession, db_user: User):
    target_date = date.today()
    await show_schedule_for_date(event, session, db_user, target_date)


@router.callback_query(F.data.startswith("t_sch_date_"))
async def process_schedule_date(callback: types.CallbackQuery, session: AsyncSession, db_user: User):
    date_str = callback.data.split("_")[-1]
    target_date = date.fromisoformat(date_str)
    await show_schedule_for_date(callback, session, db_user, target_date)


async def show_schedule_for_date(event: types.TelegramObject, session: AsyncSession, db_user: User, target_date: date):
    teacher_repo = TeacherRepository(session)
    teacher = await teacher_repo.get_by_user_id(db_user.id)
    
    if not teacher:
        await event.answer("Профиль преподавателя не найден.")
        return

    lessons = await teacher_repo.get_lessons_for_date(teacher.id, target_date)
    
    date_formatted = target_date.strftime("%d.%m.%Y")
    days_ru = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"]
    day_name = days_ru[target_date.weekday()]
    
    text = f"📅 *Расписание на {day_name} ({date_formatted}):*\n\n"
    if not lessons:
        text += "_Занятий не запланировано._"
    else:
        for l in lessons:
            time_str = l.lesson_time or "--:--"
            text += f"🕒 `{time_str}` — *{l.group.name}*\n"
            text += f"📖 Тема: {l.topic}\n\n"

    kb = get_week_navigation_kb(target_date)
    # Combine with lessons list if needed, or send as separate message
    # For simplicity, we'll update the current message with the day's lessons keyboard
    lessons_kb = get_lessons_list_kb(lessons)
    
    # Merging inline keyboards is a bit tricky, we'll use a combined one in a real scenario
    # or just show the days navigation + the list of lessons for that day below it.
    
    msg = event.message if isinstance(event, types.CallbackQuery) else event
    
    if isinstance(event, types.CallbackQuery):
        # Update existing message
        await event.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
        # We might want to send the lessons list as a separate message or append it
        if lessons:
            await event.message.answer("Выберите урок для управления:", reply_markup=lessons_kb)
    else:
        # New message
        await msg.answer(text, parse_mode="Markdown", reply_markup=kb)
        if lessons:
            await msg.answer("Выберите урок для управления:", reply_markup=lessons_kb)


@router.callback_query(F.data.startswith("t_lesson_view_"))
async def view_lesson_details(callback: types.CallbackQuery, session: AsyncSession):
    lesson_id = int(callback.data.split("_")[-1])
    teacher_repo = TeacherRepository(session)
    lesson = await teacher_repo.get_lesson_by_id(lesson_id)
    
    if not lesson:
        await callback.answer("Урок не найден.")
        return

    text = (
        f"📖 *Детали урока*\n\n"
        f"👥 Группа: *{lesson.group.name}*\n"
        f"📅 Дата: {lesson.lesson_date.strftime('%d.%m.%Y')}\n"
        f"🕒 Время: {lesson.lesson_time or '--:--'}\n"
        f"📚 Тема: {lesson.topic}\n\n"
        f"📝 ДЗ: {lesson.homework or 'Не задано'}\n"
    )
    
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=get_lesson_action_kb(lesson_id))
    await callback.answer()
