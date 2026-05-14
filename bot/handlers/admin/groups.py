import logging
from aiogram import Router, types, F, Bot
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from bot.models.education import Group, Course, Schedule
from bot.models.user import Teacher
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
async def process_schedule(callback: types.CallbackQuery, state: FSMContext, session: AsyncSession):
    sch_id = int(callback.data.split(":")[1])
    await state.update_data(schedule_id=sch_id)
    
    # Новый шаг: Выбор учителя
    stmt = select(Teacher).options(selectinload(Teacher.user)).where(Teacher.is_active == True)
    teachers = (await session.execute(stmt)).scalars().all()
    
    if not teachers:
        await callback.answer("❌ Нет активных преподавателей. Создайте их сначала.", show_alert=True)
        return
        
    builder = types.InlineKeyboardMarkup(inline_keyboard=[
        [types.InlineKeyboardButton(text=t.user.full_name, callback_data=f"group_sel_teacher:{t.id}")] 
        for t in teachers
    ])
    
    await callback.message.edit_text("🆕 *Шаг 5:* Выберите преподавателя:", parse_mode="Markdown", reply_markup=builder)
    await state.set_state(AdminGroupCreateStates.waiting_for_teacher)

@router.callback_query(AdminGroupCreateStates.waiting_for_teacher, F.data.startswith("group_sel_teacher:"))
async def process_teacher(callback: types.CallbackQuery, state: FSMContext):
    teacher_id = int(callback.data.split(":")[1])
    await state.update_data(teacher_id=teacher_id)
    
    # Новый шаг: Выбор типа группы (Групповая или Индивидуальная)
    builder = types.InlineKeyboardMarkup(inline_keyboard=[
        [types.InlineKeyboardButton(text="👥 Групповая (до 15 чел)", callback_data="group_type:15")],
        [types.InlineKeyboardButton(text="👤 Индивидуальная (1 чел)", callback_data="group_type:1")]
    ])
    
    await callback.message.edit_text("🆕 *Шаг 6:* Выберите формат обучения:", parse_mode="Markdown", reply_markup=builder)
    await state.set_state(AdminGroupCreateStates.waiting_for_max_students)

@router.callback_query(AdminGroupCreateStates.waiting_for_max_students, F.data.startswith("group_type:"))
async def process_group_type(callback: types.CallbackQuery, state: FSMContext, session: AsyncSession):
    max_students = int(callback.data.split(":")[1])
    data = await state.get_data()
    
    teacher_id = data['teacher_id']
    schedule_id = data['schedule_id']
    days_mask = data['days_mask']
    
    from bot.services.group_service import GroupService
    gs = GroupService(session)
    success, msg, _ = await gs.create_group(
        name=data['name'], 
        course_id=data['course_id'], 
        teacher_id=teacher_id, 
        schedule_id=schedule_id, 
        days_mask=days_mask, 
        max_students=max_students
    )
    
    if not success:
        return await callback.answer(msg, show_alert=True)
    
    days_text = ScheduleHelper.get_readable_days(data['days_mask'])
    await callback.message.edit_text(
        f"✅ *Группа создана!*\n\n📍 Название: {data['name']}\n📅 График: {days_text}",
        parse_mode="Markdown",
        reply_markup=get_admin_groups_kb()
    )
    await state.clear()

@router.callback_query(F.data.startswith("admin_groups:list"))
async def list_all_groups(callback: types.CallbackQuery, session: AsyncSession):
    parts = callback.data.split(":")
    page = int(parts[2]) if len(parts) > 2 else 1
    
    from bot.utils.pagination import Paginator
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    from bot.models.user import Teacher
    
    stmt = select(Group).order_by(Group.is_active.desc(), Group.id.desc()).options(selectinload(Group.course), selectinload(Group.teacher).selectinload(Teacher.user))
    groups = (await session.execute(stmt)).scalars().all()
    
    if not groups:
        await callback.answer("Группы еще не созданы", show_alert=True)
        return
        
    paginator = Paginator(groups, page=page, limit=10, callback_prefix="admin_groups:list")
    current_items = paginator.get_page_items()
    
    builder = InlineKeyboardBuilder()
    
    for g in current_items:
        status_icon = "🟢" if g.is_active else "🔴"
        teacher_name = g.teacher.user.full_name[:12] if g.teacher and g.teacher.user else "Нет"
        builder.row(types.InlineKeyboardButton(text=f"{status_icon} {g.name} | {teacher_name}", callback_data=f"adm_gr_view:{g.id}"))
    
    paginator.add_pagination_buttons(builder)
    builder.row(types.InlineKeyboardButton(text="⬅️ Меню групп", callback_data="admin:groups"))
    
    text = f"🏫 *Список всех групп ({len(groups)})*\n\nВыберите группу для управления:"
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=builder.as_markup())

