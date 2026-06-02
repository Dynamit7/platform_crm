import logging
from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from bot.models.user import User, UserRole
from bot.services.student_service import StudentService
from bot.utils.pagination import Paginator
from aiogram.utils.keyboard import InlineKeyboardBuilder
from bot.utils.constants import StudentStatus

router = Router(name="admin_students")
logger = logging.getLogger(__name__)

class StudentManageStates(StatesGroup):
    waiting_for_freeze_days = State()

@router.callback_query(F.data.startswith("admin:students"))
async def list_all_students(callback: types.CallbackQuery, session: AsyncSession):
    parts = callback.data.split(":")
    page = int(parts[2]) if len(parts) > 2 else 1
    
    stmt = select(User).where(User.role == UserRole.STUDENT).order_by(User.full_name).options(selectinload(User.student_profile))
    result = await session.execute(stmt)
    students = result.scalars().all()
    
    paginator = Paginator(students, page=page, limit=10, callback_prefix="admin:students")
    current_items = paginator.get_page_items()
    
    builder = InlineKeyboardBuilder()
    
    builder.row(types.InlineKeyboardButton(text="🔍 Поиск ученика", callback_data="admin_users:search"))
    
    for student_user in current_items:
        st = student_user.student_profile
        from datetime import date as date_type
        today = date_type.today()
        if st and not st.is_active:
            status_icon = "🚫"
        elif st and st.frozen_until and st.frozen_until >= today:
            status_icon = "❄️"
        else:
            status_icon = "✅"
        builder.row(types.InlineKeyboardButton(
            text=f"{status_icon} {student_user.full_name}",
            callback_data=f"student_view:{student_user.id}"
        ))
    
    paginator.add_pagination_buttons(builder)
    builder.row(types.InlineKeyboardButton(text="⬅️ Главное меню", callback_data="admin:main"))
    
    total_active = sum(1 for u in students if u.student_profile and u.student_profile.is_active)
    total_frozen = sum(1 for u in students if u.student_profile and u.student_profile.frozen_until and u.student_profile.frozen_until >= date_type.today())
    
    text = (
        f"👥 *Все ученики ({len(students)})*\n"
        f"✅ Активных: {total_active} | "
        f"❄️ Заморожено: {total_frozen} | "
        f"🚫 Отчислено: {len(students) - total_active}"
    )
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=builder.as_markup())

@router.callback_query(F.data.startswith("student_view:"))
async def view_student_details(callback: types.CallbackQuery, session: AsyncSession, override_user_id: int = None):
    if override_user_id is not None:
        user_id = override_user_id
    else:
        user_id = int(callback.data.split(":")[1])
        
    stmt = select(User).where(User.id == user_id).options(selectinload(User.student_profile))
    user = (await session.execute(stmt)).scalar_one()
    student = user.student_profile

    status_icon = StudentStatus.ICONS[StudentStatus.ACTIVE]
    status_label = "Активен"
    if student.frozen_until:
        from datetime import date
        if student.frozen_until >= date.today():
            status_icon = StudentStatus.ICONS[StudentStatus.FROZEN]
            status_label = f"ЗАМОРОЖЕН до {student.frozen_until.strftime('%d.%m.%Y')}"

    if not student.is_active:
        status_icon = "🚫"
        status_label = "Отчислен / Ушел"

    text = (
        f"👤 *Детали ученика*\n"
        f"――――――――――――――――――――\n"
        f"👤 ФИО: *{user.full_name}*\n"
        f"📞 Тел: `{user.phone}`\n"
        f"📊 Статус: {status_icon} *{status_label}*\n"
        f"――――――――――――――――――――\n"
        f"📅 В базе с: {user.created_at.strftime('%d.%m.%Y') if user.created_at else '--.--.----'}\n"
    )
    
    builder = InlineKeyboardBuilder()
    
    if student.is_active:
        # Кнопка добавления в группу только если активен
        builder.row(types.InlineKeyboardButton(text="🏫 Записать в группу", callback_data=f"student_enroll_group:{student.id}"))
        
        if not student.frozen_until or student.frozen_until < date.today():
            builder.row(types.InlineKeyboardButton(text="❄️ Заморозить профиль", callback_data=f"student_freeze:{student.id}"))
            builder.row(types.InlineKeyboardButton(text="🚫 Отчислить ученика", callback_data=f"student_toggle:{student.id}"))
        else:
            builder.row(types.InlineKeyboardButton(text="🔥 Разморозить сейчас", callback_data=f"student_unfreeze:{student.id}"))
    else:
        builder.row(types.InlineKeyboardButton(text="✅ Восстановить в центр", callback_data=f"student_toggle:{student.id}"))
        
    builder.row(types.InlineKeyboardButton(text="⬅️ К списку учеников", callback_data="admin:students:1"))
    builder.row(types.InlineKeyboardButton(text="🏠 Главное меню", callback_data="admin:main"))
    
    # Кнопка умного перевода (показываем, если есть активные группы)
    from bot.models.education import StudentGroup
    stmt_sg = select(StudentGroup).where(StudentGroup.student_id == student.id, StudentGroup.status == "active")
    active_sgs = (await session.execute(stmt_sg)).scalars().all()
    if active_sgs:
        builder.row(types.InlineKeyboardButton(text="🔁 Умный перевод в др. группу", callback_data=f"st_transfer_start:{student.id}"))
    
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=builder.as_markup())

