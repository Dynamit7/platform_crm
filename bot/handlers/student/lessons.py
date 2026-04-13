from aiogram import Router, types, F
from sqlalchemy.ext.asyncio import AsyncSession
from bot.models.user import User
from bot.repositories.student import StudentRepository

router = Router(name="student_lessons")

@router.message(F.text == "📅 Расписание")
async def show_upcoming_lessons(message: types.Message, session: AsyncSession, db_user: User):
    student_repo = StudentRepository(session)
    student = await student_repo.get_by_user_id(db_user.id)
    
    if not student:
        await message.answer("Профиль студента не найден.")
        return

    lessons = await student_repo.get_upcoming_lessons(student.id)
    
    if not lessons:
        text = "🏖 *На ближайшее время занятий нет.*\nОтдыхайте и набирайтесь сил!"
    else:
        text = "📅 *Ваши ближайшие занятия:*\n\n"
        for l in lessons:
            date_str = l.lesson_date.strftime("%d.%m")
            time_str = l.lesson_time or "--:--"
            text += f"🔹 *{date_str} {time_str}* — {l.group.name}\n"
            text += f"   📌 Тема: {l.topic}\n\n"

    await message.answer(text, parse_mode="Markdown")
