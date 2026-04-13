from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from bot.config import config

# Create async engine
engine = create_async_engine(
    config.DATABASE_URL,
    echo=False,  # Set to True for SQL logging
)

# Create session maker
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db():
    """Dependency for getting async session."""
    async with AsyncSessionLocal() as session:
        yield session
