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
                types.InlineKeyboardButton(text=f"⚙️ Управление: {c.name}", callback_data=f"course_manage:{c.id}")
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

@router.callback_query(F.data.startswith("course_manage:"))
async def manage_course_card(callback: types.CallbackQuery, session: AsyncSession):
    course_id = int(callback.data.split(":")[1])
    stmt = select(Course).where(Course.id == course_id)
    course = (await session.execute(stmt)).scalar_one_or_none()
    
    if not course:
        return await callback.answer("Курс не найден", show_alert=True)
        
    text = (
        f"📖 *Управление курсом*\n\n"
        f"Название: `{course.name}`\n"
        f"Описание: _{course.description or 'Нет описания'}_\n"
        f"Цена (в группе): `{course.price_group}` сум\n"
        f"Цена (инд.): `{course.price_individual or 0}` сум\n"
        f"Срок: `{course.duration_months}` мес.\n\n"
        f"Выберите что хотите изменить:"
    )
    
    kb = types.InlineKeyboardMarkup(inline_keyboard=[
        [
            types.InlineKeyboardButton(text="✏️ Имя", callback_data=f"course_edit:name:{course.id}"),
            types.InlineKeyboardButton(text="✏️ Описание", callback_data=f"course_edit:desc:{course.id}")
        ],
        [
            types.InlineKeyboardButton(text="✏️ Цена (Группа)", callback_data=f"course_edit:price_g:{course.id}"),
            types.InlineKeyboardButton(text="✏️ Цена (Инд)", callback_data=f"course_edit:price_i:{course.id}")
        ],
        [types.InlineKeyboardButton(text="❌ Удалить курс", callback_data=f"course_delete:{course.id}")],
        [types.InlineKeyboardButton(text="⬅️ К списку курсов", callback_data="admin:courses")]
    ])
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=kb)

@router.callback_query(F.data.startswith("course_edit:"))
async def edit_course_field_start(callback: types.CallbackQuery, state: FSMContext):
    parts = callback.data.split(":")
    field = parts[1]
    course_id = int(parts[2])
    
    await state.update_data(edit_course_id=course_id, edit_course_field=field)
    
    field_names = {
        "name": "название курса",
        "desc": "описание курса",
        "price_g": "стоимость группового занятия",
        "price_i": "стоимость индивидуального занятия"
    }
    
    await callback.message.edit_text(
        f"✏️ *Изменение курса*\n\nВведите новое {field_names[field]}:",
        parse_mode="Markdown",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=[
            [types.InlineKeyboardButton(text="❌ Отмена", callback_data=f"course_manage:{course_id}")]
        ])
    )
    await state.set_state(AdminCourseCreateStates.waiting_for_new_price)
    await callback.answer()

@router.message(StateFilter(AdminCourseCreateStates.waiting_for_new_price))
async def edit_course_field_finish(message: types.Message, state: FSMContext, session: AsyncSession):
    data = await state.get_data()
    course_id = data.get("edit_course_id")
    field = data.get("edit_course_field")
    
    stmt = select(Course).where(Course.id == course_id)
    course = (await session.execute(stmt)).scalar_one_or_none()
    
    if not course:
        await state.clear()
        return

    val = message.text
    if field in ["price_g", "price_i"]:
        if not val.isdigit():
            return await message.answer("❌ Введите число.")
        if field == "price_g":
            course.price_group = int(val)
        else:
            course.price_individual = int(val)
    elif field == "name":
        course.name = val
    elif field == "desc":
        course.description = val
        
    await session.commit()
    await message.answer(f"✅ Данные курса *{course.name}* обновлены!", parse_mode="Markdown", reply_markup=get_admin_main_kb())
    await state.clear()
