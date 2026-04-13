from aiogram import Router, types, F
from aiogram.filters import CommandStart
from bot.keyboards.common import get_start_keyboard
from bot.models.user import User

router = Router(name="common")

@router.message(CommandStart())
async def cmd_start(message: types.Message, db_user: User):
    is_registered = db_user is not None
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

@router.callback_query(F.data == "about:info")
async def process_about_info(callback: types.CallbackQuery):
    text = (
        "ℹ️ *О нашем учебном центре*\n\n"
        "Мы предоставляем современные курсы для развития ваших навыков. "
        "У нас работают профессиональные преподаватели и действует удобное расписание!"
    )
    await callback.answer()
    await callback.message.answer(text, parse_mode="Markdown")
