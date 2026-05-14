import logging
from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy.ext.asyncio import AsyncSession

from bot.services.teacher_service import TeacherService
from bot.keyboards.admin_teachers import get_teachers_main_kb, get_teacher_view_kb
from bot.utils.pagination import Paginator
from aiogram.utils.keyboard import InlineKeyboardBuilder

router = Router(name="admin_teachers")
logger = logging.getLogger(__name__)

class TeacherAddStates(StatesGroup):
    waiting_for_name = State()
    waiting_for_phone = State()
    waiting_for_specialization = State()

@router.callback_query(F.data == "admin:teachers")
async def show_teachers_menu(callback: types.CallbackQuery):
    """Главный экран управления преподавателями."""
    await callback.message.edit_text(
        "👨‍🏫 *Управление преподавателями*\n\nВыберите действие из меню ниже:",
        parse_mode="Markdown",
        reply_markup=get_teachers_main_kb()
    )

@router.callback_query(F.data.startswith("admin:teachers_list:"))
async def list_teachers(callback: types.CallbackQuery, session: AsyncSession):
    """Список преподавателей с пагинацией."""
    page = int(callback.data.split(":")[2])
    service = TeacherService(session)
    teachers = await service.get_all_teachers()
    
    if not teachers:
        await callback.answer("Учителя еще не добавлены в базу")
        return

    paginator = Paginator(teachers, page=page, limit=10, callback_prefix="admin:teachers_list")
    items = paginator.get_page_items()
    
    builder = InlineKeyboardBuilder()
    for t in items:
        # t.user.full_name instead of t.name
        teacher_name = t.user.full_name if t.user else f"ID {t.id}"
        builder.row(types.InlineKeyboardButton(text=f"👤 {teacher_name} ({t.specialization or '---'})", callback_data=f"admin:teacher_view:{t.id}"))
    
    paginator.add_pagination_buttons(builder)
    builder.row(types.InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:teachers"))
    
    await callback.message.edit_text(
        f"📋 *Список преподавателей ({len(teachers)})*\nСтраница {page}/{paginator.total_pages}",
        parse_mode="Markdown",
        reply_markup=builder.as_markup()
    )

@router.callback_query(F.data == "admin:teacher_add")
async def start_add_teacher(callback: types.CallbackQuery, state: FSMContext):
    await callback.message.edit_text(
        "ℹ️ *Как добавить нового преподавателя:*\n\n"
        "1. Попросите преподавателя запустить бота и пройти базовую регистрацию.\n"
        "2. Зайдите в Главном Меню в раздел *Поиск ученика/пользователя*.\n"
        "3. Найдите его по имени или номеру телефона.\n"
        "4. Нажмите *👨‍🏫 Сделать учителем*.\n\n"
        "После этого он появится в этом списке и получит панель преподавателя.",
        parse_mode="Markdown",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[[types.InlineKeyboardButton(text="⬅️ Понятно, назад", callback_data="admin:teachers")]])
    )
    await state.clear()

@router.callback_query(F.data.startswith("admin:teacher_del:"))
async def delete_teacher(callback: types.CallbackQuery, session: AsyncSession):
    teacher_id = int(callback.data.split(":")[2])
    service = TeacherService(session)
    await service.delete_teacher(teacher_id)
    await callback.answer("✅ Преподаватель удален (архивирован)", show_alert=True)
    await list_teachers(callback, session)

@router.callback_query(F.data.startswith("admin:teacher_view:"))
async def view_teacher_details(callback: types.CallbackQuery, session: AsyncSession):
    teacher_id = int(callback.data.split(":")[2])
    from bot.models.user import Teacher
    from sqlalchemy import select
    
    from sqlalchemy.orm import selectinload
    res = await session.execute(select(Teacher).options(selectinload(Teacher.user)).where(Teacher.id == teacher_id))
    t = res.scalar_one()
    
    t_name = t.user.full_name if t.user else "Удален"
    t_phone = t.user.phone if t.user else "Нет"
    t_email = t.user.email if t.user else "Нет"
    
    text = (
        f"👨‍🏫 *Инфо о преподавателе*\n\n"
        f"👤 Имя: {t_name}\n"
        f"📱 Тел: {t_phone}\n"
        f"🧪 Специализация: {t.specialization or '---'}\n"
        f"📧 Email: {t_email}\n"
        f"📅 В базе с: {t.groups[0].created_at.strftime('%d.%m.%Y') if hasattr(t, 'groups') and t.groups else '--.--.----'}"
    )
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=get_teacher_view_kb(t.id))
