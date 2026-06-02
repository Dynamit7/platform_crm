from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from bot.models.education import Attendance
from bot.config import config
from typing import Dict

class AttendanceService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def mark_attendance(self, lesson_id: int, student_id: int, status: str = "present", notes: str = None):
        """Upsert logic — works with both SQLite and PostgreSQL."""
        if "sqlite" in config.DATABASE_URL:
            from sqlalchemy.dialects.sqlite import insert as upsert
            stmt = upsert(Attendance).values(
                lesson_id=lesson_id,
                student_id=student_id,
                status=status,
                notes=notes
            ).on_conflict_do_update(
                index_elements=['lesson_id', 'student_id'],
                set_=dict(status=status, notes=notes)
            )
        else:
            from sqlalchemy.dialects.postgresql import insert as upsert
            stmt = upsert(Attendance).values(
                lesson_id=lesson_id,
                student_id=student_id,
                status=status,
                notes=notes
            ).on_conflict_do_update(
                constraint='uq_attendance_lesson_student',
                set_=dict(status=status, notes=notes)
            )
        
        await self.session.execute(stmt)
        await self.session.commit()

    async def get_lesson_stats(self, lesson_id: int) -> Dict[str, int]:
        """Возвращает статистику по конкретному уроку."""
        stmt = select(Attendance.status, func.count(Attendance.id)).where(Attendance.lesson_id == lesson_id).group_by(Attendance.status)
        result = await self.session.execute(stmt)
        stats = {row[0]: row[1] for row in result.all()}
        
        # Добавляем нули для красоты, если статусов нет
        for s in ["present", "absent", "late"]:
            if s not in stats:
                stats[s] = 0
        return stats

    async def get_student_attendance_rate(self, student_id: int) -> float:
        """Рассчитывает процент посещаемости ученика (0-100%)."""
        total_stmt = select(func.count(Attendance.id)).where(Attendance.student_id == student_id)
        present_stmt = select(func.count(Attendance.id)).where(
            Attendance.student_id == student_id, 
            Attendance.status.in_(["present", "late"])
        )
        
        total = await self.session.scalar(total_stmt) or 0
        present = await self.session.scalar(present_stmt) or 0
        
        if total == 0:
            return 0.0
        return (present / total) * 100
