from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import os, sys, logging
from dotenv import load_dotenv

# Ensure project root is on sys.path (for `core/` and `web/` packages)
_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

logging.basicConfig(level=logging.WARNING, format="%(levelname)s %(message)s")
log = logging.getLogger("web")

# Root .env is the source of truth (BOT_TOKEN, DATABASE_URL etc).
# web/.env is loaded second and may override only what's local to web.
_root_env = os.path.join(_project_root, ".env")
_web_env = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=_root_env)
load_dotenv(dotenv_path=_web_env, override=False)  # do NOT override BOT_TOKEN that root already set

import models
from core.models import Base
from database import engine, get_db
from auth import (
    create_access_token, get_current_user, require_admin, require_super_admin, require_teacher, require_student,
    decode_token, get_client_ip, check_rate_limit,
    create_db_session, rotate_db_session
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Seed first super_admin from env var
_sa_email = os.getenv("SUPER_ADMIN_EMAIL")
_sa_pass = os.getenv("SUPER_ADMIN_PASSWORD")
if _sa_email and _sa_pass:
    from models import User, Admin
    from auth import get_password_hash
    with Session(bind=engine) as sess:
        existing = sess.query(User).filter(User.email == _sa_email).first()
        if not existing:
            sa = User(
                name="Super Admin",
                email=_sa_email,
                password_hash=get_password_hash(_sa_pass),
                role="super_admin",
                is_active=True,
            )
            sess.add(sa)
            sess.flush()
            sess.add(Admin(user_id=sa.id, permissions="all"))
            sess.commit()
            log.warning("Super admin created — email=%s", _sa_email)
        else:
            log.info("Super admin already exists")

# Schema is managed by Alembic (`alembic upgrade head`).
# All legacy raw-SQL ALTER TABLE migrations removed.

# Ensure uploads directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(
    title="TIL USER CRM API",
    description="Full CRM Platform for TIL USER Education Center",
    version="2.0.0"
)

# CORS
_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:8000,http://127.0.0.1:8000")
CORS_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Global exception handlers ────────────────────────────────────
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    detail = getattr(exc, "detail", None)
    if not detail or detail == "Not Found":
        detail = "Эндпоинт не найден" if request.url.path.startswith("/api/") else "Страница не найдена"
    return JSONResponse(status_code=404, content={"detail": detail})

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    log.error("%s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Внутренняя ошибка сервера. Попробуйте позже."}
    )

@app.exception_handler(403)
async def forbidden_handler(request: Request, exc):
    return JSONResponse(status_code=403, content={"detail": "Доступ запрещён"})

# ── Router imports ──────────────────────────────────────────────
from routers.auth import router as auth_router
from routers.admin import router as admin_router
from routers.teachers import router as teachers_router
from routers.students import router as students_router
from routers.courses import router as courses_router
from routers.groups import router as groups_router
from routers.lessons import router as lessons_router
from routers.payments import router as payments_router
from routers.bot_api import router as bot_api_router
from routers.chat import router as chat_router
from routers.homework import router as homework_router
from routers.users import router as users_router
from routers.reviews import router as reviews_router

# ── Include routers ──────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(teachers_router)
app.include_router(students_router)
app.include_router(courses_router)
app.include_router(groups_router)
app.include_router(lessons_router)
app.include_router(payments_router)
app.include_router(bot_api_router)
app.include_router(chat_router)
app.include_router(homework_router)
app.include_router(users_router)
app.include_router(reviews_router)

# ── Static Frontend (Root) — React SPA ─────────────────────────
REACT_DIST = os.path.join(os.path.dirname(__file__), "..", "react-crm", "dist")

from starlette.exceptions import HTTPException as StarletteHTTPException

class SPAStaticFiles(StaticFiles):
    async def get_response(self, path: str, scope):
        try:
            response = await super().get_response(path, scope)
        except (HTTPException, StarletteHTTPException) as e:
            if e.status_code == 404:
                response = await super().get_response("index.html", scope)
            else:
                raise
        # index.html нельзя кэшировать — иначе после нового билда браузер
        # продолжит грузить старые имена бандлов и CSS не обновится.
        ct = response.headers.get("content-type") or response.media_type or ""
        if "text/html" in ct or path in ("", "index.html") or path.endswith(".html"):
            response.headers["cache-control"] = "no-cache, no-store, must-revalidate"
            response.headers["pragma"] = "no-cache"
            response.headers["expires"] = "0"
        return response

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/", SPAStaticFiles(directory=REACT_DIST, html=True), name="frontend")
