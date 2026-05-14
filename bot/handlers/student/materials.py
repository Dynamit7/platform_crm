import logging
from aiogram import Router, types, F
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from bot.models.education import Material
from bot.models.user import User

router = Router(name="student_materials_view")
logger = logging.getLogger(__name__)

@router.callback_query(F.data == "student:materials")
async def list_lessons_for_materials(callback: types.CallbackQuery, session: AsyncSession, db_user: User):
    from bot.models.user import Student
    from bot.models.education import StudentGroup, Lesson
    
    stmt = select(Student).where(Student.user_id == db_user.id)
    student = (await session.execute(stmt)).scalar_one_or_none()
    if not student:
        return await callback.answer("Ошибка: Профиль студента не найден.")
    
    groups_stmt = select(StudentGroup.group_id).where(StudentGroup.student_id == student.id, StudentGroup.status == "active")
    group_ids = (await session.execute(groups_stmt)).scalars().all()
    
    from bot.services.finance_service import FinanceService
    finance_service = FinanceService(session)
    if await finance_service.is_student_debtor(student):
        await callback.message.edit_text(
            "❄️ *Доступ ограничен*\n\n"
            "К сожалению, доступ к учебным материалам заморожен. Возможно, у вас имеется задолженность по оплате за обучение или ваш аккаунт временно приостановлен.\n\n"
            "Пожалуйста, свяжитесь с администрацией или проверьте раздел «Оплата».",
            parse_mode="Markdown",
            reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[[types.InlineKeyboardButton(text="⬅️ Назад", callback_data="student:main")]])
        )
        return
    
    if not group_ids:
        text = "ℹ️ Вы пока не состоите ни в одной активной группе."
        buttons = [[types.InlineKeyboardButton(text="⬅️ Назад", callback_data="student:main")]]
        await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=types.InlineKeyboardMarkup(inline_keyboard=buttons))
        return
        
    stmt_l = select(Lesson).where(Lesson.group_id.in_(group_ids)).order_by(Lesson.lesson_date.desc()).limit(10)
    lessons = (await session.execute(stmt_l)).scalars().all()
    
    if not lessons:
        text = "ℹ️ В ваших группах еще не проводились уроки."
        buttons = [[types.InlineKeyboardButton(text="⬅️ Назад", callback_data="student:main")]]
        await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=types.InlineKeyboardMarkup(inline_keyboard=buttons))
        return

    text = "📚 *Учебные материалы*\n\nВыберите урок, чтобы скачать прикрепленные файлы:"
    builder = InlineKeyboardBuilder()
    
    for l in lessons:
        builder.row(types.InlineKeyboardButton(text=f"📌 {l.lesson_date.strftime('%d.%m')} - {l.topic[:20]}", callback_data=f"view_mat:{l.id}"))
        
    builder.row(types.InlineKeyboardButton(text="⬅️ Назад", callback_data="student:main"))
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=builder.as_markup())

@router.callback_query(F.data.startswith("view_mat:"))
async def view_materials_for_lesson(callback: types.CallbackQuery, session: AsyncSession):
    """Список файлов для конкретного урока."""
    lesson_id = int(callback.data.split(":")[1])
    
    stmt = select(Material).where(Material.lesson_id == lesson_id)
    materials = (await session.execute(stmt)).scalars().all()
    
    if not materials:
        await callback.answer("Для этого урока пока нет загруженных файлов", show_alert=True)
        return

    text = "📂 *Доступные материалы:*\nНажмите на файл, чтобы скачать его."
    builder = InlineKeyboardBuilder()
    for m in materials:
        builder.row(types.InlineKeyboardButton(text=f"📄 {m.title}", callback_data=f"download_mat:{m.id}"))
    
    builder.row(types.InlineKeyboardButton(text="⬅️ К списку уроков", callback_data="student:materials"))
    
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=builder.as_markup())

@router.callback_query(F.data.startswith("download_mat:"))
async def download_material(callback: types.CallbackQuery, session: AsyncSession):
    mat_id = int(callback.data.split(":")[1])
    stmt = select(Material).where(Material.id == mat_id)
    material = (await session.execute(stmt)).scalar_one()
    
    await callback.answer("Отправляю файл...")
    
    if material.file_type == "document":
        await callback.message.answer_document(material.file_id, caption=f"📚 {material.title}")
    elif material.file_type == "photo":
        await callback.message.answer_photo(material.file_id, caption=f"🖼 {material.title}")
