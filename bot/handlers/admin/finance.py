import logging
from aiogram import Router, types, F, Bot
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from bot.models.finance import Finance
from bot.repositories.user import UserRepository
from bot.services.notification_service import NotificationService
from bot.keyboards.admin_finance import get_finance_main_kb, get_payment_method_kb, get_finance_back_kb
from bot.states.admin import AdminFinanceStates

router = Router(name="admin_finance")
logger = logging.getLogger(__name__)

@router.callback_query(F.data == "admin:finance")
async def show_finance_dashboard(callback: types.CallbackQuery, session: AsyncSession):
    """Главный дашборд финансов."""
    sum_stmt = select(func.sum(Finance.amount)).where(Finance.status == "succeeded")
    total_income = await session.scalar(sum_stmt) or 0
    
    text = (
        f"💰 *Финансовый учет*\n\n"
        f"💵 *Общая выручка:* `{total_income:,.2f}` сум\n\n"
        f"Выберите действие для управления транзакциями:"
    )
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=get_finance_main_kb())
    await callback.answer()

@router.callback_query(F.data == "admin_fin:list_all")
async def list_all_payments(callback: types.CallbackQuery, session: AsyncSession):
    """Список последних 15 платежей."""
    stmt = select(Finance).options(selectinload(Finance.user)).order_by(Finance.created_at.desc()).limit(15)
    result = await session.execute(stmt)
    payments = result.scalars().all()
    
    text = "📋 *История последних транзакций:* \n\n"
    if not payments:
        text += "_Записей пока нет._"
    else:
        for p in payments:
            user_name = p.user.full_name if p.user else "Удален"
            status = "✅" if p.status == "succeeded" else "⏳"
            text += f"{status} `{p.amount:,.0f}` | {user_name} | {p.payment_method or '---'}\n"

    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=get_finance_back_kb())
    await callback.answer()

# --- МАСТЕР РУЧНОГО ВНЕСЕНИЯ ПЛАТЕЖА ---

@router.callback_query(F.data == "admin_fin:manual_add")
async def manual_pay_step1(callback: types.CallbackQuery, state: FSMContext):
    """Поиск пользователя для оплаты."""
    await callback.message.edit_text(
        "📥 *Ручное внесение оплаты*\n\nВведите имя или телефон ученика для поиска:",
        parse_mode="Markdown"
    )
    await state.set_state(AdminFinanceStates.waiting_for_user_search)
    await callback.answer()

@router.message(AdminFinanceStates.waiting_for_user_search)
async def manual_pay_step2_user_select(message: types.Message, state: FSMContext, session: AsyncSession):
    """Результаты поиска пользователей."""
    query = message.text
    user_repo = UserRepository(session)
    users = await user_repo.search_users(query)
    
    if not users:
        await message.answer("❌ Пользователь не найден. Попробуйте еще раз или /cancel.")
        return

    text = "🔍 *Выберите пользователя для начисления оплаты:*"
    buttons = []
    for u in users[:5]: # Показываем первых 5
        buttons.append([types.InlineKeyboardButton(text=f"👤 {u.full_name} ({u.phone})", callback_data=f"fin_set_user:{u.id}")])
    
    await message.answer(text, parse_mode="Markdown", reply_markup=types.InlineKeyboardMarkup(inline_keyboard=buttons))

@router.callback_query(F.data.startswith("fin_set_user:"))
async def manual_pay_step3_amount(callback: types.CallbackQuery, state: FSMContext):
    user_id = int(callback.data.split(":")[1])
    await state.update_data(user_id=user_id)
    
    await callback.message.edit_text(
        "💰 *Шаг 2*\n\nВведите сумму оплаты (только число):",
        parse_mode="Markdown"
    )
    await state.set_state(AdminFinanceStates.waiting_for_amount)
    await callback.answer()

@router.message(AdminFinanceStates.waiting_for_amount)
async def manual_pay_step4_method(message: types.Message, state: FSMContext):
    if not message.text.isdigit():
        await message.answer("❌ Введите число.")
        return
    
    await state.update_data(amount=float(message.text))
    await message.answer(
        "💳 *Шаг 3*\n\nВыберите способ оплаты:",
        reply_markup=get_payment_method_kb()
    )
    await state.set_state(AdminFinanceStates.waiting_for_method)

@router.callback_query(F.data.startswith("fin_method:"))
async def manual_pay_step5_purpose(callback: types.CallbackQuery, state: FSMContext):
    method = callback.data.split(":")[1]
    await state.update_data(payment_method=method)
    
    await callback.message.edit_text(
        "📝 *Шаг 4*\n\nВведите назначение платежа (например: `Оплата за октябрь, курс Python`):",
        parse_mode="Markdown"
    )
    await state.set_state(AdminFinanceStates.waiting_for_purpose)
    await callback.answer()

