import logging
from aiogram import Router, types, F
from aiogram.filters import Command
from aiogram.exceptions import TelegramBadRequest
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from bot.models.user import User, UserRole
from bot.keyboards.admin import (
    get_admin_main_kb, get_admin_apps_kb, 
    get_admin_users_kb, get_admin_groups_kb,
    get_admin_reports_keyboard
)

router = Router(name="admin_panel")
logger = logging.getLogger(__name__)

async def safe_edit_text(callback: types.CallbackQuery, text: str, reply_markup: types.InlineKeyboardMarkup):
    """Безопасное редактирование текста сообщения (предотвращает ошибку 'not modified')."""
    try:
        await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=reply_markup)
    except TelegramBadRequest as e:
        if "message is not modified" in str(e):
            pass 
        else:
            raise e

@router.message(Command("admin"))
async def cmd_admin_panel(message: types.Message, db_user: User, session: AsyncSession):
    """Вход в админку по команде."""
    if not db_user or db_user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN):
        return
    
    from sqlalchemy import func
    from bot.models.user import User as UserModel, UserRole as UR
    from bot.models.education import Group
    from bot.models.education import Registration

    total_students = await session.scalar(select(func.count(UserModel.id)).where(UserModel.role == UR.STUDENT)) or 0
    total_groups = await session.scalar(select(func.count(Group.id)).where(Group.is_active == True)) or 0
    pending_apps = await session.scalar(select(func.count(Registration.id)).where(Registration.status_code == "pending")) or 0

    text = (
        "🛡 *SmartEdu — Панель администратора*\n"
        "――――――――――――――――――――\n"
        f"👥 Учеников: `{total_students}`   "
        f"🏫 Групп: `{total_groups}`   "
        f"📝 Заявок: `{pending_apps}`\n"
        "――――――――――――――――――――\n"
        "Выберите раздел для управления:"
    )
    await message.answer(text, parse_mode="Markdown", reply_markup=get_admin_main_kb())

@router.callback_query(F.data.startswith("admin:"))
async def handle_admin_navigation(callback: types.CallbackQuery, db_user: User, session: AsyncSession, state: FSMContext):
    """Центральный обработчик навигации админ-панели."""
    print(f"[DEBUG] Admin Callback: {callback.data}")
    if not db_user or db_user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN):
        await callback.answer("❌ Доступ запрещен", show_alert=True)
        return

    action = callback.data.split(":")[1]

    if action == "main":
        from sqlalchemy import func
        from bot.models.user import User as UserModel, UserRole as UR
        from bot.models.education import Group, Registration
        total_students = await session.scalar(select(func.count(UserModel.id)).where(UserModel.role == UR.STUDENT)) or 0
        total_groups = await session.scalar(select(func.count(Group.id)).where(Group.is_active == True)) or 0
        pending_apps = await session.scalar(select(func.count(Registration.id)).where(Registration.status_code == "pending")) or 0
        text = (
            "🛡 *SmartEdu — Панель администратора*\n"
            "――――――――――――――――――――\n"
            f"👥 Учеников: `{total_students}`   "
            f"🏫 Групп: `{total_groups}`   "
            f"📝 Заявок: `{pending_apps}`\n"
            "――――――――――――――――――――\n"
            "Выберите раздел для управления:"
        )
        await safe_edit_text(callback, text, get_admin_main_kb())
    
    elif action == "apps":
        await safe_edit_text(callback, "📝 *Управление заявками*\n\nПросматривайте новые анкеты и одобряйте регистрацию учеников.", get_admin_apps_kb())

    elif action == "users":
        await safe_edit_text(callback, "👥 *База пользователей*\n\nУправление учениками, учителями и правами доступа.", get_admin_users_kb())

    elif action == "students":
        from .students import list_all_students
        await list_all_students(callback, session)

    elif action == "teachers":
        from .teachers import show_teachers_menu
        await show_teachers_menu(callback)

    elif action == "groups":
        await safe_edit_text(callback, "🏫 *Учебные группы*\n\nПросмотр списка групп и создание новых учебных единиц.", get_admin_groups_kb())

    elif action == "schedule":
        from .schedule import show_schedule_main
        await show_schedule_main(callback)

    elif action == "finance":
        from .finance import show_finance_dashboard
        await show_finance_dashboard(callback, session)

    elif action == "courses":
        from .courses import list_courses
        await list_courses(callback, session)

    elif action == "broadcast":
        from .broadcast import start_broadcast_wizard
        await start_broadcast_wizard(callback, state) 

    elif action == "reports":
        await safe_edit_text(callback, "📊 *Центр аналитики*\n\nВыберите формат отчета для выгрузки в Excel:", get_admin_reports_keyboard())

    elif action == "settings":
        from .settings import show_settings_main
        await show_settings_main(callback, session)

    await callback.answer()
