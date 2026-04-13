from aiogram import Router, types, F
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from bot.models.user import User
from bot.models.features import StudentAchievement
from bot.repositories.student import StudentRepository

router = Router(name="student_progress")

@router.message(F.text == "🎓 Мой прогресс")
@router.callback_query(F.data == "st_progress_details")
async def show_progress_and_achievements(event: types.TelegramObject, session: AsyncSession, db_user: User):
    student_repo = StudentRepository(session)
    student = await student_repo.get_by_user_id(db_user.id)
    
    if not student:
        await event.answer("Профиль студента не найден.")
        return

    # Fetch achievements
    stmt = (
        select(StudentAchievement)
        .where(StudentAchievement.student_id == student.id)
        .options(selectinload(StudentAchievement.achievement))
    )
    result = await session.execute(stmt)
    achievements = list(result.scalars().all())

    text = "🎓 *Ваш академический путь*\n\n"
    
    if not achievements:
        text += "🏆 *Достижения*: Вы еще не получили наград. Продолжайте учиться!\n\n"
    else:
        text += "🏆 *Ваши награды:*\n"
        for sa in achievements:
            text += f"{sa.achievement.icon} *{sa.achievement.name}*\n_{sa.achievement.description}_\n\n"

    msg = event.message if isinstance(event, types.CallbackQuery) else event
    await msg.answer(text, parse_mode="Markdown")
    
    if isinstance(event, types.CallbackQuery):
        await event.answer()
