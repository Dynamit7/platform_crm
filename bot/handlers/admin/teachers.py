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
        builder.row(types.InlineKeyboardButton(text=f"👤 {t.name} ({t.specialization or '---'})", callback_data=f"admin:teacher_view:{t.id}"))
    
    paginator.add_pagination_buttons(builder)
    builder.row(types.InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:teachers"))
    
    await callback.message.edit_text(
        f"📋 *Список преподавателей ({len(teachers)})*\nСтраница {page}/{paginator.total_pages}",
        parse_mode="Markdown",
        reply_markup=builder.as_markup()
    )

@router.callback_query(F.data == "admin:teacher_add")
async def start_add_teacher(callback: types.CallbackQuery, state: FSMContext):
    await callback.message.edit_text("✍️ Введите ФИО преподавателя:")
    await state.set_state(TeacherAddStates.waiting_for_name)

@router.message(TeacherAddStates.waiting_for_name)
async def process_name(message: types.Message, state: FSMContext):
    await state.update_data(name=message.text)
    await message.answer("📱 Введите номер телефона:")
    await state.set_state(TeacherAddStates.waiting_for_phone)

@router.message(TeacherAddStates.waiting_for_phone)
async def process_phone(message: types.Message, state: FSMContext):
    await state.update_data(phone=message.text)
    await message.answer("🧪 Укажите специализацию (например: Python, Математика, Английский):")
    await state.set_state(TeacherAddStates.waiting_for_specialization)

@router.message(TeacherAddStates.waiting_for_specialization)
async def finalize_teacher_add(message: types.Message, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    service = TeacherService(session)
    
    teacher = await service.create_teacher(
        name=data['name'],
        phone=data['phone'],
        specialization=message.text
    )
    
    await message.answer(f"✅ Преподаватель *{teacher.name}* успешно добавлен!", parse_mode="Markdown", reply_markup=get_teachers_main_kb())
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
    
    res = await session.execute(select(Teacher).where(Teacher.id == teacher_id))
    t = res.scalar_one()
    
    text = (
        f"👨‍🏫 *Инфо о преподавателе*\n\n"
        f"👤 Имя: {t.name}\n"
        f"📱 Тел: {t.phone}\n"
        f"🧪 Специализация: {t.specialization or '---'}\n"
        f"📧 Email: {t.email or '---'}\n"
        f"📅 В базе с: {t.created_at.strftime('%d.%m.%Y')}"
    )
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=get_teacher_view_kb(t.id))
