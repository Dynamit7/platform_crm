from aiogram import Router
from .panel import router as panel_router
from .attendance import router as attendance_router
from .homework import router as homework_router
from .grading import router as grading_router
from .group_journal import router as journal_router
from .materials import router as materials_router

router = Router(name="teacher_root")

router.include_router(panel_router)
router.include_router(attendance_router)
router.include_router(homework_router)
router.include_router(grading_router)
router.include_router(journal_router)
router.include_router(materials_router)
