from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from bot.config import config

# Create async engine
_db_url = config.DATABASE_URL
_connect_args = {"timeout": 15} if "sqlite" in _db_url else {}
engine = create_async_engine(
    _db_url,
    echo=False,
    future=True,
    connect_args=_connect_args,
)

# Create async session factory (Renamed for consistency)


async_session_factory = async_sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async session."""
    async with async_session_factory() as session:
        yield session
