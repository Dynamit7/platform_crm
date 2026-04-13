import asyncio
import logging
from aiogram import Router, types, F, Bot
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from bot.models.user import User
from bot.states.admin import AdminBroadcastStates
from bot.keyboards.admin import get_admin_main_kb
from bot.keyboards.admin_broadcast import get_broadcast_audience_kb, get_broadcast_confirm_kb

router = Router(name="admin_broadcast")
logger = logging.getLogger(__name__)

@router.callback_query(F.data == "admin:broadcast")
async def start_broadcast_wizard(callback: types.CallbackQuery, state: FSMContext):
    """Шаг 1: Выбор аудитории."""
    await callback.message.edit_text(
        "📢 *Массовая рассылка*\n\nВыберите целевую аудиторию:",
        parse_mode="Markdown",
        reply_markup=get_broadcast_audience_kb()
    )
    await state.set_state(AdminBroadcastStates.waiting_for_audience)

@router.callback_query(AdminBroadcastStates.waiting_for_audience, F.data.startswith("br_target:"))
async def select_audience(callback: types.CallbackQuery, state: FSMContext):
    """Шаг 2: Ожидание контента."""
    audience = callback.data.split(":")[1]
    await state.update_data(target_audience=audience)
    
    audience_text = {
        "all": "Всем пользователям",
        "student": "Только студентам",
        "teacher": "Только преподавателям",
        "pending": "Ожидающим (Pending)"
    }.get(audience)
    
    await callback.message.edit_text(
        f"🎯 Цель: *{audience_text}*\n\nТеперь отправьте сообщение, которое нужно разослать. \n"
        f"Поддерживаются: текст, фото, видео, документы и опросы.",
        parse_mode="Markdown"
    )
    await state.set_state(AdminBroadcastStates.waiting_for_content)

@router.message(AdminBroadcastStates.waiting_for_content)
async def preview_broadcast(message: types.Message, state: FSMContext):
    """Шаг 3: Предпросмотр."""
    await state.update_data(broadcast_message_id=message.message_id, from_chat_id=message.chat.id)
    
    await message.answer(
        "👀 *Предпросмотр сообщения выше.*\n\nВы уверены, что хотите запустить рассылку?",
        parse_mode="Markdown",
        reply_to_message_id=message.message_id,
        reply_markup=get_broadcast_confirm_kb()
    )
    await state.set_state(AdminBroadcastStates.confirm_send)

@router.callback_query(AdminBroadcastStates.confirm_send, F.data == "br_action:send")
async def execute_broadcast(callback: types.CallbackQuery, state: FSMContext, session: AsyncSession, bot: Bot):
    """Шаг 4: Выполнение."""
    data = await state.get_data()
    audience = data['target_audience']
    msg_id = data['broadcast_message_id']
    from_chat = data['from_chat_id']
    
    # Формируем запрос к БД в зависимости от аудитории
    stmt = select(User)
    if audience != "all":
        stmt = stmt.where(User.role == audience)
    
    result = await session.execute(stmt)
    users = result.scalars().all()
    
    await callback.message.edit_text(f"🚀 Рассылка для {len(users)} чел. запущена...")
    await state.clear()
    
    success = 0
    fail = 0
    
    for u in users:
        try:
            await bot.copy_message(
                chat_id=u.telegram_id,
                from_chat_id=from_chat,
                message_id=msg_id
            )
            success += 1
            await asyncio.sleep(0.05)
        except Exception as e:
            logger.error(f"Broadcast failed for {u.telegram_id}: {e}")
            fail += 1
            
    await callback.message.answer(
        f"✅ *Рассылка завершена!*\n\n📊 Итог:\n- Успешно: {success}\n- Ошибок: {fail}",
        parse_mode="Markdown",
        reply_markup=get_admin_main_kb()
    )
