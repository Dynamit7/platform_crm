from typing import Tuple, List, Optional
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from bot.models.education import Group, Lesson, StudentGroup
from bot.models.user import Student
from bot.services.notification_service import NotificationService
from aiogram import Bot

class GroupService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def check_schedule_overlap(self, teacher_id: int, schedule_id: int, days_mask: int, exclude_group_id: Optional[int] = None) -> Optional[Group]:
        """Проверяет, нет ли накладки в расписании у преподавателя."""
        stmt = select(Group).where(
            Group.teacher_id == teacher_id, 
            Group.schedule_id == schedule_id, 
            Group.is_active == True
        )
        if exclude_group_id:
            stmt = stmt.where(Group.id != exclude_group_id)
            
        existing_groups = (await self.session.execute(stmt)).scalars().all()
        for g in existing_groups:
            if (g.days_bitmask & days_mask) > 0:
                return g  # Найдена накладка
        return None

    async def create_group(self, name: str, course_id: int, teacher_id: int, schedule_id: int, days_mask: int, max_students: int) -> Tuple[bool, str, Optional[Group]]:
        """Создает группу с проверкой накладок расписания."""
        overlap = await self.check_schedule_overlap(teacher_id, schedule_id, days_mask)
        if overlap:
            return False, f"❌ НАКЛАДКА! У этого преподавателя уже есть группа '{overlap.name}' в это же время на выбранные дни!", None
            
        new_group = Group(
            name=name,
            course_id=course_id,
            teacher_id=teacher_id,
            schedule_id=schedule_id,
            days_bitmask=days_mask,
            max_students=max_students
        )
        self.session.add(new_group)
        await self.session.commit()
        return True, "Группа создана", new_group

    async def set_group_schedule(self, group: Group, new_schedule_id: int) -> Tuple[bool, str]:
        """Изменяет временной слот (schedule) у группы с проверкой накладок."""
        if group.teacher_id:
            overlap = await self.check_schedule_overlap(group.teacher_id, new_schedule_id, group.days_bitmask, exclude_group_id=group.id)
            if overlap:
                return False, f"❌ НАКЛАДКА! У преподавателя уже есть группа '{overlap.name}' в это время!"
                
        group.schedule_id = new_schedule_id
        
        from bot.models.education import Schedule, Lesson
        from sqlalchemy import update
        new_sch = (await self.session.execute(select(Schedule).where(Schedule.id == new_schedule_id))).scalar_one()
        
        stmt = update(Lesson).where(
            Lesson.group_id == group.id,
            Lesson.is_completed == False,
            Lesson.lesson_date >= date.today()
        ).values(lesson_time=new_sch.time_start)
        await self.session.execute(stmt)
        
        await self.session.commit()
        return True, "Время занятий изменено, будущие уроки обновлены"

    async def set_group_teacher(self, group: Group, new_teacher_id: int) -> Tuple[bool, str]:
        """Изменяет учителя у группы с проверкой накладок."""
        if group.schedule_id:
            overlap = await self.check_schedule_overlap(new_teacher_id, group.schedule_id, group.days_bitmask, exclude_group_id=group.id)
            if overlap:
                return False, f"❌ НАКЛАДКА! У выбранного преподавателя уже есть группа '{overlap.name}' в это время!"
                
        group.teacher_id = new_teacher_id
        await self.session.commit()
        return True, "Учитель группы успешно изменен!"

    async def auto_generate_lessons(self, group: Group, days: int = 30) -> Tuple[bool, str, int]:
        """Автоматически генерирует уроки для группы на указанное количество дней вперед."""
        if not group.schedule:
            return False, "❌ У группы нет расписания!", 0
            
        today = date.today()
        end_date = today + timedelta(days=days)
        
        allowed_weekdays = []
        for i in range(7):
            if group.days_bitmask & (1 << i):
                allowed_weekdays.append(i)
                
        if not allowed_weekdays:
            return False, "У группы не выбраны дни недели!", 0
            
        stmt_existing = select(Lesson.lesson_date).where(
            Lesson.group_id == group.id, 
            Lesson.lesson_date >= today, 
            Lesson.lesson_date <= end_date
        )
        existing_dates = set((await self.session.execute(stmt_existing)).scalars().all())
        
        added_count = 0
        current_date = today
        while current_date <= end_date:
            if current_date.weekday() in allowed_weekdays:
                if current_date not in existing_dates:
                    new_lesson = Lesson(
                        group_id=group.id,
                        lesson_date=current_date,
                        teacher_id=group.teacher_id,
                        lesson_time=group.schedule.time_start,
                        topic="Занятие по расписанию"
                    )
                    self.session.add(new_lesson)
                    added_count += 1
            current_date += timedelta(days=1)
            
        if added_count > 0:
            await self.session.commit()
            return True, f"✅ Успех! Сгенерировано уроков: {added_count}", added_count
        else:
            return False, "Уроки на следующие 30 дней для этой группы уже сгенерированы.", 0

    async def graduate_group(self, group: Group, bot: Bot) -> Tuple[bool, int]:
        """Выпускает группу, меняя статусы студентов и рассылая уведомления."""
        stmt_sg = select(StudentGroup).where(
            StudentGroup.group_id == group.id, 
            StudentGroup.status == "active"
        ).options(selectinload(StudentGroup.student).selectinload(Student.user))
        
        sgs = (await self.session.execute(stmt_sg)).scalars().all()
        
        for sg in sgs:
            sg.status = "completed"
        
        group.is_active = False
        await self.session.commit()
        
        notifier = NotificationService(bot)
        count = 0
        for sg in sgs:
            if sg.student and sg.student.user:
                try:
                    await notifier.notify_user_status_change(
                        sg.student.user.telegram_id,
                        f"🎓 *Поздравляем с выпуском!*\n\n"
                        f"Ваша группа `{group.name}` успешно завершила обучение!\n"
                        f"Это большой шаг вперед. Надеемся увидеть вас на следующих продвинутых курсах нашего центра. Удачи!"
                    )
                    count += 1
                except Exception:
                    pass
                    
        return True, count
