from aiogram import Router, types, F
from aiogram.filters import Command
from sqlalchemy.ext.asyncio import AsyncSession

from bot.models.user import User, UserRole
from bot.keyboards.teacher.main import get_teacher_main_menu
from bot.repositories.teacher import TeacherRepository

router = Router(name="teacher_base")

@router.message(Command("teacher"))
@router.message(F.text == "🏠 Главное меню")
@router.callback_query(F.data == "teacher_main")
async def show_teacher_panel(event: types.TelegramObject, db_user: User):
    """
    Entry point for the teacher panel.
    Checks if user is a teacher and shows the main menu.
    """
    if not db_user or db_user.role != UserRole.TEACHER:
        # If student/admin, maybe show different menu or access denied
        if isinstance(event, types.CallbackQuery):
            await event.answer("У вас нет доступа к этому разделу 🔒", show_alert=True)
        return

    text = (
        "👨‍🏫 *Панель преподавателя SmartEdu*\n\n"
        "Здесь вы можете планировать уроки, отмечать посещаемость "
        "и делиться материалами с вашими группами."
    )
    
    msg = event.message if isinstance(event, types.CallbackQuery) else event
    await msg.answer(text, parse_mode="Markdown", reply_markup=get_teacher_main_menu())
    
    if isinstance(event, types.CallbackQuery):
        await event.answer()


@router.message(F.text == "👥 Мои группы")
@router.callback_query(F.data == "teacher_groups")
async def show_my_groups(event: types.TelegramObject, session: AsyncSession, db_user: User):
    teacher_repo = TeacherRepository(session)
    teacher = await teacher_repo.get_by_user_id(db_user.id)
    
    if not teacher:
        await event.answer("Профиль преподавателя не найден. Обратитесь к администратору.")
        return

    groups = await teacher_repo.get_groups(teacher.id)
    
    if not groups:
        text = "У вас пока нет активных групп."
    else:
        text = "👥 *Ваши учебные группы:*\n\n"
        for group in groups:
            text += f"• *{group.name}* ({group.course.name})\n"
            text += f"  Студентов: {group.current_students}/{group.max_students}\n\n"

    msg = event.message if isinstance(event, types.CallbackQuery) else event
    await msg.answer(text, parse_mode="Markdown")
    
    if isinstance(event, types.CallbackQuery):
        await event.answer()
