import logging
from aiogram import Router, types, F
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from bot.models.education import Feedback, Course

router = Router(name="admin_feedback")
logger = logging.getLogger(__name__)

@router.callback_query(F.data == "admin:feedback")
async def view_recent_feedback(callback: types.CallbackQuery, session: AsyncSession):
    """Список последних отзывов с пагинацией."""
    stmt = (
        select(Feedback)
        .options(selectinload(Feedback.user))
        .order_by(Feedback.created_at.desc())
        .limit(20)
    )
    result = await session.execute(stmt)
    feedbacks = result.scalars().all()
    
    if not feedbacks:
        await callback.answer("Отзывов пока нет", show_alert=True)
        return

    text = "💬 *Последние отзывы учеников*\n\n"
    for f in feedbacks:
        stars = "⭐" * f.rating
        text += (
            f"👤 {f.user.full_name}\n"
            f"📊 Оценка: {stars}\n"
            f"💬 {f.comment or 'Без комментария'}\n"
            f"📅 {f.created_at.strftime('%d.%m %H:%M')}\n"
            f"──────────────────\n"
        )
    
    kb = types.InlineKeyboardMarkup(inline_keyboard=[[types.InlineKeyboardButton(text="⬅️ В меню", callback_data="admin:main")]])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)

@router.callback_query(F.data == "admin:rating_stats")
async def view_rating_stats(callback: types.CallbackQuery, session: AsyncSession):
    """Сборная статистика по курсам."""
    stmt = (
        select(Course.name, func.avg(Feedback.rating), func.count(Feedback.id))
        .join(Feedback)
        .group_by(Course.id)
    )
    result = await session.execute(stmt)
    stats = result.all()
    
    if not stats:
        await callback.answer("Статистика еще не собрана")
        return

    text = "📈 *Рейтинг курсов*\n\n"
    for name, avg_rating, count in stats:
        stars = "⭐" * int(avg_rating)
        text += f"🔸 *{name}*: {avg_rating:.1f} {stars} ({count} отз.)\n"
        
    kb = types.InlineKeyboardMarkup(inline_keyboard=[[types.InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:main")]])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
