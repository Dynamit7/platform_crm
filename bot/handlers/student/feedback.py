import logging
from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy.ext.asyncio import AsyncSession
from bot.models.user import User
from bot.models.education import Feedback, Lesson
from bot.keyboards.student import get_back_to_cabinet_kb
import aiohttp
from bot.config import config


router = Router(name="student_feedback")
logger = logging.getLogger(__name__)

class FeedbackStates(StatesGroup):
    waiting_for_rating = State()
    waiting_for_comment = State()

@router.callback_query(F.data.startswith("rate_lesson:"))
async def start_feedback(callback: types.CallbackQuery, state: FSMContext):
    lesson_id = int(callback.data.split(":")[1])
    await state.update_data(lesson_id=lesson_id)
    
    # Клава со звездами
    kb = types.InlineKeyboardMarkup(inline_keyboard=[
        [
            types.InlineKeyboardButton(text="⭐ 1", callback_data="rate_set:1"),
            types.InlineKeyboardButton(text="⭐ 2", callback_data="rate_set:2"),
            types.InlineKeyboardButton(text="⭐ 3", callback_data="rate_set:3"),
            types.InlineKeyboardButton(text="⭐ 4", callback_data="rate_set:4"),
            types.InlineKeyboardButton(text="⭐ 5", callback_data="rate_set:5")
        ],
        [types.InlineKeyboardButton(text="❌ Отмена", callback_data="student:main")]
    ])
    
    await callback.message.edit_text(
        "📝 *Оцените прошедшее занятие!*\n\nВаше мнение помогает нам становиться лучше. Пожалуйста, поставьте оценку:",
        parse_mode="Markdown",
        reply_markup=kb
    )
    await state.set_state(FeedbackStates.waiting_for_rating)

@router.callback_query(F.data.startswith("rate_set:"))
async def process_rating(callback: types.CallbackQuery, state: FSMContext):
    rating = int(callback.data.split(":")[1])
    await state.update_data(rating=rating)
    
    builder = types.InlineKeyboardMarkup(inline_keyboard=[
        [types.InlineKeyboardButton(text="❌ Пропустить", callback_data="rate_skip_comment")]
    ])
    await callback.message.edit_text(
        f"Вы поставили: {rating} ⭐\n\n💬 Напишите небольшой комментарий (что понравилось или что нужно улучшить?):",
        reply_markup=builder
    )
    await state.set_state(FeedbackStates.waiting_for_comment)

async def save_feedback(state: FSMContext, session: AsyncSession, db_user: User, event: types.Message | types.CallbackQuery, comment: str = ""):
    data = await state.get_data()
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    
    lesson_stmt = select(Lesson).where(Lesson.id == data['lesson_id']).options(selectinload(Lesson.group))
    lesson = (await session.execute(lesson_stmt)).scalar_one_or_none()
    
    if lesson:
        new_fb = Feedback(
            user_id=db_user.id,
            lesson_id=lesson.id,
            course_id=lesson.group.course_id if lesson.group else None,
            rating=data['rating'],
            comment=comment
        )
        session.add(new_fb)
        await session.commit()
        
    # Sync with CRM
    try:
        async with aiohttp.ClientSession() as http_session:
            payload = {
                "telegram_id": db_user.telegram_id,
                "rating": data['rating'],
                "text": comment
            }
            await http_session.post(f"{config.API_URL}/sync-review", json=payload, timeout=3)
    except Exception as e:
        logger.error(f"Failed to sync review to CRM: {e}")
    
    text = "🙏 Спасибо за ваш отзыв!"
    if isinstance(event, types.CallbackQuery):
        await event.message.edit_text(text, reply_markup=get_back_to_cabinet_kb())
    else:
        await event.answer(text, reply_markup=get_back_to_cabinet_kb())
    await state.clear()

@router.callback_query(F.data == "rate_skip_comment")
async def skip_comment(callback: types.CallbackQuery, state: FSMContext, session: AsyncSession, db_user: User):
    await save_feedback(state, session, db_user, callback, comment="")

@router.message(FeedbackStates.waiting_for_comment)
async def finalize_feedback(message: types.Message, state: FSMContext, session: AsyncSession, db_user: User):
    await save_feedback(state, session, db_user, message, comment=message.text)
