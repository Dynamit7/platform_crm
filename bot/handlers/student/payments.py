import logging
from aiogram import Router, types, F
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from bot.models.user import User, Student
from bot.models.user import UserRole
from bot.models.education import StudentGroup, Group, Course
from bot.models.finance import Finance
from datetime import datetime, timedelta

router = Router(name="student_payments")
logger = logging.getLogger(__name__)

from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

class StudentPaymentStates(StatesGroup):
    waiting_for_receipt = State()

async def get_monthly_fee(student_id: int, session: AsyncSession) -> float:
    stmt = select(StudentGroup).where(StudentGroup.student_id == student_id, StudentGroup.status == "active").options(selectinload(StudentGroup.group).selectinload(Group.course))
    sgs = (await session.execute(stmt)).scalars().all()
    
    total = 0.0
    for sg in sgs:
        course = sg.group.course
        if not course: continue
        
        if sg.group.max_students == 1:
            total += (course.price_individual or 0)
        else:
            total += (course.price_group or 0)
    return total

@router.message(F.text == "💳 Оплата")
@router.callback_query(F.data == "student:payments")
async def show_payment_hub(event: types.TelegramObject, session: AsyncSession, db_user: User):
    stmt = select(Student).where(Student.user_id == db_user.id)
    student = (await session.execute(stmt)).scalar_one_or_none()
    
    if not student:
        msg = "Ваш профиль студента не найден."
        if isinstance(event, types.CallbackQuery): await event.answer(msg)
        else: await event.answer(msg)
        return

    monthly_fee = await get_monthly_fee(student.id, session)
    
    pay_stmt = select(Finance).where(Finance.user_id == db_user.id, Finance.status == "succeeded").order_by(Finance.payment_date.desc())
    last_payment = (await session.execute(pay_stmt)).scalars().first()
    
    today = datetime.now()
    if last_payment:
        next_payment_date = last_payment.payment_date + timedelta(days=30)
    else:
        next_payment_date = today

    is_debtor = today > next_payment_date
    status_icon = "🔴 ДОЛГ" if is_debtor else "🟢 ОПЛАЧЕНО"
    
    usd_fee = monthly_fee / 12600.0 if monthly_fee else 0
    rub_fee = monthly_fee / 135.0 if monthly_fee else 0
    kzt_fee = monthly_fee / 28.0 if monthly_fee else 0
    
    text = (
        f"💳 *Управление оплатой*\n\n"
        f"📊 Статус: {status_icon}\n"
        f"💰 *Стоимость обучения (в месяц):*\n"
        f"🇺🇿 `{monthly_fee:,.0f}` UZS\n"
        f"🇺🇸 `~{usd_fee:,.1f}` USD\n"
        f"🇷🇺 `~{rub_fee:,.0f}` RUB\n"
        f"🇰🇿 `~{kzt_fee:,.0f}` KZT\n\n"
    )
    
    if last_payment:
        text += f"🗓 Последняя оплата: {last_payment.payment_date.strftime('%d.%m.%Y')}\n"
    
    text += f"📅 Следующая оплата до: *{next_payment_date.strftime('%d.%m.%Y')}*\n\n"
    
    if is_debtor and monthly_fee > 0:
        text += "⚠️ *Пожалуйста, оплатите обучение, чтобы продолжить занятия без ограничений.*"
    
    kb = []
    if monthly_fee > 0:
        kb.append([types.InlineKeyboardButton(text="💵 Оплатить (Прикрепить чек)", callback_data=f"st_pay_start:{monthly_fee}")])
    kb.append([types.InlineKeyboardButton(text="📜 История транзакций", callback_data="st_pay_history")])
    if isinstance(event, types.CallbackQuery):
        kb.append([types.InlineKeyboardButton(text="⬅️ Назад", callback_data="student:main")])
    
    msg = event.message if isinstance(event, types.CallbackQuery) else event
    
    if isinstance(event, types.CallbackQuery):
        await event.message.edit_text(text, parse_mode="Markdown", reply_markup=types.InlineKeyboardMarkup(inline_keyboard=kb))
        await event.answer()
    else:
        await msg.answer(text, parse_mode="Markdown", reply_markup=types.InlineKeyboardMarkup(inline_keyboard=kb))

