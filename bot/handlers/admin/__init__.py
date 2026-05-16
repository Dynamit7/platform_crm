from aiogram import Router
from .panel import router as panel_router
from .reports import router as reports_router
from .applications import router as apps_router
from .users import router as users_router
from .broadcast import router as broadcast_router
from .groups import router as groups_router
from .courses import router as courses_router
from .finance import router as finance_router
from .schedule import router as schedule_router
from .students import router as students_router
from .teachers import router as teachers_router
from .feedback import router as feedback_router
from .settings import router as settings_router
from .leads import router as leads_router

router = Router(name="admin_root")
router.include_router(panel_router)
router.include_router(reports_router)
router.include_router(apps_router)
router.include_router(users_router)
router.include_router(broadcast_router)
router.include_router(groups_router)
router.include_router(courses_router)
router.include_router(finance_router)
router.include_router(schedule_router)
router.include_router(students_router)
router.include_router(teachers_router)
router.include_router(feedback_router)
router.include_router(settings_router)
router.include_router(leads_router)
