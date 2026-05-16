from aiogram import Router, types, F
from sqlalchemy.ext.asyncio import AsyncSession
from bot.models.user import User
from bot.keyboards.student import get_back_to_cabinet_kb
import aiohttp
from bot.config import config
import logging

router = Router(name="student_schedule")
logger = logging.getLogger(__name__)

@router.message(F.text == "📅 Расписание")
@router.callback_query(F.data == "student:schedule")
async def view_student_schedule(event: types.TelegramObject, session: AsyncSession, db_user: User):
    """Просмотр расписания занятий для ученика (данные из CRM)."""
    
    text = "🗓 *Ваше ближайшее расписание*\n――――――――――――――――\n"
    
    try:
        async with aiohttp.ClientSession() as http_session:
            async with http_session.get(f"{config.API_URL}/student/{db_user.telegram_id}/schedule", timeout=5) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    lessons = data.get("lessons", [])
                    
                    if not lessons:
                        text += "🌴 _Занятий на ближайшее время не запланировано._"
                    else:
                        for l in lessons:
                            text += f"🔹 `{l['date']} {l['time']}` | *{l['group_name']}*\n   _{l['topic']}_\n"
                            if l.get('zoom_link'):
                                text += f"   🔗 [Zoom]({l['zoom_link']})\n"
                else:
                    text += "❌ _Не удалось загрузить расписание._"
    except Exception as e:
        logger.error(f"Failed to fetch schedule from CRM: {e}")
        text += "❌ _Сервис временно недоступен._"

    if isinstance(event, types.CallbackQuery):
        await event.message.edit_text(text, parse_mode="Markdown", reply_markup=get_back_to_cabinet_kb())
        await event.answer()
    else:
        # If it's a message
        msg = event.message if hasattr(event, "message") else event
        await msg.answer(text, parse_mode="Markdown", reply_markup=get_back_to_cabinet_kb())

