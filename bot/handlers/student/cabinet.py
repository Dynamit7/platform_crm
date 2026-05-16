import logging
from aiogram import Router, types, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from bot.models.user import User, Student
from bot.models.education import StudentProgress, HomeworkSubmission
from bot.keyboards.student import get_student_cabinet_kb, get_back_to_cabinet_kb

router = Router(name="student_cabinet")
logger = logging.getLogger(__name__)

def get_progress_bar(percent: float, length: int = 10) -> str:
    """Генерирует текстовый прогресс-бар."""
    filled_length = int(length * percent // 100)
    bar = "█" * filled_length + "░" * (length - filled_length)
    return f"[{bar}] {percent:.0f}%"

@router.message(Command("cabinet"))
@router.message(F.text == "🎓 Кабинет")
@router.callback_query(F.data == "student:main")
async def show_cabinet(event: types.TelegramObject, db_user: User, session: AsyncSession, state: FSMContext):
    """Главный экран кабинета со статистикой (или переадресация админа/учителя)."""
    from bot.models.user import UserRole
    if db_user.role == UserRole.TEACHER:
        from bot.handlers.teacher.panel import show_teacher_panel
        return await show_teacher_panel(event, db_user)
    elif db_user.role == UserRole.ADMIN:
        from bot.handlers.admin.panel import cmd_admin_panel
        if isinstance(event, types.Message):
            return await cmd_admin_panel(event, db_user, session)
        else:
            return await event.message.edit_text("Пожалуйста, введите /admin для входа в панель.")
    if db_user.role == UserRole.PENDING:
        msg = "⏳ Ваша заявка еще находится на рассмотрении. Ожидайте подтверждения от администратора."
        if isinstance(event, types.CallbackQuery):
            await event.answer(msg, show_alert=True)
        else:
            await event.answer(msg)
        return

    # Получаем общую статистику ученика
    sub_count_stmt = select(func.count(HomeworkSubmission.id)).join(Student).where(Student.user_id == db_user.id)
    hw_count = await session.scalar(sub_count_stmt) or 0
    
    text = (
        f"🎓 *Личный кабинет*\n"
        f"――――――――――――――――\n"
        f"👤 *Имя:* `{db_user.full_name}`\n"
        f"📊 *Сдано заданий:* `{hw_count}`\n\n"
        f"Выберите раздел для обучения:"
    )
    
    kb = get_student_cabinet_kb()
    data = await state.get_data()
    
    if isinstance(event, types.Message):
        try:
            await event.delete()
        except Exception:
            pass
            
        old_msg_id = data.get('last_cabinet_msg_id')
        if old_msg_id:
            try:
                await event.bot.delete_message(event.chat.id, old_msg_id)
            except Exception:
                pass
                
        msg = await event.answer(text, parse_mode="Markdown", reply_markup=kb)
        await state.update_data(last_cabinet_msg_id=msg.message_id)
    else:
        try:
            msg = await event.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
            await state.update_data(last_cabinet_msg_id=event.message.message_id)
        except Exception:
            pass
        await event.answer()

@router.callback_query(F.data == "student:courses")
async def view_student_courses_list(callback: types.CallbackQuery, session: AsyncSession, db_user: User):
    """Список курсов ученика."""
    stmt_st = select(Student.id).where(Student.user_id == db_user.id)
    student_id = await session.scalar(stmt_st)
    
    from bot.models.education import StudentGroup, Group
    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

    stmt = (
        select(Group)
        .join(StudentGroup)
        .where(StudentGroup.student_id == student_id, StudentGroup.status == "active")
        .options(selectinload(Group.course))
    )
    result = await session.execute(stmt)
    groups = result.scalars().all()
    
    if not groups:
        await callback.message.edit_text("😢 У вас пока нет активных курсов.", reply_markup=get_back_to_cabinet_kb())
        return

    buttons = []
    for g in groups:
        buttons.append([InlineKeyboardButton(text=g.course.name, callback_data=f"student:course:{g.id}")])
    buttons.append([InlineKeyboardButton(text="🔙 Назад", callback_data="student:main")])
    
    kb = InlineKeyboardMarkup(inline_keyboard=buttons)
    await callback.message.edit_text("📚 *Ваши активные курсы:*\nВыберите курс для просмотра подробностей:", parse_mode="Markdown", reply_markup=kb)

@router.callback_query(F.data.startswith("student:course:"))
async def view_student_course_details(callback: types.CallbackQuery, session: AsyncSession, db_user: User):
    """Просмотр деталей конкретного курса."""
    group_id = int(callback.data.split(":")[2])
    
    stmt_st = select(Student.id).where(Student.user_id == db_user.id)
    student_id = await session.scalar(stmt_st)
    
    from bot.models.education import Group, Attendance, HomeworkSubmission, Lesson
    from bot.models.user import Teacher
    
    stmt = (
        select(Group)
        .where(Group.id == group_id)
        .options(
            selectinload(Group.course),
            selectinload(Group.teacher).selectinload(Teacher.user)
        )
    )
    group = await session.scalar(stmt)
    
    if not group:
        await callback.answer("Группа не найдена", show_alert=True)
        return
        
    teacher_name = group.teacher.user.full_name if group.teacher and group.teacher.user else "Не назначен"
    
    att_stmt = select(func.count(Attendance.id)).join(Lesson).where(
        Attendance.student_id == student_id, 
        Attendance.status == "present",
        Lesson.group_id == group_id
    )
    lessons_attended = await session.scalar(att_stmt) or 0
    lessons_total = group.course.lessons_count or 12
    progress_percent = min(100.0, (lessons_attended / lessons_total) * 100) if lessons_total else 0.0
    p_bar = get_progress_bar(progress_percent)
    
    hw_stmt = (
        select(HomeworkSubmission)
        .join(Lesson)
        .where(HomeworkSubmission.student_id == student_id, Lesson.group_id == group_id)
        .order_by(HomeworkSubmission.created_at.desc())
        .limit(1)
    )
    last_hw = await session.scalar(hw_stmt)
    
    hw_text = "Нет сданных заданий"
    if last_hw:
        if last_hw.status == "accepted":
            hw_text = f"✅ Принято (Оценка: {last_hw.grade if last_hw.grade else 'Нет'})"
        elif last_hw.status == "rejected":
            hw_text = "❌ Отклонено (Требуется доработка)"
        else:
            hw_text = "⏳ На проверке"
            
        if last_hw.teacher_comment:
            hw_text += f"\nКомментарий учителя: {last_hw.teacher_comment}"
    
    text = (
        f"📚 *{group.course.name}*\n"
        f"――――――――――――――――\n"
        f"👨‍🏫 *Учитель:* `{teacher_name}`\n"
        f"📊 *Прогресс:* `{p_bar}`\n"
        f"✅ *Посещено уроков:* `{lessons_attended}/{lessons_total}`\n\n"
        f"📝 *Домашка:*\n   {hw_text}"
    )
    
    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔙 Назад к курсам", callback_data="student:courses")]
    ])
    
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
