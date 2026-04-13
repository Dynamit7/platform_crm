from aiogram import Router, types, F, Bot
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from bot.models.education import HomeworkSubmission
from bot.models.user import User, Teacher, Student
from bot.keyboards.teacher import get_teacher_main_kb

router = Router(name="teacher_homework")

@router.callback_query(F.data == "teacher:hw_review")
async def list_homeworks_for_review(callback: types.CallbackQuery, session: AsyncSession, db_user: User):
    """Список всех ДЗ, присланных учениками учителю."""
    # Получаем запись учителя
    stmt = select(Teacher).where(Teacher.user_id == db_user.id)
    res = await session.execute(stmt)
    teacher = res.scalar_one_or_none()
    
    if not teacher:
        await callback.answer("Ошибка профиля учителя")
        return

    # Ищем непроверенные ДЗ (pending)
    stmt = (
        select(HomeworkSubmission)
        .options(selectinload(HomeworkSubmission.student).selectinload(Student.user))
        .where(HomeworkSubmission.status == "pending")
        .order_by(HomeworkSubmission.created_at.desc())
        .limit(10)
    )
    res = await session.execute(stmt)
    submissions = res.scalars().all()
    
    if not submissions:
        await callback.message.edit_text("✅ Все домашние задания проверены!", reply_markup=get_teacher_main_kb())
        return

    text = "📚 *Задания на проверку:*\n\nВыберите для просмотра:"
    buttons = []
    for sub in submissions:
        user = sub.student.user
        buttons.append([
            types.InlineKeyboardButton(text=f"📌 {user.full_name} ({sub.created_at.strftime('%d.%m')})", callback_data=f"hw_rev:{sub.id}")
        ])
    
    buttons.append([types.InlineKeyboardButton(text="⬅️ Назад", callback_data="teacher:main")])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=types.InlineKeyboardMarkup(inline_keyboard=buttons))

@router.callback_query(F.data.startswith("hw_rev:"))
async def view_homework_file(callback: types.CallbackQuery, session: AsyncSession, bot: Bot):
    """Просмотр конкретного файла ДЗ."""
    sub_id = int(callback.data.split(":")[1])
    stmt = select(HomeworkSubmission).where(HomeworkSubmission.id == sub_id).options(selectinload(HomeworkSubmission.student).selectinload(Student.user))
    res = await session.execute(stmt)
    sub = res.scalar_one_or_none()
    
    if not sub:
        await callback.answer("Задание не найдено")
        return

    user = sub.student.user
    caption = f"👤 *Отправил:* {user.full_name}\n💬 *Комментарий:* {sub.comment}\n\nВыберите действие:"
    
    kb = types.InlineKeyboardMarkup(inline_keyboard=[
        [
            types.InlineKeyboardButton(text="✅ Принять", callback_data=f"hw_status:{sub.id}:accepted"),
            types.InlineKeyboardButton(text="❌ Отклонить", callback_data=f"hw_status:{sub.id}:rejected")
        ],
        [types.InlineKeyboardButton(text="⬅️ Назад к списку", callback_data="teacher:hw_review")]
    ])
    
    if sub.file_type == "photo":
        await bot.send_photo(callback.from_user.id, photo=sub.file_id, caption=caption, parse_mode="Markdown", reply_markup=kb)
    else:
        await bot.send_document(callback.from_user.id, document=sub.file_id, caption=caption, parse_mode="Markdown", reply_markup=kb)
    
    await callback.message.delete()
    await callback.answer()

@router.callback_query(F.data.startswith("hw_status:"))
async def change_hw_status(callback: types.CallbackQuery, session: AsyncSession, db_user: User):
    """Смена статуса ДЗ (Принято/Отклонено)."""
    _, _, sub_id, status = callback.data.split(":")
    sub_id = int(sub_id)
    
    stmt = select(HomeworkSubmission).where(HomeworkSubmission.id == sub_id)
    res = await session.execute(stmt)
    sub = res.scalar_one_or_none()
    
    if sub:
        sub.status = status
        await session.commit()
        await callback.answer(f"Задание переведено в статус: {status}", show_alert=True)
        
    # Возвращаемся в список
    await list_homeworks_for_review(callback, session, db_user)
