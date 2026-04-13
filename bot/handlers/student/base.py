from aiogram import Router, types, F
from aiogram.filters import Command
from bot.models.user import User, UserRole
from bot.keyboards.student.main import get_student_main_menu

from .cabinet import router as cabinet_router
from .lessons import router as lessons_router
from .homework import router as homework_router
from .progress import router as progress_router
from .materials import router as materials_router
from .payments import router as payments_router
from .feedback import router as feedback_router
from .schedule import router as schedule_router
from .profile import router as profile_router

router = Router(name="student_base")

@router.message(Command("start"), F.chat.type == "private")
async def cmd_start(message: types.Message, db_user: User):
    """
    Main entry point for students after registration/login.
    """
    if db_user.role != UserRole.STUDENT:
        # If user is teacher/admin, maybe re-route them
        return

    text = (
        "🎓 *Добро пожаловать в SmartEdu Bot!*\n\n"
        "Вы вошли в систему как ученик. Используйте меню ниже "
        "для управления вашим обучением."
    )
    await message.answer(text, parse_mode="Markdown", reply_markup=get_student_main_menu())


# Aggregate All Student Sub-Routers
student_main_router = Router(name="student_main")
student_main_router.include_router(router)
student_main_router.include_router(cabinet_router)
student_main_router.include_router(lessons_router)
student_main_router.include_router(homework_router)
student_main_router.include_router(progress_router)
student_main_router.include_router(materials_router)
student_main_router.include_router(payments_router)
student_main_router.include_router(feedback_router)
student_main_router.include_router(schedule_router)
student_main_router.include_router(profile_router)