@router.callback_query(F.data.startswith("student_freeze:"))
async def start_freeze(callback: types.CallbackQuery, state: FSMContext):
    student_id = int(callback.data.split(":")[1])
    await state.update_data(student_id=student_id)
    
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(text="1 неделя", callback_data="freeze_set:7"))
    builder.row(types.InlineKeyboardButton(text="2 недели", callback_data="freeze_set:14"))
    builder.row(types.InlineKeyboardButton(text="1 месяц", callback_data="freeze_set:30"))
    builder.row(types.InlineKeyboardButton(text="Отмена", callback_data="admin:students:1"))
    
    await callback.message.edit_text("⏳ *Выберите срок заморозки:*", parse_mode="Markdown", reply_markup=builder.as_markup())

@router.callback_query(F.data.startswith("freeze_set:"))
async def finalize_freeze(callback: types.CallbackQuery, state: FSMContext, session: AsyncSession):
    days = int(callback.data.split(":")[1])
    data = await state.get_data()
    student_id = data['student_id']
    
    service = StudentService(session)
    until = await service.freeze_student(student_id, days)
    
    await callback.answer(f"✅ Заморожено до {until.strftime('%d.%m.%Y')}", show_alert=True)
    await state.clear()
    await list_all_students(callback, session)

@router.callback_query(F.data.startswith("student_unfreeze:"))
async def unfreeze_now(callback: types.CallbackQuery, session: AsyncSession):
    student_id = int(callback.data.split(":")[1])
    service = StudentService(session)
    await service.unfreeze_student(student_id)
    await callback.answer("✅ Ученик разморожен", show_alert=True)
    await list_all_students(callback, session)

@router.callback_query(F.data.startswith("student_enroll_group:"))
async def select_group_for_student(callback: types.CallbackQuery, session: AsyncSession):
    student_id = int(callback.data.split(":")[1])
    
    from bot.models.education import Group
    from sqlalchemy.orm import joinedload
    
    stmt = select(Group).where(Group.is_active == True).options(joinedload(Group.course))
    groups = (await session.execute(stmt)).scalars().all()
    
    if not groups:
        await callback.answer("Нет доступных активных групп", show_alert=True)
        return
        
    builder = InlineKeyboardBuilder()
    for g in groups:
        course_name = g.course.name if g.course else "Без курса"
        avail = g.max_students - g.current_students
        mark = "✅" if avail > 0 else "❌"
        builder.row(types.InlineKeyboardButton(
            text=f"{mark} {g.name} ({course_name}) | Свободно: {avail}",
            callback_data=f"st_gr_prep:{student_id}:{g.id}" if avail > 0 else "dummy"
        ))
    
    builder.row(types.InlineKeyboardButton(text="⬅️ Отмена", callback_data="admin:students:1"))
    
    await callback.message.edit_text("🏫 *Выберите группу для записи ученика:*", parse_mode="Markdown", reply_markup=builder.as_markup())