@router.message(AdminFinanceStates.waiting_for_purpose)
async def manual_pay_finish(message: types.Message, state: FSMContext, session: AsyncSession, bot: Bot):
    await state.update_data(purpose=message.text)
    data = await state.get_data()
    
    # 1. Создаем транзакцию
    new_finance = Finance(
        user_id=data['user_id'],
        amount=data['amount'],
        status="succeeded",
        payment_method=data['payment_method'],
        purpose=data['purpose']
    )
    session.add(new_finance)
    
    # 2. Получаем пользователя для уведомления
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(data['user_id'])
    
    await session.commit()
    
    # 3. Уведомляем ученика
    notifier = NotificationService(bot)
    await notifier.notify_user_status_change(
        user.telegram_id,
        f"✅ *Оплата подтверждена!*\n\n💰 Сумма: `{data['amount']:,.0f}` сум\n📝 Назначение: {data['purpose']}\n\nСпасибо, что вы с нами!"
    )
    
    await message.answer(
        f"✅ *Платеж успешно внесен!*\n\n"
        f"👤 Ученик: {user.full_name}\n"
        f"💰 Сумма: {data['amount']} сум\n"
        f"💳 Способ: {data['payment_method']}",
        reply_markup=get_finance_main_kb()
    )
    await state.clear()

@router.callback_query(F.data == "admin_fin:remind_debt")
async def remind_debts(callback: types.CallbackQuery, session: AsyncSession, bot: Bot):
    """Рассылка напоминаний о долгах."""
    from datetime import datetime, timedelta, date as date_type
    from bot.models.user import Student, User
    from sqlalchemy.orm import selectinload
    
    thirty_days_ago = datetime.now() - timedelta(days=30)
    today = date_type.today()
    
    # Ищем всех активных студентов, которые не заморожены
    stmt = select(Student).options(selectinload(Student.user)).where(Student.is_active == True)
    students = (await session.execute(stmt)).scalars().all()
    
    debtors = []
    for st in students:
        if st.frozen_until and st.frozen_until >= today:
            continue
            
        # Проверяем, когда он платил в последний раз
        pay_stmt = select(Finance).where(
            Finance.student_id == st.id, # или user_id == st.user_id
            Finance.status == "succeeded",
            Finance.payment_date >= thirty_days_ago
        )
        # Так как payment может не иметь student_id, проверяем по user_id
        pay_stmt_user = select(Finance).where(
            Finance.user_id == st.user_id,
            Finance.status == "succeeded",
            Finance.payment_date >= thirty_days_ago
        )
        
        recent_payment = (await session.execute(pay_stmt_user)).scalars().first()
        
        if not recent_payment:
            # Проверяем, не напоминали ли мы ему уже недавно (например, в последние 3 дня)
            if not st.last_debt_reminder or st.last_debt_reminder < today - timedelta(days=3):
                debtors.append(st)
                
    if not debtors:
        await callback.answer("✅ Должников не найдено, или всем уже отправлены напоминания.", show_alert=True)
        return
        
    notifier = NotificationService(bot)
    sent_count = 0
    
    for debtor in debtors:
        try:
            await notifier.notify_user_status_change(
                debtor.user.telegram_id,
                "⚠️ *Напоминание об оплате*\n\n"
                "Здравствуйте! Напоминаем, что подошел срок оплаты за обучение в этом месяце. "
                "Пожалуйста, произведите оплату в ближайшее время, чтобы мы могли "
                "продолжить ваше обучение без перерывов.\n\n"
                "Для оплаты нажмите на раздел `Кабинет ученика` -> `Оплата`."
            )
            debtor.last_debt_reminder = today
            sent_count += 1
        except Exception as e:
            logger.error(f"Failed to send debt reminder to {debtor.user.telegram_id}: {e}")
            
    await session.commit()
    await callback.answer(f"✅ Напоминания успешно отправлены {sent_count} должникам!", show_alert=True)

@router.callback_query(F.data.startswith("admin_pay_ok:"))
async def approve_payment_receipt(callback: types.CallbackQuery, session: AsyncSession, bot: Bot):
    fin_id = int(callback.data.split(":")[1])
    stmt = select(Finance).where(Finance.id == fin_id).options(selectinload(Finance.user))
    fin = (await session.execute(stmt)).scalar_one_or_none()
    
    if not fin:
        return await callback.answer("Транзакция не найдена", show_alert=True)
        
    fin.status = "succeeded"
    await session.commit()
    
    await callback.message.edit_caption(caption=callback.message.caption + "\n\n✅ *Принято администратором*")
    
    notifier = NotificationService(bot)
    await notifier.notify_user_status_change(
        fin.user.telegram_id,
        f"✅ *Оплата подтверждена!*\n\nВаш чек на сумму `{fin.amount:,.0f}` сум успешно проверен.\nСпасибо, что вы с нами!"
    )
    await callback.answer("Оплата подтверждена")

@router.callback_query(F.data.startswith("admin_pay_fail:"))
async def reject_payment_receipt(callback: types.CallbackQuery, session: AsyncSession, bot: Bot):
    from sqlalchemy import delete
    fin_id = int(callback.data.split(":")[1])
    
    stmt = select(Finance).where(Finance.id == fin_id).options(selectinload(Finance.user))
    fin = (await session.execute(stmt)).scalar_one_or_none()
    
    if not fin:
        return await callback.answer("Транзакция не найдена", show_alert=True)
        
    user_id = fin.user.telegram_id
    
    del_stmt = delete(Finance).where(Finance.id == fin_id)
    await session.execute(del_stmt)
    await session.commit()
    
    await callback.message.edit_caption(caption=callback.message.caption + "\n\n❌ *Отклонено администратором*")
    
    notifier = NotificationService(bot)
    await notifier.notify_user_status_change(
        user_id,
        f"❌ *Ваша последняя оплата отклонена.*\n\nПожалуйста, убедитесь, что вы загрузили корректный чек, или свяжитесь с администрацией."
    )
    await callback.answer("Оплата отклонена")
