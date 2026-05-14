import logging
from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from bot.models.settings import GlobalSetting
from bot.keyboards.admin_settings import get_admin_settings_main_kb
from bot.keyboards.admin import get_admin_main_kb

router = Router(name="admin_settings")
logger = logging.getLogger(__name__)

class SettingsStates(StatesGroup):
    waiting_for_value = State()

async def get_setting(session: AsyncSession, key: str, default: str = "") -> str:
    stmt = select(GlobalSetting).where(GlobalSetting.key == key)
    result = await session.execute(stmt)
    setting = result.scalar_one_or_none()
    return setting.value if setting else default

@router.callback_query(F.data == "admin:settings")
async def show_settings_main(callback: types.CallbackQuery, session: AsyncSession):
    """Главный экран настроек."""
    center_name = await get_setting(session, "center_name", "SmartEdu Center")
    center_phone = await get_setting(session, "center_phone", "+998 00 000 00 00")
    
    text = (
        "⚙️ *Настройки учебного центра*\n\n"
        f"🏢 Название: `{center_name}`\n"
        f"📞 Телефон: `{center_phone}`\n\n"
        "Выберите категорию для изменения:"
    )
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=get_admin_settings_main_kb())

@router.callback_query(F.data == "admin_set:backup")
async def send_db_backup(callback: types.CallbackQuery):
    import os
    from aiogram.types import FSInputFile
    db_path = "education_center_v2.db"
    if os.path.exists(db_path):
        document = FSInputFile(db_path)
        await callback.message.answer_document(document, caption="💾 ЭКСТРЕННЫЙ БЭКАП БАЗЫ ДАННЫХ\n\nНикому не передавайте этот файл!")
        await callback.answer()
    else:
        await callback.answer("❌ Файл базы данных не найден!", show_alert=True)

@router.callback_query(F.data == "admin_set:info")
async def show_info_settings(callback: types.CallbackQuery, session: AsyncSession):
    name = await get_setting(session, "center_name", "SmartEdu")
    address = await get_setting(session, "center_address", "Не указан")
    
    text = (
        "🏢 *Информация о центре*\n\n"
        f"Название: `{name}`\n"
        f"Адрес: `{address}`"
    )
    
    kb = types.InlineKeyboardMarkup(inline_keyboard=[
        [types.InlineKeyboardButton(text="✏️ Изменить название", callback_data="set_edit:center_name")],
        [types.InlineKeyboardButton(text="✏️ Изменить адрес", callback_data="set_edit:center_address")],
        [types.InlineKeyboardButton(text="⬅️ Назад", callback_data="admin_menu:settings")]
    ])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)

@router.callback_query(F.data.startswith("set_edit:"))
async def start_setting_edit(callback: types.CallbackQuery, state: FSMContext):
    key = callback.data.split(":")[1]
    await state.update_data(edit_key=key)
    await callback.message.answer(f"✍️ Введите новое значение для `{key}`:")
    await state.set_state(SettingsStates.waiting_for_value)
    await callback.answer()

@router.message(SettingsStates.waiting_for_value)
async def finalize_setting_edit(message: types.Message, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    key = data['edit_key']
    new_value = message.text
    
    # Пытаемся обновить или создать
    stmt = select(GlobalSetting).where(GlobalSetting.key == key)
    res = await session.execute(stmt)
    setting = res.scalar_one_or_none()
    
    if setting:
        setting.value = new_value
    else:
        session.add(GlobalSetting(key=key, value=new_value, description=None))
    
    await session.commit()
    await message.answer(f"✅ Настройка `{key}` успешно обновлена!", reply_markup=get_admin_main_kb())
    await state.clear()