@router.callback_query(F.data.startswith("adm_gr_view:"))
async def view_group_card(callback: types.CallbackQuery, session: AsyncSession, override_group_id: int = None):
    if override_group_id is not None:
        group_id = override_group_id
    else:
        group_id = int(callback.data.split(":")[1])
        
    from bot.models.user import Teacher
    stmt = select(Group).where(Group.id == group_id).options(selectinload(Group.course), selectinload(Group.schedule), selectinload(Group.teacher).selectinload(Teacher.user))
    g = (await session.execute(stmt)).scalar_one_or_none()
    
    if not g:
        return await callback.answer("Группа не найдена", show_alert=True)
    
    days_text = ScheduleHelper.get_readable_days(g.days_bitmask)
    teacher_name = g.teacher.user.full_name if g.teacher and g.teacher.user else "Не назначен"
    schedule_time = f"{g.schedule.time_start}-{g.schedule.time_end}" if g.schedule else "Не задано"
    status = "Активна" if g.is_active else "Закрыта (Архив)"
    
    text = (
        f"🏫 *Карточка группы: {g.name}*\n"
        f"――――――――――――――――――――\n"
        f"📚 Курс: {g.course.name}\n"
        f"👨‍🏫 Учитель: {teacher_name}\n"
        f"📅 Дни: {days_text}\n"
        f"⏰ Время: {schedule_time}\n"
        f"👥 Учеников: {g.current_students}/{g.max_students}\n"
        f"🔋 Статус: {status}\n"
        f"――――――――――――――――――――"
    )
    
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    builder = InlineKeyboardBuilder()
    
    if g.is_active:
        builder.row(types.InlineKeyboardButton(text="🧑‍🎓 Список учеников", callback_data=f"adm_gr_students:{g.id}"))
        builder.row(types.InlineKeyboardButton(text="📅 Сгенерировать уроки на месяц", callback_data=f"adm_gr_gen_lsn:{g.id}"))
        builder.row(types.InlineKeyboardButton(text="📋 Управление уроками", callback_data=f"adm_gr_lsns:{g.id}:1"))
        builder.row(types.InlineKeyboardButton(text="👨‍🏫 Сменить учителя", callback_data=f"adm_gr_edit_t:{g.id}"))
        # НОВЫЕ КНОПКИ РАСПИСАНИЯ
        builder.row(types.InlineKeyboardButton(text="🕒 Изменить расписание", callback_data=f"adm_gr_esched:{g.id}"))
        builder.row(types.InlineKeyboardButton(text="🎓 Выпустить группу", callback_data=f"adm_gr_grad:{g.id}"))
        
    toggle_text = "🔴 В Архив" if g.is_active else "🟢 Восстановить"
    builder.row(types.InlineKeyboardButton(text=toggle_text, callback_data=f"adm_gr_toggle:{g.id}"))
    
    builder.row(types.InlineKeyboardButton(text="⬅️ Список групп", callback_data="admin_groups:list:1"))
    
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=builder.as_markup())

@router.callback_query(F.data.startswith("adm_gr_students:"))
async def view_group_students(callback: types.CallbackQuery, session: AsyncSession):
    group_id = int(callback.data.split(":")[1])
    
    from bot.models.education import Group, StudentGroup
    from bot.models.user import Student
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    
    stmt = (
        select(StudentGroup)
        .where(StudentGroup.group_id == group_id, StudentGroup.status.in_(["active", "trial"]))
        .options(selectinload(StudentGroup.student).selectinload(Student.user))
    )
    student_links = (await session.execute(stmt)).scalars().all()
    
    builder = InlineKeyboardBuilder()
    if not student_links:
        builder.row(types.InlineKeyboardButton(text="Учеников пока нет", callback_data="dummy"))
    else:
        for link in student_links:
            status_emoji = "⏳" if link.status == "trial" else "✅"
            builder.row(types.InlineKeyboardButton(
                text=f"{status_emoji} {link.student.user.full_name}",
                callback_data=f"student_view:{link.student.user.id}"
            ))
            
    builder.row(types.InlineKeyboardButton(text="⬅️ Назад к группе", callback_data=f"adm_gr_view:{group_id}"))
    
    group_stmt = select(Group).where(Group.id == group_id)
    g = (await session.execute(group_stmt)).scalar_one_or_none()
    
    text = f"🧑‍🎓 *Студенты группы: {g.name if g else group_id}*\nВсего учеников: {len(student_links)}\n\nНажмите на студента для просмотра карточки:"
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=builder.as_markup())