@router.callback_query(F.data.startswith("st_gr_prep:"))
async def prepare_group_assignment(callback: types.CallbackQuery):
    parts = callback.data.split(":")
    student_id = int(parts[1])
    group_id = int(parts[2])
    
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(text="✅ Основной состав", callback_data=f"st_gr_add:{student_id}:{group_id}:active"))
    builder.row(types.InlineKeyboardButton(text="⏳ На пробный урок", callback_data=f"st_gr_add:{student_id}:{group_id}:trial"))
    builder.row(types.InlineKeyboardButton(text="⬅️ Назад", callback_data=f"student_enroll_group:{student_id}"))
    
    await callback.message.edit_text("Выберите формат зачисления:", parse_mode="Markdown", reply_markup=builder.as_markup())

@router.callback_query(F.data.startswith("st_gr_add:"))
async def execute_group_assignment(callback: types.CallbackQuery, session: AsyncSession):
    parts = callback.data.split(":")
    student_id = int(parts[1])
    group_id = int(parts[2])
    status_type = parts[3] if len(parts) > 3 else "active"
    
    from bot.models.education import StudentGroup, Group, StudentProgress
    from bot.models.user import Student, User
    
    # 1. Проверяем, может он уже там
    stmt_check = select(StudentGroup).where(StudentGroup.student_id == student_id, StudentGroup.group_id == group_id)
    exists = (await session.execute(stmt_check)).scalar_one_or_none()
    
    if exists:
        if exists.status != status_type:
            exists.status = status_type
            await session.commit()
            return await callback.answer(f"Статус изменен на {status_type}", show_alert=True)
        return await callback.answer("Ученик уже состоит в этой группе!", show_alert=True)
        
    # 2. Создаем запись
    sg = StudentGroup(student_id=student_id, group_id=group_id, status=status_type)
    session.add(sg)
    
    # 3. Обновляем счетчик
    stmt_gr = select(Group).where(Group.id == group_id)
    group = (await session.execute(stmt_gr)).scalar_one()
    group.current_students += 1
    
    # 4. Создаем трекер прогресса, чтобы студент видел предмет
    stmt_prog = select(StudentProgress).where(StudentProgress.student_id == student_id, StudentProgress.course_id == group.course_id)
    prog = (await session.execute(stmt_prog)).scalar_one_or_none()
    if not prog:
        new_prog = StudentProgress(student_id=student_id, course_id=group.course_id)
        session.add(new_prog)
    
    # 5. Создаем Enrollment для синхронизации с вебом
    from bot.models.education import Enrollment as EnrollmentModel
    student_rec = (await session.execute(select(Student).where(Student.id == student_id))).scalar_one()
    if student_rec:
        existing_enroll = (await session.execute(
            select(EnrollmentModel).where(EnrollmentModel.student_id == student_rec.user_id, EnrollmentModel.course_id == group.course_id)
        )).scalar_one_or_none()
        if not existing_enroll:
            enroll = EnrollmentModel(student_id=student_rec.user_id, course_id=group.course_id, group_id=group_id)
            session.add(enroll)
    
    await session.commit()
    
    msg = "✅ Ученик успешно добавлен в учебную группу!" if status_type == "active" else "⏳ Ученик зачислен на пробный период!"
    await callback.answer(msg, show_alert=True)
    
    student_record = (await session.execute(select(Student).where(Student.id == student_id))).scalar_one()
    await view_student_details(callback, session, override_user_id=student_record.user_id)

@router.callback_query(F.data.startswith("st_transfer_start:"))
async def smart_transfer_step1(callback: types.CallbackQuery, session: AsyncSession):
    student_id = int(callback.data.split(":")[1])
    
    from bot.models.education import StudentGroup, Group
    from sqlalchemy.orm import joinedload
    
    stmt_sg = select(StudentGroup).where(StudentGroup.student_id == student_id, StudentGroup.status == "active").options(joinedload(StudentGroup.group))
    sgs = (await session.execute(stmt_sg)).scalars().all()
    
    if not sgs: return await callback.answer("Ученик нигде не учится", show_alert=True)
    
    builder = InlineKeyboardBuilder()
    for sg in sgs:
        builder.row(types.InlineKeyboardButton(text=f"Из {sg.group.name}", callback_data=f"st_transfer_from:{student_id}:{sg.group.id}"))
    builder.row(types.InlineKeyboardButton(text="Отмена", callback_data=f"student_view:{student_id}"))
    
    await callback.message.edit_text("🔁 *Умный перевод*\n\nИз какой группы будем переводить ученика?", parse_mode="Markdown", reply_markup=builder.as_markup())

