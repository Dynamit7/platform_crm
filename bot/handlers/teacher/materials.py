import logging
from aiogram import Router, types, F, Bot
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from bot.models.education import Material, Lesson
from bot.keyboards.common import get_back_button
from aiogram.fsm.context import FSMContext
from bot.states.teacher import TeacherLessonStates
from bot.models.user import Teacher

router = Router(name="teacher_materials")
logger = logging.getLogger(__name__)

@router.callback_query(F.data.startswith("teacher_mats:"))
async def list_materials(callback: types.CallbackQuery, session: AsyncSession):
    """Список материалов для конкретной группы."""
    group_id = int(callback.data.split(":")[1])
    
    stmt = select(Material).where(Material.group_id == group_id).order_by(Material.created_at.desc())
    result = await session.execute(stmt)
    materials = result.scalars().all()
    
    text = "📂 *Учебные материалы группы*\n\n"
    if not materials:
        text += "Файлы пока не загружены."
    
    buttons = []
    for m in materials:
        icon = "📄"
        if m.file_type == "photo": icon = "🖼"
        elif m.file_type == "video": icon = "🎬"
        
        buttons.append([
            types.InlineKeyboardButton(text=f"{icon} {m.title}", callback_data=f"mat_view:{m.id}"),
            types.InlineKeyboardButton(text="🗑", callback_data=f"mat_del_confirm:{m.id}")
        ])
    
    buttons.append([get_back_button(f"teacher_group_view:{group_id}")])
    
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=types.InlineKeyboardMarkup(inline_keyboard=buttons))

@router.callback_query(F.data.startswith("mat_view:"))
async def view_material(callback: types.CallbackQuery, session: AsyncSession, bot: Bot):
    """Просмотр/скачивание файла."""
    mat_id = int(callback.data.split(":")[1])
    stmt = select(Material).where(Material.id == mat_id)
    mat = (await session.execute(stmt)).scalar_one_or_none()
    
    if not mat:
        await callback.answer("Файл не найден")
        return

    # Отправляем файл в зависимости от типа
    if mat.file_type == "photo":
        await bot.send_photo(callback.from_user.id, mat.file_id, caption=f"🖼 {mat.title}")
    elif mat.file_type == "video":
        await bot.send_video(callback.from_user.id, mat.file_id, caption=f"🎬 {mat.title}")
    else:
        await bot.send_document(callback.from_user.id, mat.file_id, caption=f"📄 {mat.title}")
    
    await callback.answer()

@router.callback_query(F.data.startswith("mat_del_confirm:"))
async def confirm_delete(callback: types.CallbackQuery):
    mat_id = int(callback.data.split(":")[1])
    buttons = [
        [
            types.InlineKeyboardButton(text="✅ Да, удалить", callback_data=f"mat_delete_exec:{mat_id}"),
            types.InlineKeyboardButton(text="❌ Отмена", callback_data="teacher:panel")
        ]
    ]
    await callback.message.edit_text("❓ *Вы уверены, что хотите удалить этот материал?*", 
                                    parse_mode="Markdown", 
                                    reply_markup=types.InlineKeyboardMarkup(inline_keyboard=buttons))

@router.callback_query(F.data.startswith("mat_delete_exec:"))
async def delete_material(callback: types.CallbackQuery, session: AsyncSession):
    """Безопасное удаление записи из БД."""
    mat_id = int(callback.data.split(":")[1])
    
    # Проверка прав (преподаватель может удалять только свои или материалы своей группы)
    stmt = delete(Material).where(Material.id == mat_id)
    await session.execute(stmt)
    await session.commit()
    
    await callback.answer("✅ Материал успешно удален", show_alert=True)
    await callback.message.delete()

@router.callback_query(F.data.startswith("t_mat_send_"))
async def start_send_material(callback: types.CallbackQuery, state: FSMContext):
    lesson_id = int(callback.data.split("_")[-1])
    await state.update_data(lesson_id=lesson_id)
    
    await callback.message.edit_text(
        "📚 *Дотрузка материалов*\n\nОтправьте файл в чат (фото, видео или документ).",
        parse_mode="Markdown",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
            [types.InlineKeyboardButton(text="❌ Отмена", callback_data=f"t_lesson_view_{lesson_id}")]
        ])
    )
    await state.set_state(TeacherLessonStates.waiting_for_material_file)

@router.message(TeacherLessonStates.waiting_for_material_file, F.photo | F.document | F.video)
async def finalize_send_material(message: types.Message, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    lesson_id = data["lesson_id"]
    
    stmt = select(Lesson).where(Lesson.id == lesson_id)
    lesson = (await session.execute(stmt)).scalar_one()
    
    stmt_t = select(Teacher).where(Teacher.user_id == message.from_user.id)
    teacher = (await session.execute(stmt_t)).scalar_one()
    
    if message.photo:
        file_id = message.photo[-1].file_id
        file_type = "photo"
    elif message.video:
        file_id = message.video.file_id
        file_type = "video"
    else:
        file_id = message.document.file_id
        file_type = "document"
        
    title = message.caption or (message.document.file_name if message.document else f"Материал к уроку: {lesson.topic}")
    
    mat = Material(
        uploader_id=teacher.id,
        file_id=file_id,
        file_type=file_type,
        title=title,
        group_id=lesson.group_id,
        lesson_id=lesson.id
    )
    session.add(mat)
    await session.commit()
    
    await message.answer(
        "✅ Учебный материал успешно сохранен и привязан к уроку!",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
            [types.InlineKeyboardButton(text="🔙 Обратно к уроку", callback_data=f"t_lesson_view_{lesson_id}")]
        ])
    )
    await state.clear()