@router.callback_query(F.data.startswith("st_pay_start:"))
async def process_payment_start(callback: types.CallbackQuery, state: FSMContext):
    amount_str = callback.data.split(":")[1]
    await state.update_data(pay_amount=float(amount_str))
    
    await callback.message.edit_text(
        "💳 *Оплата обучения*\n\n"
        "Пожалуйста, сделайте перевод по следующим реквизитам:\n"
        "Номер карты: `8600 0000 0000 0000`\n"
        "Получатель: ООО Ваша Компания\n\n"
        "После перевода сфотографируйте чек или скриншот экрана и отправьте его сюда."
        "\n_(Для отмены введите /cancel)_",
        parse_mode="Markdown"
    )
    await state.set_state(StudentPaymentStates.waiting_for_receipt)

@router.message(StudentPaymentStates.waiting_for_receipt, F.photo)
async def process_payment_receipt(message: types.Message, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    amount = data['pay_amount']
    
    # Сохраняем финансы со статусом pending (ожидает проверки)
    new_fin = Finance(
        user_id=db_user.id,
        amount=amount,
        status="pending",
        payment_method="Bank Transfer",
        purpose="Оплата обучения (Проверка чека)",
    )
    session.add(new_fin)
    await session.commit()
    
    file_id = message.photo[-1].file_id
    
    # Ищем администраторов, чтобы отправить им этот чек на проверку
    stmt = select(User).where(User.role == UserRole.ADMIN)
    admins = (await session.execute(stmt)).scalars().all()
    
    pay_kb = types.InlineKeyboardMarkup(inline_keyboard=[
        [
            types.InlineKeyboardButton(text="✅ Подтвердить", callback_data=f"admin_pay_ok:{new_fin.id}"),
            types.InlineKeyboardButton(text="❌ Отклонить", callback_data=f"admin_pay_fail:{new_fin.id}")
        ]
    ])
    
    for admin in admins:
        try:
            await message.bot.send_photo(
                admin.telegram_id, 
                photo=file_id, 
                caption=f"🧾 *Новый платеж на проверку!*\n\nПользователь: {message.from_user.full_name}\nСумма: `{amount:,.0f}` сум",
                parse_mode="Markdown",
                reply_markup=pay_kb
            )
        except Exception as e:
            logger.error(f"Failed to send receipt to admin: {e}")
    
    await message.answer("✅ Чек успешно загружен и отправлен администратору на проверку. После подтверждения статус обновится.", reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[[types.InlineKeyboardButton(text="🔙 Обратно к финансам", callback_data="student:payments")]]))
    await state.clear()

@router.callback_query(F.data == "st_pay_history")
async def show_transaction_history(callback: types.CallbackQuery, session: AsyncSession, db_user: User):
    stmt = select(Finance).where(Finance.user_id == db_user.id).order_by(Finance.payment_date.desc()).limit(10)
    payments = (await session.execute(stmt)).scalars().all()
    
    text = "📜 *Ваша история транзакций:*\n\n"
    if not payments:
        text += "_Оплат пока не поступало._"
    else:
        for p in payments:
            st_icon = "✅" if p.status == "succeeded" else "⏳"
            text += f"{st_icon} `{p.amount:,.0f}` сум | {p.payment_date.strftime('%d.%m.%Y')} | {p.payment_method or 'Manual'}\n"
            
    kb = types.InlineKeyboardMarkup(inline_keyboard=[
        [types.InlineKeyboardButton(text="⬅️ Назад", callback_data="student:payments")]
    ])
    
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)
