import random
import logging
from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession
from bot.models.user import User
from bot.states.student import ProfileEditStates
from bot.keyboards.student import get_back_to_cabinet_kb

router = Router(name="student_profile")
logger = logging.getLogger(__name__)

@router.callback_query(F.data.in_(["student:profile", "teacher:profile"]))
async def view_profile(callback: types.CallbackQuery, db_user: User):
    """Экран профиля с кнопками редактирования."""
    from bot.models.user import UserRole
    
    role_str = "Преподаватель" if db_user.role == UserRole.TEACHER else "Ученик"
    if db_user.role == UserRole.ADMIN: role_str = "Администратор"
    
    text = (
        f"👤 *Мой профиль*\n\n"
        f"📍 *Имя:* {db_user.full_name}\n"
        f"📱 *Телефон:* `{db_user.phone or 'не указан'}`\n"
        f"🔗 *Username:* @{db_user.username or 'отсутствует'}\n"
        f"🎓 *Роль:* {role_str}\n\n"
        f"Для защиты данных изменение ФИО или телефона требует подтверждения кодом."
    )
    
    back_cb = "teacher:main" if db_user.role in [UserRole.TEACHER, UserRole.ADMIN] else "student:main"
    
    kb = types.InlineKeyboardMarkup(inline_keyboard=[
        [types.InlineKeyboardButton(text="✏️ Изменить Имя", callback_data="p_edit:name")],
        [types.InlineKeyboardButton(text="📱 Изменить Телефон", callback_data="p_edit:phone")],
        [types.InlineKeyboardButton(text="⬅️ Меню", callback_data=back_cb)]
    ])
    
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)

@router.callback_query(F.data.startswith("p_edit:"))
async def start_profile_edit(callback: types.CallbackQuery, state: FSMContext, db_user: User):
    from bot.models.user import UserRole
    field = callback.data.split(":")[1]
    await state.update_data(editing_field=field)
    
    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
    back_cb = "teacher:profile" if db_user.role in [UserRole.TEACHER, UserRole.ADMIN] else "student:profile"
    kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="❌ Отмена", callback_data=back_cb)]])
    
    if field == "name":
        await callback.message.edit_text("📝 Введите ваше новое Имя (ФИО):", reply_markup=kb)
        await state.set_state(ProfileEditStates.waiting_for_new_name)
    else:
        await callback.message.edit_text("📱 Введите ваш новый номер телефона:", reply_markup=kb)
        await state.set_state(ProfileEditStates.waiting_for_new_phone)

@router.message(ProfileEditStates.waiting_for_new_name)
@router.message(ProfileEditStates.waiting_for_new_phone)
async def request_verification(message: types.Message, state: FSMContext):
    new_value = message.text
    # Генерируем секретный код
    code = str(random.randint(1000, 9999))
    await state.update_data(pending_value=new_value, verify_code=code)
    
    await message.answer(
        f"🔐 *Подтверждение изменения*\n\n"
        f"Новое значение: `{new_value}`\n\n"
        f"Ваш код подтверждения: *{code}*\n"
        f"Введите этот код в чат, чтобы применить изменения:",
        parse_mode="Markdown"
    )
    await state.set_state(ProfileEditStates.waiting_for_verification_code)

@router.message(ProfileEditStates.waiting_for_verification_code)
async def finalize_edit(message: types.Message, state: FSMContext, session: AsyncSession, db_user: User):
    data = await state.get_data()
    user_code = message.text
    correct_code = data['verify_code']
    field = data['editing_field']
    new_value = data['pending_value']
    
    if user_code != correct_code:
        await message.answer("❌ Неверный код. Попробуйте снова или отмените редактирование /cabinet")
        return

    # Применяем изменения к db_user (уже подгружен Middleware)
    if field == "name":
        db_user.full_name = new_value
    else:
        db_user.phone = new_value
        
    await session.commit()
    
    from bot.models.user import UserRole
    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
    back_cb = "teacher:profile" if db_user.role in [UserRole.TEACHER, UserRole.ADMIN] else "student:profile"
    kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="⬅️ Ок, назад в профиль", callback_data=back_cb)]])
    
    await message.answer("✅ Данные успешно обновлены!", reply_markup=kb)
    await state.clear()
