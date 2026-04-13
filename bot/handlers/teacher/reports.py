from aiogram import Router, types, F
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from bot.models.education import Attendance
from bot.repositories.teacher import TeacherRepository

router = Router(name="teacher_reports")

@router.callback_query(F.data.startswith("t_rep_gen_"))
async def generate_lesson_report(callback: types.CallbackQuery, session: AsyncSession):
    lesson_id = int(callback.data.split("_")[-1])
    teacher_repo = TeacherRepository(session)
    lesson = await teacher_repo.get_lesson_by_id(lesson_id)
    
    if not lesson:
        await callback.answer("Урок не найден.")
        return

    # Fetch attendance stats
    stmt = select(Attendance.status, func.count(Attendance.id)).where(Attendance.lesson_id == lesson_id).group_by(Attendance.status)
    result = await session.execute(stmt)
    stats = dict(result.all())
    
    present = stats.get("present", 0)
    absent = stats.get("absent", 0)
    late = stats.get("late", 0)
    total = present + absent + late
    
    topic = lesson.topic
    group_name = lesson.group.name
    
    report_text = (
        f"📊 *Отчёт по уроку*\n\n"
        f"👥 Группа: *{group_name}*\n"
        f"📚 Тема: {topic}\n"
        f"📈 Посещаемость: {present}/{total}\n"
        f"❌ Отсутствовало: {absent}\n"
        f"⏳ Опоздало: {late}\n\n"
        f"📝 Домашнее задание: {'Присутствует' if lesson.homework else 'Не задано'}\n"
    )
    
    await callback.message.answer(report_text, parse_mode="Markdown")
    await callback.answer("Отчёт сгенерирован ✅")
