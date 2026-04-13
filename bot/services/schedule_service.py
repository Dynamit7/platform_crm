import logging
from datetime import date, timedelta
from typing import Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from bot.models.education import Group, Lesson
from sqlalchemy.orm import selectinload

logger = logging.getLogger(__name__)

class ScheduleService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def generate_lessons_for_month(self, group_id: int, start_date: date = None) -> Tuple[int, int]:
        """
        Генерирует уроки для группы на 30 дней вперед на основе days_bitmask.
        Возвращает (создано_уроков, пропущено_дубликатов).
        """
        if not start_date:
            start_date = date.today()

        # 1. Загружаем данные группы
        stmt = (
            select(Group)
            .options(selectinload(Group.schedule))
            .where(Group.id == group_id)
        )
        res = await self.session.execute(stmt)
        group = res.scalar_one_or_none()

        if not group or not group.days_bitmask:
            logger.warning(f"Group {group_id} not found or has no bitmask")
            return 0, 0

        created_count = 0
        skipped_count = 0
        
        # 2. Перебираем следующие 31 день
        for i in range(32):
            current_date = start_date + timedelta(days=i)
            weekday = current_date.isoweekday() # 1 (Mon) - 7 (Sun)
            
            # Проверяем, соответствует ли день маске
            # 1 << (weekday - 1) превращает 1->1, 2->2, 3->4, ..., 7->64
            day_bit = 1 << (weekday - 1)
            
            if group.days_bitmask & day_bit:
                # 3. Проверяем на дубликаты
                check_stmt = select(Lesson).where(
                    and_(
                        Lesson.group_id == group_id,
                        Lesson.lesson_date == current_date
                    )
                )
                existing = (await self.session.execute(check_stmt)).scalar_one_or_none()
                
                if existing:
                    skipped_count += 1
                    continue
                
                # 4. Создаем урок
                new_lesson = Lesson(
                    group_id=group_id,
                    teacher_id=group.teacher_id,
                    lesson_date=current_date,
                    lesson_time=group.schedule.time_start if group.schedule else "00:00",
                    topic="Занятие по расписанию"
                )
                self.session.add(new_lesson)
                created_count += 1

        await self.session.commit()
        logger.info(f"Generated {created_count} lessons for group {group.name} (skipped {skipped_count})")
        return created_count, skipped_count

    async def generate_for_all_active_groups(self) -> Tuple[int, int]:
        """Генерирует уроки для всех активных групп."""
        stmt = select(Group).where(Group.is_active == True)
        groups = (await self.session.execute(stmt)).scalars().all()
        
        total_created = 0
        total_skipped = 0
        
        for group in groups:
            c, s = await self.generate_lessons_for_month(group.id)
            total_created += c
            total_skipped += s
            
        return total_created, total_skipped
