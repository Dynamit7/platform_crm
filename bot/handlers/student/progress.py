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
@router.callback_query(F.data == "st_achievements")
async def show_progress_and_achievements(event: types.TelegramObject, session: AsyncSession, db_user: User):
    student_repo = StudentRepository(session)
    student = await student_repo.get_by_user_id(db_user.id)
    
    if not student:
        error_msg = "Профиль студента не найден."
        if isinstance(event, types.CallbackQuery):
            await event.answer(error_msg, show_alert=True)
        else:
            await event.message.answer(error_msg)
        return

    # Fetch achievements
    stmt = (
        select(StudentAchievement)
        .where(StudentAchievement.student_id == student.id)
        .options(selectinload(StudentAchievement.achievement))
    )
    result = await session.execute(stmt)
    achievements = list(result.scalars().all())
    
    total_xp = sum([sa.achievement.xp_reward for sa in achievements if getattr(sa.achievement, 'xp_reward', None)])
    
    rank = "🌱 Новичок"
    if total_xp >= 50: rank = "⚡️ Энтузиаст"
    if total_xp >= 150: rank = "🔥 Специалист"
    if total_xp >= 300: rank = "💎 Мастер"

    text = (
        f"🎮 *Ваш игровой профиль*\n"
        f"――――――――――――――――\n"
        f"🌟 Уровень: {rank}\n"
        f"🔮 Опыт: `{total_xp} XP`\n\n"
    )
    
    if not achievements:
        text += "🏆 *Достижения:*\n_Сдавайте домашние задания, чтобы получать опыт и награды!_\n\n"
    else:
        text += "🏆 *Ваши награды:*\n"
        for sa in achievements:
            text += f"{sa.achievement.icon} *{sa.achievement.name}* \n   _{sa.achievement.description}_\n"

    from bot.keyboards.student import get_back_to_cabinet_kb
    kb = get_back_to_cabinet_kb()

    if isinstance(event, types.CallbackQuery):
        await event.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
        await event.answer()
    else:
        await event.answer(text, parse_mode="Markdown", reply_markup=kb)

@router.callback_query(F.data == "st_leaderboard")
async def show_global_leaderboard(callback: types.CallbackQuery, session: AsyncSession):
    # Fetch all students and left-join their achievements
    from bot.models.user import Student, User
    from sqlalchemy import func, desc
    
    # We want sum of xp_reward for each student.
    # But since it's sqlite and relationships might be tricky to sum purely in query due to architecture,
    # let's just fetch all StudentAchievements with their achievement joined, and group by Python.
    # It's an MVP, calculating in memory for top 5 is fine.
    
    stmt = select(StudentAchievement).options(selectinload(StudentAchievement.achievement), selectinload(StudentAchievement.student).selectinload(Student.user))
    all_sa = (await session.execute(stmt)).scalars().all()
    
    xp_map = {}
    for sa in all_sa:
        if sa.student and sa.student.user and sa.achievement:
            uid = sa.student.user.id
            xp_map[uid] = xp_map.get(uid, {'name': sa.student.user.full_name, 'xp': 0})
            amount = getattr(sa.achievement, 'xp_reward', 0)
            if amount:
                xp_map[uid]['xp'] += amount
                
    # Sort by xp descending
    sorted_students = sorted(xp_map.values(), key=lambda x: x['xp'], reverse=True)
    top_5 = sorted_students[:5]
    
    text = "🏆 *Зал Славы (Топ-5 учеников)* 🏆\n\n"
    if not top_5:
        text += "_Пока никто не заработал достижений. Будьте первыми!_"
    else:
        medals = ["🥇", "🥈", "🥉", "🏅", "🏅"]
        for i, st in enumerate(top_5):
            text += f"{medals[i]} *{st['name']}* — `{st['xp']} XP`\n"
            
    text += "\n_Выполняйте домашние задания, чтобы заработать опыт и попасть в Топ!_"
    
    from bot.keyboards.student import get_back_to_cabinet_kb
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=get_back_to_cabinet_kb())
