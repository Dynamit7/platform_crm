from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from aiogram.filters import StateFilter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from bot.models.education import Course
from bot.keyboards.admin import get_admin_main_kb
from bot.states.admin import AdminCourseCreateStates

router = Router(name="admin_courses")

@router.callback_query(F.data == "admin:courses")
async def list_courses(callback: types.CallbackQuery, session: AsyncSession):
    """Отображение списка курсов с кнопками управления."""
    stmt = select(Course)
    result = await session.execute(stmt)
    courses = result.scalars().all()
    
    text = "🎓 *Управление курсами*\n\nСписок текущих направлений:"
    buttons = []
    
    if not courses:
        text += "\n\n_Список пока пуст._"
    else:
        for c in courses:
            text += f"\n🔹 *{c.name}* — {c.price_group or 'Не указана'} сум"
            buttons.append([
                types.InlineKeyboardButton(text=f"✏️ Цена", callback_data=f"course_edit_price:{c.id}"),
                types.InlineKeyboardButton(text=f"❌ Удалить", callback_data=f"course_delete:{c.id}")
            ])

    buttons.append([types.InlineKeyboardButton(text="➕ Добавить новый курс", callback_data="course_create:start")])
    buttons.append([types.InlineKeyboardButton(text="⬅️ Назад", callback_data="admin:main")])
    
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=types.InlineKeyboardMarkup(inline_keyboard=buttons))
    await callback.answer()

@router.callback_query(F.data == "course_create:start")
async def create_course_name(callback: types.CallbackQuery, state: FSMContext):
    """Шаг 1: Название курса."""
    await callback.message.edit_text(
        "🆕 *Новый курс: Шаг 1*\n\nВведите название курса (например: `Fullstack Python`):",
        parse_mode="Markdown",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
            [types.InlineKeyboardButton(text="❌ Отмена", callback_data="admin:courses")]
        ])
    )
    await state.set_state(AdminCourseCreateStates.waiting_for_name)
    await callback.answer()

@router.message(AdminCourseCreateStates.waiting_for_name)
async def create_course_desc(message: types.Message, state: FSMContext):
    """Шаг 2: Описание."""
    await state.update_data(name=message.text)
    await message.answer("🆕 *Шаг 2*\n\nВведите краткое описание курса:")
    await state.set_state(AdminCourseCreateStates.waiting_for_description)

@router.message(AdminCourseCreateStates.waiting_for_description)
async def create_course_price(message: types.Message, state: FSMContext):
    """Шаг 3: Цена."""
    await state.update_data(description=message.text)
    await message.answer("🆕 *Шаг 3*\n\nВведите стоимость курса за месяц (только число, например: `1200000`):")
    await state.set_state(AdminCourseCreateStates.waiting_for_price)

@router.message(AdminCourseCreateStates.waiting_for_price)
async def create_course_duration(message: types.Message, state: FSMContext):
    """Шаг 4: Длительность."""
    if not message.text.isdigit():
        await message.answer("❌ Пожалуйста, введите корректное число.")
        return
        
    await state.update_data(price=float(message.text))
    await message.answer("🆕 *Шаг 4*\n\nВведите длительность обучения в месяцах (например: `6`):")
    await state.set_state(AdminCourseCreateStates.waiting_for_duration)

@router.message(AdminCourseCreateStates.waiting_for_duration)
async def create_course_finish(message: types.Message, state: FSMContext, session: AsyncSession):
    """Финализация создания курса."""
    if not message.text.isdigit():
        await message.answer("❌ Введите число месяцев.")
        return

    data = await state.get_data()
    duration = int(message.text)
    
    new_course = Course(
        name=data['name'],
        description=data['description'],
        price_group=data['price'],
        duration_months=duration
    )
    
    session.add(new_course)
    await session.commit()
    
    await message.answer(
        f"✅ *Курс '{data['name']}' успешно создан!*\n\n"
        f"💰 Цена: {data['price']} сум\n"
        f"📅 Срок: {duration} мес.",
        parse_mode="Markdown",
        reply_markup=get_admin_main_kb() # Можно добавить кнопку вернуться в курсы
    )
    await state.clear()

@router.callback_query(F.data.startswith("course_delete:"))
async def delete_course(callback: types.CallbackQuery, session: AsyncSession):
    """Удаление курса."""
    course_id = int(callback.data.split(":")[1])
    stmt = select(Course).where(Course.id == course_id)
    result = await session.execute(stmt)
    course = result.scalar_one_or_none()
    
    if course:
        await session.delete(course)
        await session.commit()
        await callback.answer(f"❌ Курс '{course.name}' удален", show_alert=True)
    
    await list_courses(callback, session)

@router.callback_query(F.data.startswith("course_edit_price:"))
async def edit_course_price_start(callback: types.CallbackQuery, state: FSMContext, session: AsyncSession):
    course_id = int(callback.data.split(":")[1])
    stmt = select(Course).where(Course.id == course_id)
    course = (await session.execute(stmt)).scalar_one_or_none()
    
    if not course:
        await callback.answer("Курс не найден", show_alert=True)
        return
        
    await state.update_data(edit_course_id=course_id)
    await callback.message.edit_text(
        f"✏️ *Изменение цены*\n\nКурс: `{course.name}`\nТекущая цена: `{course.price_group}` сум\n\nВведите новую цену цифрами:",
        parse_mode="Markdown",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
            [types.InlineKeyboardButton(text="❌ Отмена", callback_data="admin:courses")]
        ])
    )
    await state.set_state(AdminCourseCreateStates.waiting_for_new_price)
    await callback.answer()

@router.message(StateFilter(AdminCourseCreateStates.waiting_for_new_price))
async def edit_course_price_finish(message: types.Message, state: FSMContext, session: AsyncSession):
    if not message.text.isdigit():
        await message.answer("❌ Пожалуйста, введите корректное число (только цифры).")
        return
        
    data = await state.get_data()
    course_id = data.get("edit_course_id")
    new_price = int(message.text)
    
    stmt = select(Course).where(Course.id == course_id)
    course = (await session.execute(stmt)).scalar_one_or_none()
    
    if course:
        course.price_group = new_price
        await session.commit()
        await message.answer(f"✅ Цена курса *{course.name}* успешно изменена на `{new_price}` сум!", parse_mode="Markdown", reply_markup=get_admin_main_kb())
        
    await state.clear()
