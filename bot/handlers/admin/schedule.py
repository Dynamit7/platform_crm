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
async def list_all_schedule_courses(callback: types.CallbackQuery, session: AsyncSession):
    from bot.models.education import Course, Group
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    from sqlalchemy import func
    
    # Step 1: Courses
    stmt = select(Course).where(Course.is_active == True)
    courses = (await session.execute(stmt)).scalars().all()
    
    if not courses:
        return await callback.message.edit_text("Нет активных курсов.", reply_markup=get_admin_schedule_main_kb())
        
    builder = InlineKeyboardBuilder()
    for c in courses:
        # Get active groups count
        g_count = await session.scalar(select(func.count(Group.id)).where(Group.course_id == c.id, Group.is_active == True))
        builder.row(types.InlineKeyboardButton(text=f"📚 {c.name} ({g_count} групп)", callback_data=f"sch_c:{c.id}"))
    builder.row(types.InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:schedule"))
    
    await callback.message.edit_text("📚 *Расписание по курсам*\nВыберите курс:", parse_mode="Markdown", reply_markup=builder.as_markup())


@router.callback_query(F.data.startswith("sch_c:"))
async def list_schedule_teachers(callback: types.CallbackQuery, session: AsyncSession):
    course_id = int(callback.data.split(":")[1])
    
    from bot.models.education import Group
    from bot.models.user import Teacher
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    
    stmt = (
        select(Teacher)
        .join(Group, Group.teacher_id == Teacher.id)
        .options(selectinload(Teacher.user))
        .where(Group.course_id == course_id, Group.is_active == True)
        .distinct()
    )
    teachers = (await session.execute(stmt)).scalars().all()
    
    builder = InlineKeyboardBuilder()
    if not teachers:
        builder.row(types.InlineKeyboardButton(text="Пусто", callback_data="dummy"))
    else:
        for t in teachers:
            builder.row(types.InlineKeyboardButton(text=f"👨‍🏫 {t.user.full_name}", callback_data=f"sch_t:{t.id}_c_{course_id}"))
    builder.row(types.InlineKeyboardButton(text="⬅️ К курсам", callback_data="admin_sch:list_all"))
    
    await callback.message.edit_text("👨‍🏫 *Выберите преподавателя:*", parse_mode="Markdown", reply_markup=builder.as_markup())


@router.callback_query(F.data.startswith("sch_t:"))
async def list_schedule_groups(callback: types.CallbackQuery, session: AsyncSession):
    parts = callback.data.split(":")
    data_str = parts[1] # format : "t_id_c_cid"
    t_id_str, c_id_str = data_str.split("_c_")
    teacher_id = int(t_id_str)
    course_id = int(c_id_str)
    
    from bot.models.education import Group
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    
    stmt = select(Group).options(selectinload(Group.schedule)).where(
        Group.course_id == course_id,
        Group.teacher_id == teacher_id,
        Group.is_active == True
    )
    groups = (await session.execute(stmt)).scalars().all()
    
    builder = InlineKeyboardBuilder()
    if not groups:
        builder.row(types.InlineKeyboardButton(text="Пусто", callback_data="dummy"))
    else:
        for g in groups:
            time_str = f"{g.schedule.time_start}-{g.schedule.time_end}" if g.schedule else "Не задано время"
            builder.row(types.InlineKeyboardButton(
                text=f"👥 {g.name} | ⏰ {time_str} | 🧑‍🎓 {g.current_students}/{g.max_students}",
                callback_data=f"sch_g:{g.id}:1"
            ))
            
    builder.row(types.InlineKeyboardButton(text="⬅️ К преподавателям", callback_data=f"sch_c:{course_id}"))
    
    await callback.message.edit_text("👥 *Выберите учебную группу:*", parse_mode="Markdown", reply_markup=builder.as_markup())


@router.callback_query(F.data.startswith("sch_g:"))
async def list_group_lessons(callback: types.CallbackQuery, session: AsyncSession, override_group_id: int = None, override_page: int = 1):
    parts = callback.data.split(":")
    if override_group_id is not None:
        group_id = override_group_id
        page = override_page
    else:
        group_id = int(parts[1])
        page = int(parts[2]) if len(parts) > 2 else 1
    
    from bot.utils.pagination import Paginator
    from bot.models.education import Group, Lesson
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    
    stmt = select(Group).where(Group.id == group_id)
    g = (await session.execute(stmt)).scalar_one_or_none()
    if not g: return await callback.answer("Группа не найдена", show_alert=True)
    
    stmt_lsns = select(Lesson).where(Lesson.group_id == group_id).order_by(Lesson.lesson_date.asc(), Lesson.lesson_time.asc())
    lessons = (await session.execute(stmt_lsns)).scalars().all()
    
    paginator = Paginator(lessons, page=page, limit=7, callback_prefix=f"sch_g:{group_id}")
    current_items = paginator.get_page_items()
    
    builder = InlineKeyboardBuilder()
    if not current_items:
        builder.row(types.InlineKeyboardButton(text="Уроков пока нет", callback_data="dummy"))
    else:
        for l in current_items:
            builder.row(types.InlineKeyboardButton(
                text=f"🗓 {l.lesson_date.strftime('%d.%m')} {l.lesson_time or ''} | {l.topic[:15]}",
                callback_data=f"lesson_view:{l.id}"
            ))
            
    paginator.add_pagination_buttons(builder)
    
    # Back button goes to groups list. We need teacher_id and course_id
    back_data = f"sch_t:{g.teacher_id}_c_{g.course_id}"
    builder.row(types.InlineKeyboardButton(text="⬅️ Назад к группам", callback_data=back_data))
    
    text = f"📋 *Уроки группы {g.name}*\nВсего уроков: {len(lessons)}\nВыберите урок:"
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=builder.as_markup())

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
    lesson = (await session.execute(select(Lesson).where(Lesson.id == lesson_id))).scalar_one_or_none()
    if lesson:
        group_id = lesson.group_id
        await session.delete(lesson)
        await session.commit()
        await callback.answer("✅ Урок удален", show_alert=True)
        await list_group_lessons(callback, session, override_group_id=group_id)
    else:
        await callback.answer("Урок не найден", show_alert=True)

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
