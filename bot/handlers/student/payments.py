from aiogram import Router, types, F


router = Router(name="student_payments")

@router.message(F.text == "💳 Оплата")
async def show_payment_hub(message: types.Message):
    text = (
        "💳 *Управление оплатой*\n\n"
        "💰 *Текущий баланс*: 12 500 сум\n"
        "📅 *Следующая оплата до*: 15.04.2024\n\n"
        "Нажмите кнопку ниже, чтобы пополнить счет "
        "или привязать карту."
    )
    
    kb = [
        [types.InlineKeyboardButton(text="💵 Оплатить обучение", callback_data="st_pay_now")],
        [types.InlineKeyboardButton(text="📜 История транзакций", callback_data="st_pay_history")]
    ]
    
    await message.answer(text, parse_mode="Markdown", reply_markup=types.InlineKeyboardMarkup(inline_keyboard=kb))


@router.callback_query(F.data == "st_pay_now")
async def process_payment(callback: types.CallbackQuery):
    await callback.message.answer(
        "💳 *Переход к оплате...*\n\n"
        "В данный момент интеграция с платежной системой (Payme/Click) находится в режиме отладки.",
        parse_mode="Markdown"
    )
    await callback.answer()
