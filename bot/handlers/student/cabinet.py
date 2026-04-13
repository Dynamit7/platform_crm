import logging
from aiogram import Router, types, F
from aiogram.filters import Command
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from bot.models.user import User, Student
from bot.models.education import StudentProgress, HomeworkSubmission
from bot.keyboards.student import get_student_cabinet_kb, get_back_to_cabinet_kb

router = Router(name="student_cabinet")
logger = logging.getLogger(__name__)

def get_progress_bar(percent: float, length: int = 10) -> str:
    """Генерирует текстовый прогресс-бар."""
    filled_length = int(length * percent // 100)
    bar = "█" * filled_length + "░" * (length - filled_length)
    return f"[{bar}] {percent:.0f}%"

@router.message(Command("cabinet"))
@router.message(F.text == "🎓 Кабинет")
@router.callback_query(F.data == "student:main")
async def show_cabinet(event: types.TelegramObject, db_user: User, session: AsyncSession):
    """Главный экран кабинета со статистикой."""
    from bot.models.user import UserRole
    if db_user.role == UserRole.PENDING:
        msg = "⏳ Ваша заявка еще находится на рассмотрении. Ожидайте подтверждения от администратора."
        if isinstance(event, types.CallbackQuery):
            await event.answer(msg, show_alert=True)
        else:
            await event.answer(msg)
        return

    # Получаем общую статистику ученика
    sub_count_stmt = select(func.count(HomeworkSubmission.id)).join(Student).where(Student.user_id == db_user.id)
    hw_count = await session.scalar(sub_count_stmt) or 0
    
    text = (
        f"🎓 *Личный кабинет ученика*\n\n"
        f"👤 *Имя:* {db_user.full_name}\n"
        f"📊 *Сдано заданий:* `{hw_count}`\n\n"
        f"Выберите раздел для обучения:"
    )
    
    kb = get_student_cabinet_kb()
    if isinstance(event, types.Message):
        await event.answer(text, parse_mode="Markdown", reply_markup=kb)
    else:
        await event.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
        await event.answer()

@router.callback_query(F.data == "student:courses")
async def view_student_courses(callback: types.CallbackQuery, session: AsyncSession, db_user: User):
    """Просмотр курсов с прогресс-барами."""
    stmt = (
        select(StudentProgress)
        .join(Student)
        .where(Student.user_id == db_user.id)
        .options(selectinload(StudentProgress.course))
    )
    result = await session.execute(stmt)
    progresses = result.scalars().all()
    
    if not progresses:
        await callback.message.edit_text("😢 У вас пока нет активных курсов с отслеживанием прогресса.", reply_markup=get_back_to_cabinet_kb())
        return

    text = "📚 *Ваш прогресс по курсам:*\n\n"
    for p in progresses:
        p_bar = get_progress_bar(p.progress_percent or 0.0)
        text += (
            f"🔸 *{p.course.name}*\n"
            f"📊 Прогресс: `{p_bar}`\n"
            f"✅ Посещено уроков: `{p.lessons_attended}/{p.lessons_total or 12}`\n\n"
        )
        
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=get_back_to_cabinet_kb())
