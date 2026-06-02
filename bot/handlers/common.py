from aiogram import Router, types, F
from aiogram.filters import CommandStart
from sqlalchemy.ext.asyncio import AsyncSession
from bot.keyboards.common import get_start_keyboard
from bot.models.user import User, UserRole
from aiogram.fsm.context import FSMContext
from aiogram.filters import Command, StateFilter

router = Router(name="common")

import aiohttp
from bot.config import config

@router.message(CommandStart())
async def cmd_start(message: types.Message, db_user: User, session: AsyncSession):
    # PENDING users haven't completed registration yet — show "Записаться"
    is_registered = db_user is not None and db_user.role != UserRole.PENDING

    # Save user upon /start if they don't exist
    if db_user is None:
        from bot.models.user import User as DBUser
        from sqlalchemy import select
        
        # Double check just in case
        stmt = select(DBUser).where(DBUser.telegram_id == message.from_user.id)
        existingUser = (await session.execute(stmt)).scalar_one_or_none()
        
        if not existingUser:
            new_user = DBUser(
                telegram_id=message.from_user.id,
                full_name=message.from_user.full_name,
                username=message.from_user.username,
                role=UserRole.PENDING
            )
            session.add(new_user)
            await session.commit()
            db_user = new_user

            # Sync user with Web API
            try:
                headers = {"X-Bot-Secret": config.BOT_TOKEN.get_secret_value()}
                async with aiohttp.ClientSession() as http_session:
                    payload = {
                        "telegram_id": message.from_user.id,
                        "name": message.from_user.full_name or "Без имени",
                        "phone": None,
                        "email": None
                    }
                    await http_session.post(f"{config.API_URL}/sync-user", json=payload, headers=headers, timeout=3)
            except Exception as e:
                # Log error or pass if API is unreachable
                print(f"Failed to sync user with API: {e}")

    text = (
        "👋 *Добро пожаловать в учебный центр!*\n\n"
        "Я помогу вам записаться на курсы, следить за расписанием и оценками."
    )
    if is_registered:
        text += f"\n\nРады видеть вас снова, {db_user.full_name}!"

    await message.answer(
        text,
        parse_mode="Markdown",
        reply_markup=get_start_keyboard(is_registered)
    )

@router.callback_query(F.data == "teacher:panel")
async def redirect_to_teacher_panel(callback: types.CallbackQuery, db_user: User):
    from bot.handlers.teacher.panel import show_teacher_panel
    await show_teacher_panel(callback, db_user)

@router.callback_query(F.data == "about:info")
async def process_about_info(callback: types.CallbackQuery):
    text = (
        "ℹ️ *О нашем учебном центре*\n\n"
        "Мы предоставляем современные курсы для развития ваших навыков. "
        "У нас работают профессиональные преподаватели и действует удобное расписание!"
    )
    await callback.answer()
    await callback.message.answer(text, parse_mode="Markdown")

@router.message(Command("cancel"), StateFilter("*"))
@router.message(F.text.lower().in_(["отмена", "отменить"]), StateFilter("*"))
async def cmd_cancel(message: types.Message, state: FSMContext):
    """Глобальная отмена любого состояния."""
    current_state = await state.get_state()
    if current_state is not None:
        await state.clear()
        # Попытка вернуть пользователя в стартовое меню
        await message.answer("🔄 Действие успешно отменено. Вы вернулись в нормальный режим.", parse_mode="Markdown")
    else:
        await message.answer("🤷‍♂️ Нет активных действий для отмены. Введите /cabinet или воспользуйтесь кнопками меню.")
