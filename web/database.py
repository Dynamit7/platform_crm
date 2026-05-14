from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from pathlib import Path
from dotenv import load_dotenv

_web_dir = Path(__file__).parent
_root    = _web_dir.parent

# web/.env has priority — load it first (override=True), then root .env as fallback
load_dotenv(dotenv_path=_root / ".env")           # root defaults
load_dotenv(dotenv_path=_web_dir / ".env", override=True)  # web overrides

_raw_url = os.getenv("DATABASE_URL", f"sqlite:///{_web_dir / 'education_center_web.db'}")

# Normalise: strip async driver prefix (web uses sync SQLAlchemy)
SQLALCHEMY_DATABASE_URL = (
    _raw_url
    .replace("sqlite+aiosqlite:///./", f"sqlite:///{_web_dir}/")
    .replace("sqlite+aiosqlite://",    "sqlite://")
)

# Resolve relative sqlite paths  sqlite:///./name.db → absolute
if SQLALCHEMY_DATABASE_URL.startswith("sqlite:///./"):
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{_web_dir / SQLALCHEMY_DATABASE_URL[12:]}"

print(f"[DB] Using: {SQLALCHEMY_DATABASE_URL}")

# SQLite requires check_same_thread=False; PostgreSQL does not
_connect_args = {"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=_connect_args,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
