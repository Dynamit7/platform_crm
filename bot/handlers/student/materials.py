import logging
from aiogram import Router, types, F
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from bot.models.education import Material

router = Router(name="student_materials_view")
logger = logging.getLogger(__name__)

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
