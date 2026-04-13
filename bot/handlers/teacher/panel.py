import logging
from aiogram import Router, types, F
from aiogram.filters import Command
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

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
