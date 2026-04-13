import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from bot.models.base import Base
from bot.models.user import User, Admin, UserRole
from bot.models.education import (
    Course, Group, Lesson, StudentGroup, Attendance, Registration, 
    StudentStatusModel, TrainingType, TrainingType
)
from bot.models.finance import Payment
from bot.models.features import Reminder, Achievement, StudentAchievement
from bot.config import config as settings
from bot.database import async_session_factory

async def reset_db():
    print("WARNING: This will delete ALL data in the database.")
    
    # Path to SQLite DB
    db_path = settings.DATABASE_URL.replace("sqlite+aiosqlite:///", "")
    
    # Check if DB exists and remove it
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Removed old database file: {db_path}")

    # Create new engine
    engine = create_async_engine(settings.DATABASE_URL)

    async with engine.begin() as conn:
        print("Creating all tables from models...")
        # Import all models to ensure they are registered with Base.metadata
        await conn.run_sync(Base.metadata.create_all)
        print("Tables created successfully.")

    # Optional: Seed initial data
    async with async_session_factory() as session:
        print("Seeding initial data...")
        
        # 1. Add Training Types
        tt1 = TrainingType(name="Group", description="80 min lesson")
        tt2 = TrainingType(name="Individual", description="60 min lesson")
        session.add_all([tt1, tt2])
        
        # 2. Add Statuses
        s1 = StudentStatusModel(code="active", name="Активен", description="Учится")
        s2 = StudentStatusModel(code="frozen", name="Заморожен", description="Временно не учится")
        session.add_all([s1, s2])

        # 3. Add initial Admin from settings if available
        # You can use a specific ID here or from env
        admin_tg_id = 866916345 # Default from your previous script
        
        admin_user = User(
            telegram_id=admin_tg_id,
            full_name="Main Admin",
            role=UserRole.ADMIN
        )
        session.add(admin_user)
        await session.flush()
        await session.refresh(admin_user)
        print(f"Created Admin User with ID: {admin_user.id}")
        
        admin_profile = Admin(user=admin_user, permissions="all")
        session.add(admin_profile)

        await session.commit()
        print("Initial data seeded.")

    await engine.dispose()
    print("Database reset complete.")

if __name__ == "__main__":
    asyncio.run(reset_db())
