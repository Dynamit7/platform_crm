import logging
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from bot.models.education import StudentStatusModel, TrainingType, Course

logger = logging.getLogger(__name__)

async def seed_basic_data(session: AsyncSession):
    """Первоначальное заполнение справочников."""
    
    # 1. Статусы учеников
    statuses = [
        {"code": "active", "name": "Активен"},
        {"code": "frozen", "name": "Заморожен"},
        {"code": "graduated", "name": "Выпускник"},
        {"code": "left", "name": "Ушел"},
    ]
    
    for s in statuses:
        # Проверяем по коду
        stmt = select(StudentStatusModel).where(StudentStatusModel.code == s["code"])
        if not (await session.execute(stmt)).scalar_one_or_none():
            session.add(StudentStatusModel(**s))
            logger.info(f"Seed: Added student status {s['name']}")

    # 2. Типы обучения
    training_types = [
        {"name": "Групповое"},
        {"name": "Индивидуальное"},
        {"name": "Интенсив"},
    ]
    
    for tt in training_types:
        stmt = select(TrainingType).where(TrainingType.name == tt["name"])
        if not (await session.execute(stmt)).scalar_one_or_none():
            session.add(TrainingType(**tt))
            logger.info(f"Seed: Added training type {tt['name']}")

    # 3. Базовый курс (если совсем пусто)
    stmt_courses = select(func.count(Course.id))
    if (await session.scalar(stmt_courses)) == 0:
        default_course = Course(
            name="Английский для начинающих (A1)",
            description="Базовый курс английского языка",
            price_group=500000,
            price_individual=800000,
            duration_months=3,
            lessons_count=24
        )
        session.add(default_course)
    # 4. Базовые достижения для модуля Геймификации
    from bot.models.features import Achievement
    achievements = [
        {"name": "Первое ДЗ", "description": "Вы сдали свое первое домашнее задание и оно было принято!", "icon": "🥉", "xp_reward": 50},
        {"name": "Новатор", "description": "Сдано 5 домашних заданий подряд.", "icon": "🥈", "xp_reward": 150},
        {"name": "Магистр ДЗ", "description": "Сдано 10 домашних заданий подряд. Настоящий гений!", "icon": "🏆", "xp_reward": 300},
    ]
    for ach in achievements:
        stmt_a = select(Achievement).where(Achievement.name == ach["name"])
        if not (await session.execute(stmt_a)).scalar_one_or_none():
            session.add(Achievement(**ach))
            logger.info(f"Seed: Added achievement {ach['name']}")

    await session.commit()