@router.callback_query(F.data.startswith("adm_gr_esched:"))
async def start_edit_group_schedule(callback: types.CallbackQuery, state: FSMContext, session: AsyncSession):
    group_id = int(callback.data.split(":")[1])
    await state.update_data(edit_group_id=group_id)
    
    stmt = select(Schedule).where(Schedule.is_active == True)
    schedules = (await session.execute(stmt)).scalars().all()
    
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    builder = InlineKeyboardBuilder()
    for s in schedules:
        builder.row(types.InlineKeyboardButton(text=f"{s.name} ({s.time_start}-{s.time_end})", callback_data=f"adm_gr_set_sch:{s.id}"))
    builder.row(types.InlineKeyboardButton(text="Отмена", callback_data=f"adm_gr_view:{group_id}"))
    
    await callback.message.edit_text("🕒 *Изменение времени*\nВыберите новый временной слот:", parse_mode="Markdown", reply_markup=builder.as_markup())

@router.callback_query(F.data.startswith("adm_gr_set_sch:"))
async def save_edit_group_schedule(callback: types.CallbackQuery, state: FSMContext, session: AsyncSession):
    sch_id = int(callback.data.split(":")[1])
    data = await state.get_data()
    group_id = data.get("edit_group_id")
    
    stmt = select(Group).where(Group.id == group_id)
    g = (await session.execute(stmt)).scalar_one()
    
    from bot.services.group_service import GroupService
    gs = GroupService(session)
    success, msg = await gs.set_group_schedule(g, sch_id)
    
    if not success:
        return await callback.answer(msg, show_alert=True)
    
    await callback.answer(msg, show_alert=True)
    await state.clear()
    
    await view_group_card(callback, session, override_group_id=group_id)

@router.callback_query(F.data.startswith("adm_gr_grad:"))
async def graduate_group(callback: types.CallbackQuery, session: AsyncSession, bot: Bot):
    group_id = int(callback.data.split(":")[1])
    
    # Получаем группу со студентами
    from bot.models.education import StudentGroup
    from bot.models.user import Student
    
    stmt = select(Group).where(Group.id == group_id)
    g = (await session.execute(stmt)).scalar_one_or_none()
    
    if not g: return await callback.answer("Группа не найдена")
    
    from bot.services.group_service import GroupService
    gs = GroupService(session)
    success, count = await gs.graduate_group(g, bot)
            
    await callback.answer(f"✅ Группа {g.name} выпущена! ({count} учеников получили уведомления)", show_alert=True)
    await view_group_card(callback, session, override_group_id=group_id)

@router.callback_query(F.data.startswith("adm_gr_toggle:"))
async def toggle_group_status(callback: types.CallbackQuery, session: AsyncSession):
    group_id = int(callback.data.split(":")[1])
    stmt = select(Group).where(Group.id == group_id)
    g = (await session.execute(stmt)).scalar_one()
    g.is_active = not g.is_active
    await session.commit()
    
    await callback.answer(f"Статус группы изменен на {'Активна' if g.is_active else 'Архив'}", show_alert=True)
    await view_group_card(callback, session, override_group_id=group_id)

@router.callback_query(F.data.startswith("adm_gr_edit_t:"))
async def start_edit_group_teacher(callback: types.CallbackQuery, session: AsyncSession):
    group_id = int(callback.data.split(":")[1])
    from bot.models.user import Teacher
    stmt = select(Teacher).options(selectinload(Teacher.user)).where(Teacher.is_active == True)
    teachers = (await session.execute(stmt)).scalars().all()
    
    if not teachers:
        return await callback.answer("Нет активных преподавателей", show_alert=True)
        
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    builder = InlineKeyboardBuilder()
    for t in teachers:
        builder.row(types.InlineKeyboardButton(text=t.user.full_name, callback_data=f"adm_gr_set_t:{group_id}:{t.id}"))
        
    builder.row(types.InlineKeyboardButton(text="⬅️ Отмена", callback_data=f"adm_gr_view:{group_id}"))
    
    await callback.message.edit_text("🔄 *Смена преподавателя*\nВыберите нового учителя для этой группы:", parse_mode="Markdown", reply_markup=builder.as_markup())

