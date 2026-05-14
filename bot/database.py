from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from bot.config import config

# Create async engine
engine = create_async_engine(
    config.DATABASE_URL,
    echo=False,  # Set to True for debugging SQL queries
    future=True,
    connect_args={"timeout": 15}
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
