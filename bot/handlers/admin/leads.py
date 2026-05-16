import logging
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.fsm.context import FSMContext
from bot.config import config
from bot.middlewares.auth import AuthMiddleware
import aiohttp

logger = logging.getLogger(__name__)
router = Router()
router.message.middleware(AuthMiddleware())
router.callback_query.middleware(AuthMiddleware())

API = config.API_URL.rstrip("/")
BOT_SECRET = config.BOT_TOKEN

STATUS_EMOJI = {"new": "🆕", "contacted": "📞", "enrolled": "✅", "lost": "❌"}


async def _api_get(path: str):
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(10)) as s:
        async with s.get(f"{API}{path}", headers={"X-Bot-Secret": BOT_SECRET}) as r:
            return await r.json() if r.status == 200 else None


async def _api_post(path: str, data: dict = None):
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(10)) as s:
        async with s.post(f"{API}{path}", json=data or {}, headers={"X-Bot-Secret": BOT_SECRET}) as r:
            return await r.json() if r.status == 200 else None


# Admin lead panel entry
@router.callback_query(F.data == "admin:leads")
async def leads_menu(cq: CallbackQuery):
    funnel = await _api_get("/leads/funnel") or {}
    lines = [
        "📊 *Воронка продаж*",
        f"├ Всего: {funnel.get('total', 0)}",
        f"├ 🆕 Новые: {funnel.get('new', 0)}",
        f"├ 📞 В работе: {funnel.get('contacted', 0)}",
        f"├ ✅ Зачислены: {funnel.get('enrolled', 0)}",
        f"├ ❌ Потеряны: {funnel.get('lost', 0)}",
        f"└ 📈 Конверсия: {funnel.get('conversion_rate', 0)}%",
    ]
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🆕 Новые", callback_data="leads_list:new")],
        [InlineKeyboardButton(text="📞 В работе", callback_data="leads_list:contacted")],
        [InlineKeyboardButton(text="✅ Зачислены", callback_data="leads_list:enrolled")],
        [InlineKeyboardButton(text="❌ Потеряны", callback_data="leads_list:lost")],
        [InlineKeyboardButton(text="📋 Все заявки", callback_data="leads_list:all")],
        [InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:main")],
    ])
    await cq.message.edit_text("\n".join(lines), reply_markup=kb)
    await cq.answer()


@router.callback_query(F.data.startswith("leads_list:"))
async def leads_list(cq: CallbackQuery):
    status = cq.data.split(":")[1]
    params = f"?status={status}" if status != "all" else ""
    leads = await _api_get(f"/leads{params}") or []
    if not leads:
        return await cq.message.edit_text("Нет заявок", reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[[InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:leads")]]
        ))
    lines = [f"📋 *Заявки* — {status if status != 'all' else 'все'}"]
    for l in leads[:15]:
        emoji = STATUS_EMOJI.get(l.get("status", ""), "📋")
        lines.append(f"\n{emoji} *{l['name']}* — {l.get('phone', '')}")
        if l.get("course"):
            lines[-1] += f"\n    📚 {l['course']}"
        lines[-1] += f"\n    🕐 {l.get('created_at', '')[:10]}"
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text=l['name'], callback_data=f"lead_view:{l['id']}")]
        for l in leads[:10]
    ] + [[InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:leads")]])
    await cq.message.edit_text("\n".join(lines), reply_markup=kb)
    await cq.answer()


@router.callback_query(F.data.startswith("lead_view:"))
async def lead_detail(cq: CallbackQuery):
    lead_id = int(cq.data.split(":")[1])
    lead = await _api_get(f"/leads/{lead_id}")
    if not lead:
        return await cq.answer("Ошибка загрузки", show_alert=True)
    emoji = STATUS_EMOJI.get(lead.get("status", ""), "📋")
    lines = [
        f"{emoji} *{lead['name']}*",
        f"📞 {lead.get('phone', '—')}",
        f"📧 {lead.get('email', '—')}",
        f"📚 Курс: {lead.get('course', '—')}",
        f"📋 Статус: {lead['status']}",
        f"📎 Источник: {lead.get('source', '—')}",
        f"📝 {lead.get('notes', '—')}",
        f"🕐 {lead.get('created_at', '')}",
    ]
    if lead.get("history"):
        lines.append("\n*История:*")
        for h in lead["history"][:5]:
            old = h.get("old") or "—"
            lines.append(f"  {old} → {h['new']} ({h.get('at', '')[:10]})")
            if h.get("comment"):
                lines[-1] += f" — {h['comment']}"
    status_buttons = []
    for s in ["new", "contacted", "enrolled", "lost"]:
        if s != lead["status"]:
            status_buttons.append(
                InlineKeyboardButton(text=f"{STATUS_EMOJI[s]} {s}", callback_data=f"lead_status:{lead_id}:{s}")
            )
    kb_rows = [status_buttons[i:i+2] for i in range(0, len(status_buttons), 2)]
    if lead["status"] != "enrolled":
        kb_rows.append([InlineKeyboardButton(text="✅ Конвертировать", callback_data=f"lead_convert:{lead_id}")])
    kb_rows.append([InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:leads")])
    kb = InlineKeyboardMarkup(inline_keyboard=kb_rows)
    await cq.message.edit_text("\n".join(lines), reply_markup=kb)
    await cq.answer()


@router.callback_query(F.data.startswith("lead_status:"))
async def lead_change_status(cq: CallbackQuery):
    _, lead_id, new_status = cq.data.split(":")
    await _api_post(f"/leads/{lead_id}/status", {"status": new_status})
    await cq.answer(f"Статус изменён на {new_status}")
    # refresh
    await lead_detail(cq)


@router.callback_query(F.data.startswith("lead_convert:"))
async def lead_convert(cq: CallbackQuery):
    lead_id = int(cq.data.split(":")[1])
    result = await _api_post(f"/leads/{lead_id}/convert")
    if result:
        await cq.answer("✅ Конвертирован в студента")
    else:
        await cq.answer("❌ Ошибка конвертации", show_alert=True)
    await lead_detail(cq)
