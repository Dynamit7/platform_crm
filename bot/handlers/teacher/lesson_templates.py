"""Конструктор уроков — управление шаблонами занятий."""
import logging
from aiogram import Router, types, F, Bot
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from bot.models.education import LessonTemplate, Lesson
from bot.models.user import Teacher
from bot.keyboards.teacher import get_teacher_main_kb
from bot.keyboards.common import get_back_button

router = Router(name="teacher_lesson_templates")
logger = logging.getLogger(__name__)


class TemplateStates(StatesGroup):
    waiting_title = State()
    waiting_topic = State()
    waiting_objectives = State()
    waiting_materials = State()
    waiting_homework = State()
    waiting_duration = State()


@router.callback_query(F.data == "teacher:templates")
async def list_templates(callback: types.CallbackQuery, session: AsyncSession):
    stmt = select(LessonTemplate).order_by(LessonTemplate.created_at.desc()).limit(20)
    templates = (await session.execute(stmt)).scalars().all()

    text = "📋 *Конструктор уроков — шаблоны*\n\n"
    if not templates:
        text += "Шаблонов пока нет. Создайте первый!"

    buttons = []
    for t in templates:
        buttons.append([
            types.InlineKeyboardButton(text=f"📌 {t.title}", callback_data=f"tpl_view:{t.id}")
        ])
    buttons.append([types.InlineKeyboardButton(text="➕ Новый шаблон", callback_data="tpl_create")])
    buttons.append([get_back_button("teacher:panel")])

    await callback.message.edit_text(text, parse_mode="Markdown",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=buttons))


@router.callback_query(F.data == "tpl_create")
async def create_template_start(callback: types.CallbackQuery, state: FSMContext):
    await callback.message.edit_text(
        "📝 *Новый шаблон урока*\n\nВведите *название шаблона*:",
        parse_mode="Markdown"
    )
    await state.set_state(TemplateStates.waiting_title)


@router.message(TemplateStates.waiting_title)
async def tpl_title(message: types.Message, state: FSMContext):
    await state.update_data(title=message.text)
    await message.answer("📖 Введите *тему урока* (или отправьте `.` чтобы пропустить):", parse_mode="Markdown")
    await state.set_state(TemplateStates.waiting_topic)


@router.message(TemplateStates.waiting_topic)
async def tpl_topic(message: types.Message, state: FSMContext):
    val = None if message.text.strip() == "." else message.text
    await state.update_data(topic=val)
    await message.answer("🎯 Введите *цели урока* (или `.`):", parse_mode="Markdown")
    await state.set_state(TemplateStates.waiting_objectives)


@router.message(TemplateStates.waiting_objectives)
async def tpl_objectives(message: types.Message, state: FSMContext):
    val = None if message.text.strip() == "." else message.text
    await state.update_data(objectives=val)
    await message.answer("📚 Список *материалов* (каждый с новой строки, или `.`):", parse_mode="Markdown")
    await state.set_state(TemplateStates.waiting_materials)


@router.message(TemplateStates.waiting_materials)
async def tpl_materials(message: types.Message, state: FSMContext):
    val = None if message.text.strip() == "." else message.text
    await state.update_data(materials_list=val)
    await message.answer("📝 *Шаблон ДЗ* (или `.`):", parse_mode="Markdown")
    await state.set_state(TemplateStates.waiting_homework)


@router.message(TemplateStates.waiting_homework)
async def tpl_homework(message: types.Message, state: FSMContext):
    val = None if message.text.strip() == "." else message.text
    await state.update_data(homework_template=val)
    await message.answer("⏱ *Длительность* в минутах (например 60, или `.`):", parse_mode="Markdown")
    await state.set_state(TemplateStates.waiting_duration)


@router.message(TemplateStates.waiting_duration)
async def tpl_duration(message: types.Message, state: FSMContext, session: AsyncSession):
    text = message.text.strip()
    duration = 60 if text == "." else int(text)

    stmt = select(Teacher).where(Teacher.user_id == message.from_user.id)
    teacher = (await session.execute(stmt)).scalar_one_or_none()
    if not teacher:
        await message.answer("Ошибка: преподаватель не найден")
        await state.clear()
        return

    data = await state.get_data()
    tpl = LessonTemplate(
        teacher_id=teacher.id,
        title=data["title"],
        topic=data.get("topic"),
        objectives=data.get("objectives"),
        materials_list=data.get("materials_list"),
        homework_template=data.get("homework_template"),
        duration_minutes=duration,
    )
    session.add(tpl)
    await session.commit()

    await message.answer(
        f"✅ *Шаблон «{data['title']}» создан!*\n\n"
        f"Теперь вы можете применить его к любому уроку.",
        parse_mode="Markdown",
        reply_markup=get_teacher_main_kb()
    )
    await state.clear()


@router.callback_query(F.data.startswith("tpl_view:"))
async def view_template(callback: types.CallbackQuery, session: AsyncSession):
    tpl_id = int(callback.data.split(":")[1])
    stmt = select(LessonTemplate).where(LessonTemplate.id == tpl_id)
    tpl = (await session.execute(stmt)).scalar_one_or_none()
    if not tpl:
        await callback.answer("Шаблон не найден")
        return

    text = (
        f"📋 *{tpl.title}*\n"
        f"――――――――――――――――\n"
        f"📖 Тема: {tpl.topic or '—'}\n"
        f"🎯 Цели: {tpl.objectives or '—'}\n"
        f"📚 Материалы: {tpl.materials_list or '—'}\n"
        f"📝 ДЗ: {tpl.homework_template or '—'}\n"
        f"⏱ {tpl.duration_minutes} мин\n"
        f"――――――――――――――――\n"
    )

    buttons = [
        [types.InlineKeyboardButton(text="🗑 Удалить шаблон", callback_data=f"tpl_del:{tpl.id}")],
        [get_back_button("teacher:templates")],
    ]
    await callback.message.edit_text(text, parse_mode="Markdown",
        reply_markup=types.InlineKeyboardMarkup(inline_keyboard=buttons))


@router.callback_query(F.data.startswith("tpl_del:"))
async def delete_template(callback: types.CallbackQuery, session: AsyncSession):
    tpl_id = int(callback.data.split(":")[1])
    await session.execute(delete(LessonTemplate).where(LessonTemplate.id == tpl_id))
    await session.commit()
    await callback.answer("✅ Шаблон удалён")
    await list_templates(callback, session)