@router.callback_query(F.data.startswith("st_transfer_from:"))
async def smart_transfer_step2(callback: types.CallbackQuery, session: AsyncSession):
    student_id = int(callback.data.split(":")[1])
    old_group_id = int(callback.data.split(":")[2])
    
    from bot.models.education import Group
    stmt = select(Group).where(Group.is_active == True, Group.id != old_group_id)
    groups = (await session.execute(stmt)).scalars().all()
    
    builder = InlineKeyboardBuilder()
    for g in groups:
        avail = g.max_students - g.current_students
        if avail > 0:
            builder.row(types.InlineKeyboardButton(text=f"В {g.name} (своб: {avail})", callback_data=f"st_transfer_exec:{student_id}:{old_group_id}:{g.id}"))
    builder.row(types.InlineKeyboardButton(text="Отмена", callback_data=f"student_view:{student_id}"))
    
    await callback.message.edit_text("🔁 *В какую группу перевести?*", parse_mode="Markdown", reply_markup=builder.as_markup())

@router.callback_query(F.data.startswith("st_transfer_exec:"))
async def smart_transfer_execute(callback: types.CallbackQuery, session: AsyncSession):
    parts = callback.data.split(":")
    student_id = int(parts[1])
    old_group_id = int(parts[2])
    new_group_id = int(parts[3])
    
    from bot.models.education import StudentGroup, Group
    
    # 1. Закрываем старую
    stmt_old = select(StudentGroup).where(StudentGroup.student_id == student_id, StudentGroup.group_id == old_group_id)
    old_sg = (await session.execute(stmt_old)).scalar_one_or_none()
    if old_sg:
        old_sg.status = "transferred"
        
        o_g = (await session.execute(select(Group).where(Group.id == old_group_id))).scalar_one()
        o_g.current_students = max(0, o_g.current_students - 1)
        
    # 2. Проверяем, не заполнена ли целевая группа
    n_g = (await session.execute(select(Group).where(Group.id == new_group_id))).scalar_one()
    if n_g and n_g.max_students > 0 and n_g.current_students >= n_g.max_students:
        await callback.answer("❌ Целевая группа заполнена!", show_alert=True)
        return

    new_sg = StudentGroup(student_id=student_id, group_id=new_group_id, status="active")
    session.add(new_sg)
    
    n_g.current_students += 1
    
    await session.commit()
    await callback.answer("✅ Ученик успешно переведен!", show_alert=True)
    
    student_record = (await session.execute(select(Student).where(Student.id == student_id))).scalar_one()
    await view_student_details(callback, session, override_user_id=student_record.user_id)

@router.callback_query(F.data.startswith("student_toggle:"))
async def toggle_student_status(callback: types.CallbackQuery, session: AsyncSession):
    student_id = int(callback.data.split(":")[1])
    
    from bot.models.user import Student
    from bot.models.education import StudentGroup, Group
    stmt = select(Student).where(Student.id == student_id)
    student = (await session.execute(stmt)).scalar_one()
    
    student.is_active = not student.is_active
    
    if not student.is_active:
        stmt_sg = select(StudentGroup).where(StudentGroup.student_id == student_id, StudentGroup.status == "active")
        active_groups = (await session.execute(stmt_sg)).scalars().all()
        for sg in active_groups:
            sg.status = "expelled"
            group = await session.get(Group, sg.group_id)
            if group:
                group.current_students = max(0, (group.current_students or 0) - 1)
    
    await session.commit()
    
    status_msg = "восстановлен" if student.is_active else "отчислен"
    await callback.answer(f"✅ Ученик успешно {status_msg}", show_alert=True)
    
    await list_all_students(callback, session)
