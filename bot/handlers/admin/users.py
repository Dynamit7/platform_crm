from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession
from bot.repositories.user import UserRepository
from bot.states.admin import AdminUserStates
from bot.models.user import UserRole

router = Router(name="admin_users")

@router.callback_query(F.data == "admin_users:search")
async def start_user_search(callback: types.CallbackQuery, state: FSMContext):
    """Переход в режим поиска."""
    await callback.message.edit_text(
        "🔍 *Поиск пользователя*\n\nВведите имя, телефон или @username пользователя для поиска в базе:",
        parse_mode="Markdown",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
            [types.InlineKeyboardButton(text="❌ Отмена", callback_data="admin:users")]
        ])
    )
    await state.set_state(AdminUserStates.waiting_for_search_query)
    await callback.answer()

@router.message(AdminUserStates.waiting_for_search_query)
async def process_user_search(message: types.Message, state: FSMContext, session: AsyncSession):
    """Результаты поиска пользователей."""
    query = message.text
    user_repo = UserRepository(session)
    users = await user_repo.search_users(query)
    
    if not users:
        await message.answer(
            f"❌ Пользователь \"{query}\" не найден. Попробуйте другой запрос или вернитесь назад.",
            reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
                [types.InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:users")]
            ])
        )
        return

    # Формируем список найденных
    text = f"🔎 *Результаты поиска ({len(users)}):*\n\n"
    keyboard_buttons = []
    
    for user in users:
        role_emoji = "🎓" if user.role == UserRole.STUDENT else "👨‍🏫" if user.role == UserRole.TEACHER else "🛡"
        text += f"{role_emoji} {user.full_name} | @{user.username if user.username else '---'}\n"
        keyboard_buttons.append([
            types.InlineKeyboardButton(
                text=f"⚙️ Управлять: {user.full_name[:20]}...", 
                callback_data=f"user_manage:{user.id}"
            )
        ])
    
    keyboard_buttons.append([types.InlineKeyboardButton(text="⬅️ Назад к поиску", callback_data="admin_users:search")])
    
    await message.answer(text, parse_mode="Markdown", reply_markup=types.InlineKeyboardMarkup(inline_keyboard=keyboard_buttons))
    await state.clear()

@router.callback_query(F.data.startswith("user_manage:"))
async def manage_user_profile(callback: types.CallbackQuery, session: AsyncSession):
    """Карточка управления конкретным пользователем."""
    user_id = int(callback.data.split(":")[1])
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id)
    
    if not user:
        await callback.answer("Пользователь не найден")
        return

    status = "✅ Активен" if user.is_active else "🚫 Заблокирован"
    role_icon = {
        UserRole.STUDENT: "🎓",
        UserRole.TEACHER: "👨‍🏫",
        UserRole.ADMIN: "🛡",
    }.get(user.role, "👤")
    
    role_name = {
        UserRole.STUDENT: "Студент",
        UserRole.TEACHER: "Преподаватель",
        UserRole.ADMIN: "Администратор",
    }.get(user.role, "---")

    text = (
        f"{role_icon} *Профиль пользователя*\n"
        f"――――――――――――――――――――\n"
        f"👤 Имя: *{user.full_name}*\n"
        f"🎭 Роль: `{role_name}`\n"
        f"📞 Тел: `{user.phone}`\n"
        f"📊 Статус: {status}\n"
        f"🌐 TG ID: `{user.telegram_id}`\n"
        f"――――――――――――――――――――"
    )
    
    buttons = [
        [
            types.InlineKeyboardButton(
                text="🚫 Заблокировать" if user.is_active else "✅ Разблокировать", 
                callback_data=f"user_toggle:{user.id}")
        ],
    ]

    # Если это не админ, даем менять роль
    if user.role != UserRole.ADMIN:
        buttons.append([
            types.InlineKeyboardButton(text="👨‍🏫 Сделать учителем", callback_data=f"user_role:{user.id}:teacher"),
            types.InlineKeyboardButton(text="🎓 Сделать студентом", callback_data=f"user_role:{user.id}:student")
        ])

    # Если это студент — добавляем кнопку управления учеником (заморозка, группы и т.д.)
    if user.role == UserRole.STUDENT:
        buttons.append([
            types.InlineKeyboardButton(text="👜 Управление учеником", callback_data=f"student_view:{user.id}")
        ])
    
    buttons.append([types.InlineKeyboardButton(text="⬅️ Назад к поиску", callback_data="admin_users:search")])
    
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=types.InlineKeyboardMarkup(inline_keyboard=buttons))
    await callback.answer()

@router.callback_query(F.data.startswith("user_role:"))
async def change_user_role(callback: types.CallbackQuery, session: AsyncSession):
    parts = callback.data.split(":")
    user_id = int(parts[1])
    new_role = parts[2]
    
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id)
    if not user:
        return await callback.answer("Ошибка: пользователь не найден")

    if new_role == "student":
        # Используем существующий надежный сервис для всех проверок и создания ученика
        from bot.services.registration_service import RegistrationService
        reg_service = RegistrationService(session)
        student = await reg_service.approve_application(user_id)
        # Уведомляем ученика
        from bot.services.notification_service import NotificationService
        from aiogram import Bot
        notifier = NotificationService(callback.bot)
        await notifier.notify_user_status_change(
            user.telegram_id, 
            f"🎉 *Ваш аккаунт получил статус Ученика!*\n\n"
            f"🆔 Ваш код: `{student.student_code}`\n\n"
            f"Теперь вам доступен Личный Кабинет ученика. Нажмите /cabinet или перезапустите бота."
        )
    elif new_role == "teacher":
        from sqlalchemy import select
        from bot.models.user import Teacher
        user.role = UserRole.TEACHER
        user.is_active = True
        teacher_exists = await session.scalar(select(Teacher).where(Teacher.user_id == user.id))
        if not teacher_exists:
            session.add(Teacher(user_id=user.id, is_active=True))
        await session.commit()
        # Уведомляем учителя
        from bot.services.notification_service import NotificationService
        notifier = NotificationService(callback.bot)
        await notifier.notify_user_status_change(
            user.telegram_id, 
            f"🎓 *Ваш аккаунт получил статус Преподавателя!*\n\n"
            f"Теперь вам доступна Панель Учителя. Нажмите /cabinet чтобы войти."
        )

    await callback.answer(f"✅ Успешно назначен: {new_role.upper()}", show_alert=True)
    # Перерисовываем карточку
    await manage_user_profile(callback, session)

@router.callback_query(F.data.startswith("user_toggle:"))
async def toggle_user_status(callback: types.CallbackQuery, session: AsyncSession):
    user_id = int(callback.data.split(":")[1])
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id)
    if user:
        user.is_active = not user.is_active
        await session.commit()
        await callback.answer("✅ Статус аккаунта изменен")
    
    await manage_user_profile(callback, session)