@router.callback_query(F.data.startswith("adm_gr_set_t:"))
async def set_group_teacher(callback: types.CallbackQuery, session: AsyncSession):
    _, group_id, teacher_id = callback.data.split(":")
    stmt = select(Group).where(Group.id == int(group_id))
    g = (await session.execute(stmt)).scalar_one()
    
    from bot.services.group_service import GroupService
    gs = GroupService(session)
    success, msg = await gs.set_group_teacher(g, int(teacher_id))
    
    if not success:
        return await callback.answer(msg, show_alert=True)
    
    await callback.answer(msg, show_alert=True)
    await view_group_card(callback, session, override_group_id=int(group_id))

@router.callback_query(F.data.startswith("adm_gr_gen_lsn:"))
async def auto_generate_lessons(callback: types.CallbackQuery, session: AsyncSession):
    group_id = int(callback.data.split(":")[1])
    stmt = select(Group).where(Group.id == group_id).options(selectinload(Group.schedule))
    g = (await session.execute(stmt)).scalar_one()
    
    from bot.services.group_service import GroupService
    gs = GroupService(session)
    success, msg, added_count = await gs.auto_generate_lessons(g)
    
    await callback.answer(msg, show_alert=True)

from aiogram.fsm.state import State, StatesGroup

class AdminLessonManagerStates(StatesGroup):
    waiting_for_topic = State()
    waiting_for_time = State()

@router.callback_query(F.data.startswith("adm_gr_lsns:"))
async def view_group_lessons(callback: types.CallbackQuery, session: AsyncSession):
    parts = callback.data.split(":")
    group_id = int(parts[1])
    page = int(parts[2]) if len(parts) > 2 else 1
    
    from bot.models.education import Lesson
    from bot.utils.pagination import Paginator
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    
    stmt = select(Lesson).where(Lesson.group_id == group_id).order_by(Lesson.lesson_date.asc())
    lessons = (await session.execute(stmt)).scalars().all()
    
    if not lessons:
        await callback.answer("У этой группы пока нет уроков", show_alert=True)
        return
        
    paginator = Paginator(lessons, page=page, limit=6, callback_prefix=f"adm_gr_lsns:{group_id}")
    current_items = paginator.get_page_items()
    
    builder = InlineKeyboardBuilder()
    for lsn in current_items:
        builder.row(types.InlineKeyboardButton(
            text=f"📌 {lsn.lesson_date.strftime('%d.%m %H:%M')} | {lsn.topic[:15]}",
            callback_data=f"adm_lsn_v:{lsn.id}"
        ))
        
    paginator.add_pagination_buttons(builder)
    builder.row(types.InlineKeyboardButton(text="⬅️ Назад к группе", callback_data=f"adm_gr_view:{group_id}"))
    
    text = f"📋 *Уроки группы (Всего: {len(lessons)})*\nСтраница {page} из {paginator.total_pages or 1}\n\nВыберите урок для редактирования:"
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=builder.as_markup())

@router.callback_query(F.data.startswith("adm_lsn_v:"))
async def view_lesson_card(callback: types.CallbackQuery, session: AsyncSession):
    lesson_id = int(callback.data.split(":")[1])
    from bot.models.education import Lesson
    
    stmt = select(Lesson).where(Lesson.id == lesson_id).options(selectinload(Lesson.group))
    lsn = (await session.execute(stmt)).scalar_one_or_none()
    if not lsn:
        return await callback.answer("Урок не найден", show_alert=True)
        
    text = (
        f"📖 *Занятие Группы: {lsn.group.name}*\n"
        f"📅 Дата: `{lsn.lesson_date.strftime('%d.%m.%Y')}`\n"
        f"⏰ Время: `{lsn.lesson_time or 'Не задано'}`\n"
        f"💬 Тема: `{lsn.topic}`\n"
        f"📝 Домашнее задание: {'Есть' if getattr(lsn, 'homework', None) else 'Нет'}"
    )
    
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(text="✏️ Изменить тему", callback_data=f"adm_lsn_e_topic:{lsn.id}"))
    builder.row(types.InlineKeyboardButton(text="🕒 Изменить время", callback_data=f"adm_lsn_e_time:{lsn.id}"))
    builder.row(types.InlineKeyboardButton(text="🗑 Удалить урок", callback_data=f"adm_lsn_del:{lsn.id}"))
    builder.row(types.InlineKeyboardButton(text="⬅️ Назад к расписанию", callback_data=f"adm_gr_lsns:{lsn.group_id}:1"))
    
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=builder.as_markup())

