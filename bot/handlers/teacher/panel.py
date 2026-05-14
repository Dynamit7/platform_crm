import logging
from aiogram import Router, types, F
from aiogram.filters import Command
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

class BroadcastStates(StatesGroup):
    waiting_for_message = State()

from bot.models.user import User, UserRole, Teacher
from bot.models.education import Group
from bot.keyboards.teacher import get_teacher_main_kb, get_teacher_groups_kb, get_group_manage_kb

router = Router(name="teacher_panel")
logger = logging.getLogger(__name__)

@router.message(Command("teacher"))
@router.callback_query(F.data == "teacher:main")
async def show_teacher_panel(event: types.TelegramObject, db_user: User):
    """Вход в панель преподавателя."""
    if db_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        return

    text = (
        f"👨‍🏫 *Панель преподавателя*\n\n"
        f"Здравствуйте, {db_user.full_name}!\n"
        f"Здесь вы можете управлять своими группами и проверять задания."
    )
    
    kb = get_teacher_main_kb()
    if isinstance(event, types.Message):
        await event.answer(text, parse_mode="Markdown", reply_markup=kb)
    else:
        await event.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
        await event.answer()

@router.callback_query(F.data == "teacher:groups")
async def list_teacher_groups(callback: types.CallbackQuery, session: AsyncSession, db_user: User):
    """Список групп, в которых преподает юзер."""
    # Получаем запись учителя
    stmt = select(Teacher).where(Teacher.user_id == db_user.id)
    res = await session.execute(stmt)
    teacher = res.scalar_one_or_none()
    
    if not teacher:
        await callback.answer("❌ Профиль учителя не найден в системе", show_alert=True)
        return

    # Ищем группы
    stmt = select(Group).where(Group.teacher_id == teacher.id).options(selectinload(Group.course))
    res = await session.execute(stmt)
    groups = res.scalars().all()
    
    if not groups:
        await callback.message.edit_text("ℹ️ У вас пока нет назначенных групп.", reply_markup=get_teacher_main_kb())
        return

    text = "👥 *Ваши учебные группы:* \n\n"
    for g in groups:
        text += f"🔹 *{g.name}* | {g.course.name}\n"
        
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=get_teacher_groups_kb(groups))

@router.callback_query(F.data.startswith("t_group:"))
async def manage_group(callback: types.CallbackQuery):
    group_id = int(callback.data.split(":")[1])
    await callback.message.edit_text(
        f"⚙️ *Управление группой ID {group_id}*\n\nВыберите действие:",
        parse_mode="Markdown",
        reply_markup=get_group_manage_kb(group_id)
    )
    await callback.answer()

@router.callback_query(F.data.startswith("t_broadcast_start:"))
async def start_broadcast(callback: types.CallbackQuery, state: FSMContext):
    group_id = int(callback.data.split(":")[1])
    await state.update_data(broadcast_group_id=group_id)
    
    await callback.message.edit_text(
        "📢 *Рассылка группе*\n\n"
        "Введите сообщение, которое хотите отправить всем ученикам этой группы. "
        "Оно придет им от лица бота с вашей подписью.\n\n"
        "_(Для отмены введите /cancel)_",
        parse_mode="Markdown"
    )
    await state.set_state(BroadcastStates.waiting_for_message)

@router.message(BroadcastStates.waiting_for_message)
async def process_broadcast_message(message: types.Message, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    group_id = data.get("broadcast_group_id")
    text = message.text
    
    if not text:
        await message.answer("Пожалуйста, отправьте текстовое сообщение.")
        return
        
    from bot.models.education import StudentGroup
    from bot.models.user import Student
    from bot.notifications.service import NotificationService
    
    stmt = (
        select(StudentGroup)
        .where(StudentGroup.group_id == group_id, StudentGroup.status == "active")
        .options(selectinload(StudentGroup.student).selectinload(Student.user))
    )
    links = (await session.execute(stmt)).scalars().all()
    
    notifier = NotificationService(message.bot)
    count = 0
    for link in links:
        if link.student and link.student.user and link.student.is_active:
            try:
                await notifier.notify_user_status_change(
                    link.student.user.telegram_id,
                    f"📢 *Сообщение от преподавателя:*\n\n{text}"
                )
                count += 1
            except Exception as e:
                logger.error(f"Failed to broadcast to {link.student.user.id}: {e}")
                
    await message.answer(
        f"✅ Сообщение успешно отправлено {count} ученикам(у)!",
        reply_markup=get_teacher_main_kb()
    )
    await state.clear()

@router.callback_query(F.data == "teacher:profile")
async def show_teacher_profile(callback: types.CallbackQuery, session: AsyncSession, db_user: User):
    stmt = select(Teacher).options(selectinload(Teacher.user)).where(Teacher.user_id == db_user.id)
    t = (await session.execute(stmt)).scalar_one_or_none()
    
    if not t:
        return await callback.answer("Профиль не найден", show_alert=True)
        
    text = (
        f"👤 *Ваш профиль преподавателя*\n\n"
        f"Имя: {t.user.full_name}\n"
        f"Специализация: {t.specialization or 'Не указана'}\n"
    )
    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
    builder = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="⬅️ Назад", callback_data="teacher:main")]])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=builder)
