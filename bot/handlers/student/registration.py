import logging
from aiogram import Router, types, F, Bot
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession
from bot.states.student import RegistrationStates
from bot.services.registration_service import RegistrationService
from bot.services.notification_service import NotificationService
from bot.models.user import UserRole
from bot.config import config

router = Router(name="registration")
logger = logging.getLogger(__name__)

def get_contact_kb() -> types.ReplyKeyboardMarkup:
    """Клавиатура для запроса контакта."""
    return types.ReplyKeyboardMarkup(
        keyboard=[[types.KeyboardButton(text="📱 Отправить номер телефона", request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True
    )

@router.callback_query(F.data == "apply_start")
async def start_registration(callback: types.CallbackQuery, state: FSMContext, db_user=None):
    await callback.answer()
    if db_user and db_user.role != UserRole.PENDING:
        await callback.message.answer(f"Уважаемый {db_user.full_name}, вы уже зарегистрированы в системе.")
        return
    await callback.message.answer("👋 Начнем регистрацию! Введите ваше полное имя (ФИО):")
    await state.set_state(RegistrationStates.waiting_for_name)

@router.message(RegistrationStates.waiting_for_name)
async def process_name(message: types.Message, state: FSMContext):
    await state.update_data(full_name=message.text)
    await message.answer(
        "📱 Для регистрации нам нужен ваш номер телефона.\n"
        "Нажмите кнопку ниже, чтобы поделиться контактом:",
        reply_markup=get_contact_kb()
    )
    await state.set_state(RegistrationStates.waiting_for_phone)

@router.message(RegistrationStates.waiting_for_phone, F.contact)
async def process_phone_contact(message: types.Message, state: FSMContext):
    phone = message.contact.phone_number
    if not phone.startswith('+'):
        phone = '+' + phone
    
    await state.update_data(phone=phone)
    await message.answer(f"✅ Номер {phone} принят.", reply_markup=types.ReplyKeyboardRemove())
    await message.answer("📚 Какой курс вас интересует?")
    await state.set_state(RegistrationStates.waiting_for_course)

@router.message(RegistrationStates.waiting_for_phone)
async def process_phone_manual(message: types.Message):
    await message.answer(
        "⚠️ Пожалуйста, используйте кнопку «Отправить номер телефона» ниже:",
        reply_markup=get_contact_kb()
    )

@router.message(RegistrationStates.waiting_for_course)
async def process_course(message: types.Message, state: FSMContext):
    await state.update_data(course_interest=message.text)
    await message.answer(
        "🗓 *Запись на пробный урок*\n\n"
        "Напишите удобное для вас время (например: Завтра вечером, или В субботу после 14:00):",
        parse_mode="Markdown"
    )
    await state.set_state(RegistrationStates.waiting_for_trial_time)

@router.message(RegistrationStates.waiting_for_trial_time)
async def process_trial_time(message: types.Message, state: FSMContext, session: AsyncSession, bot: Bot):
    trial_time = message.text
    data = await state.get_data()
    
    try:
        reg_service = RegistrationService(session)
        user = await reg_service.create_new_application(
            telegram_id=message.from_user.id,
            full_name=data["full_name"],
            phone=data["phone"],
            course_interest=data["course_interest"],
            trial_time=trial_time
        )
        
        # Уведомляем админов
        notifier = NotificationService(bot)
        for admin_id in config.ADMIN_IDS:
            await bot.send_message(
                admin_id,
                f"🆕 *Новая заявка!*\n\n👤 {user.full_name}\n📞 {user.phone}\n🗓 Пробный: {trial_time}",
                parse_mode="Markdown"
            )
            
        await message.answer("✅ Ваша заявка принята! Мы свяжемся с вами для подтверждения.")
        await state.clear()
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        await message.answer("❌ Произошла системная ошибка. Попробуйте позже.")
