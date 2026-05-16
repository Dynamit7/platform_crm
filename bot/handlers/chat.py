import logging
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from bot.config import config
from bot.middlewares.auth import AuthMiddleware
import aiohttp

logger = logging.getLogger(__name__)
router = Router()
router.message.middleware(AuthMiddleware())
router.callback_query.middleware(AuthMiddleware())

API = config.API_URL.rstrip("/")
BOT_SECRET = config.BOT_TOKEN


class ChatStates(StatesGroup):
    waiting_for_user_search = State()
    waiting_for_message = State()


async def _api_get(path: str):
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(10)) as s:
        async with s.get(f"{API}{path}", headers={"X-Bot-Secret": BOT_SECRET}) as r:
            return await r.json() if r.status == 200 else []


async def _api_post(path: str, data: dict):
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(10)) as s:
        async with s.post(f"{API}{path}", json=data, headers={"X-Bot-Secret": BOT_SECRET}) as r:
            return await r.json() if r.status == 200 else None


def _user_btn(u: dict) -> InlineKeyboardButton:
    return InlineKeyboardButton(text=f"{u['name']} ({u['role']})", callback_data=f"chat_with:{u['id']}")


@router.message(F.text == "💬 Чат")
async def chat_menu(msg: Message, data: dict):
    user = data.get("db_user")
    if not user:
        return await msg.answer("Пользователь не найден")
    web_id = getattr(user, "id", None)
    if not web_id:
        return await msg.answer("Ошибка: нет ID пользователя")
    contacts = await _api_get(f"/messages/contacts/{web_id}")
    unread = await _api_get(f"/messages/unread/{web_id}")
    unread_cnt = unread.get("unread", 0) if isinstance(unread, dict) else 0
    lines = [f"💬 *Чат*\nНепрочитано: {unread_cnt}"]
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🔍 Поиск пользователей", callback_data="chat_search")],
    ])
    if contacts:
        lines.append("\n*Последние диалоги:*")
        for c in contacts[:5]:
            last = c.get("last_message", "")[:40]
            badge = f" [{c.get('unread_count', 0)}💬]" if c.get("unread_count") else ""
            lines.append(f"• {c.get('name', '?')}{badge}: _{last}_")
        rows = [[_user_btn(c)] for c in contacts[:8]]
        kb = InlineKeyboardMarkup(inline_keyboard=rows + [[InlineKeyboardButton(text="🔍 Поиск", callback_data="chat_search")]])
    await msg.answer("\n".join(lines), reply_markup=kb)


@router.callback_query(F.data == "chat_search")
async def chat_search_start(cq: CallbackQuery, state: FSMContext, data: dict):
    await state.set_state(ChatStates.waiting_for_user_search)
    await cq.message.edit_text("Введите имя или часть имени для поиска:")
    await cq.answer()


@router.message(ChatStates.waiting_for_user_search)
async def chat_search_results(msg: Message, state: FSMContext, data: dict):
    q = msg.text.strip()
    if len(q) < 2:
        return await msg.answer("Введите минимум 2 символа")
    user = data.get("db_user")
    exclude = getattr(user, "id", None)
    results = await _api_get(f"/users/search?q={q}&exclude_id={exclude}" if exclude else f"/users/search?q={q}")
    if not results:
        return await msg.answer("Никого не найдено")
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [_user_btn(u)] for u in results[:10]
    ])
    await msg.answer(f"Найдено {len(results)}:", reply_markup=kb)
    await state.clear()


@router.callback_query(F.data.startswith("chat_with:"))
async def chat_open_conversation(cq: CallbackQuery, state: FSMContext, data: dict):
    peer_id = int(cq.data.split(":")[1])
    user = data.get("db_user")
    web_id = getattr(user, "id", None)
    if not web_id:
        return await cq.answer("Ошибка", show_alert=True)
    msgs = await _api_get(f"/messages/{web_id}?with_user={peer_id}")
    peer_name = "Пользователь"
    if msgs:
        peer_entry = next((m for m in msgs if m.get("sender_id") == peer_id), None)
        if peer_entry:
            peer_name = msgs[0].get("sender_name", "Пользователь") if msgs[0].get("sender_id") == peer_id else msgs[0].get("receiver_name", "Пользователь")
    lines = [f"💬 *{peer_name}*\n"]
    for m in msgs[-10:]:
        who = "Вы" if m["sender_id"] == web_id else peer_name
        lines.append(f"{who}: {m['content'][:100]}")
    lines.append("\n_Введите сообщение, чтобы ответить:_")
    await state.set_state(ChatStates.waiting_for_message)
    await state.update_data(peer_id=peer_id, peer_name=peer_name)
    await cq.message.edit_text("\n".join(lines))
    await cq.answer()


@router.message(ChatStates.waiting_for_message)
async def chat_send_message(msg: Message, state: FSMContext, data: dict):
    sd = await state.get_data()
    peer_id = sd.get("peer_id")
    peer_name = sd.get("peer_name", "Пользователь")
    user = data.get("db_user")
    if not user or not peer_id:
        return await msg.answer("Ошибка: выберите собеседника сначала")
    tg_id = getattr(user, "telegram_id", None) or getattr(user, "tg_id", None)
    if not tg_id:
        return await msg.answer("Ошибка: нет Telegram ID")
    result = await _api_post("/send-message", {
        "sender_tg_id": tg_id,
        "receiver_id": peer_id,
        "content": msg.text.strip()[:1000],
    })
    if result:
        await msg.answer(f"✅ Отправлено {peer_name}")
    else:
        await msg.answer("❌ Ошибка отправки")
    await state.clear()
