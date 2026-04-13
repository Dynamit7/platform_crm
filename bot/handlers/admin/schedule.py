import logging
from datetime import datetime
from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from aiogram.utils.keyboard import InlineKeyboardBuilder

from bot.models.education import Group, Lesson
from bot.models.user import User, UserRole
from bot.keyboards.admin import get_admin_schedule_main_kb, get_lesson_manage_kb
from bot.states.admin import AdminScheduleStates
from bot.services.schedule_service import ScheduleService

router = Router(name="admin_schedule")
logger = logging.getLogger(__name__)

# --- ОТОБРАЖЕНИЕ РАСПИСАНИЯ ---

@router.callback_query(F.data == "admin:schedule")
async def show_schedule_main(callback: types.CallbackQuery):
    """Главная страница модуля расписания."""
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(text="🗓 Все уроки", callback_data="admin_sch:list_all"))
    builder.row(types.InlineKeyboardButton(text="➕ Создать урок вручную", callback_data="admin_sch:add_start"))
    builder.row(types.InlineKeyboardButton(text="⚡ Генерировать на месяц", callback_data="admin_sch:bulk_confirm"))
    builder.row(types.InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:main"))
    
    await callback.message.edit_text(
        "📅 *Управление расписанием*\n\nЗдесь вы можете планировать отдельные занятия или запустить автоматическую генерацию сетки для всех групп разом.",
        parse_mode="Markdown",
        reply_markup=builder.as_markup()
    )
    await callback.answer()

@router.callback_query(F.data == "admin_sch:bulk_confirm")
async def bulk_generate_confirm(callback: types.CallbackQuery):
    builder = InlineKeyboardBuilder()
    builder.row(
        types.InlineKeyboardButton(text="✅ Подтвердить", callback_data="admin_sch:bulk_exec"),
        types.InlineKeyboardButton(text="❌ Отмена", callback_data="admin:schedule")
    )
    await callback.message.edit_text(
        "⚡ *Массовая генерация занятий*\n\nБот проанализирует расписание всех групп и создаст уроки на 30 дней вперед.\nДубликаты существующих уроков созданы не будут.\n\nПродолжить?",
        parse_mode="Markdown",
        reply_markup=builder.as_markup()
    )

@router.callback_query(F.data == "admin_sch:bulk_exec")
async def bulk_generate_exec(callback: types.CallbackQuery, session: AsyncSession):
    service = ScheduleService(session)
    created, skipped = await service.generate_for_all_active_groups()
    
    await callback.message.answer(
        f"✅ *Генерация завершена!*\n\nСоздано новых уроков: {created}\nПропущено (уже были): {skipped}",
        parse_mode="Markdown"
    )
    await callback.answer()
    await show_schedule_main(callback)

@router.callback_query(F.data == "admin_sch:list_all")
async def list_all_lessons(callback: types.CallbackQuery, session: AsyncSession):
    """Список всех ближайших уроков."""
    stmt = (
        select(Lesson)
        .options(selectinload(Lesson.group))
        .order_by(Lesson.lesson_date.asc())
        .limit(20)
    )
    result = await session.execute(stmt)
    lessons = result.scalars().all()
    
    if not lessons:
        await callback.message.edit_text(
            "📅 *Расписание пусто.*\n\nЗапланированных занятий не найдено.",
            parse_mode="Markdown",
            reply_markup=get_admin_schedule_main_kb()
        )
        return

    text = "🗓 *Ближайшие занятия:* \n\n"
    buttons = []
    for l in lessons:
        text += (
            f"🔹 {l.lesson_date.strftime('%d.%m')} | {l.lesson_time or '--:--'}\n"
            f"📍 {l.group.name} | {l.topic[:20]}...\n\n"
        )
        buttons.append([types.InlineKeyboardButton(text=f"⚙️ Упр. уроком {l.id}", callback_data=f"lesson_view:{l.id}")])

    buttons.append([types.InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:schedule")])
    
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=types.InlineKeyboardMarkup(inline_keyboard=buttons))
    await callback.answer()

@router.callback_query(F.data.startswith("lesson_view:"))
async def view_lesson_details(callback: types.CallbackQuery, session: AsyncSession):
    lesson_id = int(callback.data.split(":")[1])
    stmt = select(Lesson).where(Lesson.id == lesson_id).options(selectinload(Lesson.group))
    lesson = (await session.execute(stmt)).scalar_one_or_none()
    
    if not lesson:
        await callback.answer("Урок не найден")
        return

    text = (
        f"📖 *Детали урока ID {lesson.id}*\n\n"
        f"📍 Группа: `{lesson.group.name}`\n"
        f"📅 Дата: `{lesson.lesson_date.strftime('%d.%m.%Y')}`\n"
        f"🕒 Время: `{lesson.lesson_time}`\n"
        f"📝 Тема: {lesson.topic}"
    )
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=get_lesson_manage_kb(lesson.id))

@router.callback_query(F.data.startswith("lesson_delete:"))
async def delete_lesson(callback: types.CallbackQuery, session: AsyncSession):
    lesson_id = int(callback.data.split(":")[1])
    await session.execute(delete(Lesson).where(Lesson.id == lesson_id))
    await session.commit()
    await callback.answer("✅ Урок удален", show_alert=True)
    await list_all_lessons(callback, session)

# --- МАСТЕР СОЗДАНИЯ УРОКА ВРУЧНУЮ ---

@router.callback_query(F.data == "admin_sch:add_start")
async def add_lesson_step1(callback: types.CallbackQuery, state: FSMContext, session: AsyncSession):
    stmt = select(Group).where(Group.is_active == True)
    groups = (await session.execute(stmt)).scalars().all()
    
    if not groups:
        await callback.answer("❌ Нет активных групп", show_alert=True)
        return

    builder = InlineKeyboardBuilder()
    for g in groups:
        builder.row(types.InlineKeyboardButton(text=f"👥 {g.name}", callback_data=f"sch_set_group:{g.id}"))
    builder.row(types.InlineKeyboardButton(text="❌ Отмена", callback_data="admin_sch:list_all"))
    
    await callback.message.edit_text("🆕 *Шаг 1: Выберите группу*", parse_mode="Markdown", reply_markup=builder.as_markup())
    await state.set_state(AdminScheduleStates.waiting_for_group)

@router.callback_query(AdminScheduleStates.waiting_for_group, F.data.startswith("sch_set_group:"))
async def add_lesson_step2_teachers(callback: types.CallbackQuery, state: FSMContext, session: AsyncSession):
    group_id = int(callback.data.split(":")[1])
    await state.update_data(group_id=group_id)
    
    stmt = select(User).where(User.role == UserRole.TEACHER)
    teachers = (await session.execute(stmt)).scalars().all()
    
    builder = InlineKeyboardBuilder()
    for t in teachers:
        builder.row(types.InlineKeyboardButton(text=f"👨‍🏫 {t.full_name}", callback_data=f"sch_set_teacher:{t.id}"))
    
    await callback.message.edit_text("🆕 *Шаг 2: Выберите преподавателя*", parse_mode="Markdown", reply_markup=builder.as_markup())
    await state.set_state(AdminScheduleStates.waiting_for_teacher)

@router.callback_query(AdminScheduleStates.waiting_for_teacher, F.data.startswith("sch_set_teacher:"))
async def add_lesson_step3_topic(callback: types.CallbackQuery, state: FSMContext):
    teacher_id = int(callback.data.split(":")[1])
    await state.update_data(teacher_id=teacher_id)
    await callback.message.edit_text("🆕 *Шаг 3: Введите тему занятия*")
    await state.set_state(AdminScheduleStates.waiting_for_topic)

@router.message(AdminScheduleStates.waiting_for_topic)
async def add_lesson_step4_date(message: types.Message, state: FSMContext):
    await state.update_data(topic=message.text)
    await message.answer("🆕 *Шаг 4: Введите дату (ДД.ММ.ГГГГ)*\nНапример: `25.10.2026`", parse_mode="Markdown")
    await state.set_state(AdminScheduleStates.waiting_for_date)

@router.message(AdminScheduleStates.waiting_for_date)
async def add_lesson_step5_time(message: types.Message, state: FSMContext):
    try:
        dt = datetime.strptime(message.text, "%d.%m.%Y").date()
        await state.update_data(lesson_date=dt)
    except ValueError:
        await message.answer("❌ Неверный формат даты. Используйте `ДД.ММ.ГГГГ`")
        return

    await message.answer("🆕 *Шаг 5: Введите время (ЧЧ:ММ)*\nНапример: `18:30`", parse_mode="Markdown")
    await state.set_state(AdminScheduleStates.waiting_for_time)

@router.message(AdminScheduleStates.waiting_for_time)
async def add_lesson_finish(message: types.Message, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    lesson_time = message.text
    
    new_lesson = Lesson(
        group_id=data['group_id'],
        teacher_id=data['teacher_id'],
        topic=data['topic'],
        lesson_date=data['lesson_date'],
        lesson_time=lesson_time
    )
    session.add(new_lesson)
    await session.commit()
    
    await message.answer("✅ Урок успешно добавлен!", reply_markup=get_admin_schedule_main_kb())
    await state.clear()
