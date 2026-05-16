from aiogram import Router
from . import common
from .student.registration import router as registration_router
from .student.base import student_main_router
from . import teacher
from .admin import router as admin_router
from . import chat

def get_root_router() -> Router:
    root_router = Router(name="root")
    
    root_router.include_router(common.router)
    root_router.include_router(registration_router)
    root_router.include_router(teacher.router)
    root_router.include_router(student_main_router)
    root_router.include_router(admin_router)
    root_router.include_router(chat.router)
    
    return root_router