@router.callback_query(F.data.startswith("adm_lsn_del:"))
async def delete_lesson_admin(callback: types.CallbackQuery, session: AsyncSession):
    lesson_id = int(callback.data.split(":")[1])
    from bot.models.education import Lesson
    stmt = select(Lesson).where(Lesson.id == lesson_id)
    lsn = (await session.execute(stmt)).scalar_one_or_none()
    if lsn:
        gid = lsn.group_id
        await session.delete(lsn)
        await session.commit()
        await callback.message.edit_text(
            "✅ Урок успешно удален.",
            reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
                [types.InlineKeyboardButton(text="⬅️ Ок, назад в расписание", callback_data=f"adm_gr_lsns:{gid}:1")]
            ])
        )
    else:
        await callback.answer("Урок не найден", show_alert=True)

@router.callback_query(F.data.startswith("adm_lsn_e_topic:"))
async def edit_lesson_topic(callback: types.CallbackQuery, state: FSMContext):
    lesson_id = int(callback.data.split(":")[1])
    await state.update_data(edit_lesson_id=lesson_id)
    
    builder = types.InlineKeyboardMarkup(inline_keyboard=[
        [types.InlineKeyboardButton(text="❌ Отмена", callback_data=f"adm_lsn_v:{lesson_id}")]
    ])
    await callback.message.edit_text("✏️ Введите новую тему для урока:", reply_markup=builder)
    await state.set_state(AdminLessonManagerStates.waiting_for_topic)

@router.message(AdminLessonManagerStates.waiting_for_topic)
async def process_new_lesson_topic(message: types.Message, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    lesson_id = data.get("edit_lesson_id")
    
    from bot.models.education import Lesson
    stmt = select(Lesson).where(Lesson.id == lesson_id)
    lsn = (await session.execute(stmt)).scalar_one_or_none()
    
    if lsn:
        lsn.topic = message.text
        await session.commit()
        await message.answer("✅ Тема урока успешно обновлена!", reply_markup=types.InlineKeyboardMarkup(
            inline_keyboard=[[types.InlineKeyboardButton(text="⬅️ Вернуться к уроку", callback_data=f"adm_lsn_v:{lesson_id}")]]
        ))
    await state.clear()

@router.callback_query(F.data.startswith("adm_lsn_e_time:"))
async def edit_lesson_time(callback: types.CallbackQuery, state: FSMContext):
    lesson_id = int(callback.data.split(":")[1])
    await state.update_data(edit_lesson_id=lesson_id)
    
    builder = types.InlineKeyboardMarkup(inline_keyboard=[
        [types.InlineKeyboardButton(text="❌ Отмена", callback_data=f"adm_lsn_v:{lesson_id}")]
    ])
    await callback.message.edit_text("🕒 Введите новое время для урока (например, 14:00-15:30):", reply_markup=builder)
    await state.set_state(AdminLessonManagerStates.waiting_for_time)

@router.message(AdminLessonManagerStates.waiting_for_time)
async def process_new_lesson_time(message: types.Message, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    lesson_id = data.get("edit_lesson_id")
    
    from bot.models.education import Lesson
    stmt = select(Lesson).where(Lesson.id == lesson_id)
    lsn = (await session.execute(stmt)).scalar_one_or_none()
    
    if lsn:
        lsn.lesson_time = message.text
        await session.commit()
        await message.answer("✅ Время урока успешно обновлено!", reply_markup=types.InlineKeyboardMarkup(
            inline_keyboard=[[types.InlineKeyboardButton(text="⬅️ Вернуться к уроку", callback_data=f"adm_lsn_v:{lesson_id}")]]
        ))
    await state.clear()
