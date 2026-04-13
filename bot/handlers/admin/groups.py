import logging
from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from bot.models.education import Group, Course, Schedule
from bot.keyboards.admin import get_admin_groups_kb
from bot.keyboards.admin_groups import get_days_selection_kb
from bot.states.admin import AdminGroupCreateStates
from bot.utils.schedule_helper import ScheduleHelper

router = Router(name="admin_groups")
logger = logging.getLogger(__name__)

@router.callback_query(F.data == "admin_groups:create")
async def create_group_start(callback: types.CallbackQuery, state: FSMContext, session: AsyncSession):
    stmt = select(Course).where(Course.is_active == True)
    courses = (await session.execute(stmt)).scalars().all()
    
    if not courses:
        await callback.answer("❌ Сначала создайте курс", show_alert=True)
        return

    builder = types.InlineKeyboardMarkup(inline_keyboard=[
        [types.InlineKeyboardButton(text=c.name, callback_data=f"group_sel_course:{c.id}")] for c in courses
    ])
    await callback.message.edit_text("🆕 *Создание группы: Шаг 1*\nВыберите курс:", parse_mode="Markdown", reply_markup=builder)
    await state.set_state(AdminGroupCreateStates.waiting_for_course)

@router.callback_query(AdminGroupCreateStates.waiting_for_course, F.data.startswith("group_sel_course:"))
async def process_course(callback: types.CallbackQuery, state: FSMContext):
    course_id = int(callback.data.split(":")[1])
    await state.update_data(course_id=course_id)
    await callback.message.edit_text("🆕 *Шаг 2:* Введите название группы (например: `ENG-MON-01`):")
    await state.set_state(AdminGroupCreateStates.waiting_for_name)

@router.message(AdminGroupCreateStates.waiting_for_name)
async def process_name(message: types.Message, state: FSMContext):
    await state.update_data(name=message.text, days_mask=0) # Инициализируем маску
    await message.answer(
        "🆕 *Шаг 3: Выберите дни недели*\nНажимайте на дни, чтобы включить/выключить их:",
        parse_mode="Markdown",
        reply_markup=get_days_selection_kb(0)
    )
    await state.set_state(AdminGroupCreateStates.waiting_for_days)

@router.callback_query(AdminGroupCreateStates.waiting_for_days, F.data.startswith("group_day_toggle:"))
async def toggle_day(callback: types.CallbackQuery, state: FSMContext):
    day_val = int(callback.data.split(":")[1])
    data = await state.get_data()
    current_mask = data.get("days_mask", 0)
    
    new_mask = ScheduleHelper.toggle_day(current_mask, day_val)
    await state.update_data(days_mask=new_mask)
    
    readable = ScheduleHelper.get_readable_days(new_mask)
    await callback.message.edit_text(
        f"🆕 *Шаг 3: Выберите дни недели*\nТекущий выбор: *{readable}*",
        parse_mode="Markdown",
        reply_markup=get_days_selection_kb(new_mask)
    )
    await callback.answer()

@router.callback_query(AdminGroupCreateStates.waiting_for_days, F.data == "group_day_save")
async def save_days(callback: types.CallbackQuery, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    if data.get("days_mask", 0) == 0:
        await callback.answer("⚠️ Выберите хотя бы один день!", show_alert=True)
        return

    # Шаг к выбору временного слота
    stmt = select(Schedule).where(Schedule.is_active == True)
    schedules = (await session.execute(stmt)).scalars().all()
    
    builder = types.InlineKeyboardMarkup(inline_keyboard=[
        [types.InlineKeyboardButton(text=f"{s.name} ({s.time_start}-{s.time_end})", callback_data=f"group_sel_sch:{s.id}")] 
        for s in schedules
    ])
    await callback.message.edit_text("🆕 *Шаг 4:* Выберите временной слот:", parse_mode="Markdown", reply_markup=builder)
    await state.set_state(AdminGroupCreateStates.waiting_for_schedule)

@router.callback_query(AdminGroupCreateStates.waiting_for_schedule, F.data.startswith("group_sel_sch:"))
async def process_schedule(callback: types.CallbackQuery, state: FSMContext):
    sch_id = int(callback.data.split(":")[1])
    await state.update_data(schedule_id=sch_id)
    
    # Новый шаг: Выбор типа группы (Групповая или Индивидуальная)
    builder = types.InlineKeyboardMarkup(inline_keyboard=[
        [types.InlineKeyboardButton(text="👥 Групповая (до 15 чел)", callback_data="group_type:15")],
        [types.InlineKeyboardButton(text="👤 Индивидуальная (1 чел)", callback_data="group_type:1")]
    ])
    
    await callback.message.edit_text("🆕 *Шаг 5:* Выберите формат обучения:", parse_mode="Markdown", reply_markup=builder)
    # Нам понадобится новое состояние, добавим его на лету или используем существующее. 
    # В идеале нужно добавить AdminGroupCreateStates.waiting_for_type, но можно обойтись без состояния
    pass

@router.callback_query(F.data.startswith("group_type:"))
async def process_group_type(callback: types.CallbackQuery, state: FSMContext, session: AsyncSession):
    max_students = int(callback.data.split(":")[1])
    data = await state.get_data()
    
    new_group = Group(
        name=data['name'],
        course_id=data['course_id'],
        schedule_id=data['schedule_id'],
        days_bitmask=data['days_mask'],
        max_students=max_students
    )
    session.add(new_group)
    await session.commit()
    
    days_text = ScheduleHelper.get_readable_days(data['days_mask'])
    await callback.message.edit_text(
        f"✅ *Группа создана!*\n\n📍 Название: {data['name']}\n📅 График: {days_text}",
        parse_mode="Markdown",
        reply_markup=get_admin_groups_kb()
    )
    await state.clear()
