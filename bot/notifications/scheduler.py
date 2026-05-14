import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from bot.database import async_session_factory
from bot.models.education import Lesson, StudentGroup, Group
from bot.models.user import Student, User
from bot.services.notification_service import NotificationService

logger = logging.getLogger(__name__)

class NotificationScheduler:
    def __init__(self, bot):
        self.bot = bot
        self.scheduler = AsyncIOScheduler()
        self.notifier = NotificationService(bot)

    async def check_upcoming_lessons(self):
        """Проверка уроков, начинающихся скоро (1 час и 30 мин)."""
        async with async_session_factory() as session:
            now = datetime.now()
            # Ищем уроки на сегодня в ближайшие 70 минут (с запасом)
            stmt = (
                select(Lesson)
                .where(Lesson.lesson_date == now.date())
                .options(
                    selectinload(Lesson.group)
                    .selectinload(Group.student_groups)
                    .selectinload(StudentGroup.student)
                    .selectinload(Student.user)
                )
            )
            result = await session.execute(stmt)
            lessons = result.scalars().all()
            
            for lesson_item in lessons:
                try:
                    if not lesson_item.lesson_time:
                        continue
                    
                    # Парсим время урока
                    lesson_dt = datetime.combine(lesson_item.lesson_date, datetime.strptime(lesson_item.lesson_time, "%H:%M").time())
                    diff = (lesson_dt - now).total_seconds() / 60
                    
                    # Если до урока ровно 60 или 30 минут (+/- 1 мин на точность крона)
                    if 58 <= diff <= 62:
                        await self._notify_group(lesson_item.id, lesson_item.topic, lesson_item.lesson_time, "через 1 час")
                    elif 28 <= diff <= 32:
                        await self._notify_group(lesson_item.id, lesson_item.topic, lesson_item.lesson_time, "через 30 минут")
                except Exception as e:
                    logger.error(f"Error processing lesson {lesson_item.id}: {e}")
                    continue

    async def _notify_group(self, lesson_id: int, lesson_topic: str, lesson_time: str, time_text: str):
        """Отправка уведомления всем ученикам группы с проверкой заморозки."""
        from bot.services.student_service import StudentService
        
        async with async_session_factory() as session:
            # Перезапрашиваем урок внутри новой сессии со всеми нужными связями
            stmt = (
                select(Lesson)
                .where(Lesson.id == lesson_id)
                .options(
                    selectinload(Lesson.group)
                    .selectinload(Group.student_groups)
                    .selectinload(StudentGroup.student)
                    .selectinload(Student.user)
                )
            )
            result = await session.execute(stmt)
            fresh_lesson = result.scalar_one_or_none()
            if not fresh_lesson or not fresh_lesson.group:
                return

            service = StudentService(session)
            for link in fresh_lesson.group.student_groups:
                try:
                    if await service.is_student_frozen(link.student_id):
                        continue
                    student_user = link.student.user
                    await self.notifier.notify_lesson_reminder(
                        student_user.telegram_id,
                        lesson_topic,
                        f"{lesson_time} ({time_text})"
                    )
                except Exception as e:
                    logger.error(f"Failed to notify student {link.student_id}: {e}")


    async def remind_about_debts(self):
        """Оповещение должников."""
        from bot.services.finance_service import FinanceService
        
        async with async_session_factory() as session:
            finance_service = FinanceService(session)
            debtors = await finance_service.get_debtors_list()
            
            for d in debtors:
                student = d['student']
                debt = d['debt_amount']
                
                try:
                    await self.notifier.notify_payment_limit(
                        user_id=student.user.telegram_id,
                        name=student.user.full_name,
                        amount=debt
                    )
                    # Обновляем дату напоминания
                    await finance_service.update_reminder_date(student.id)
                    logger.info(f"Debt reminder sent to {student.user.full_name} (Debt: {debt})")
                except Exception as e:
                    logger.error(f"Failed to send debt reminder to {student.id}: {e}")

    async def remind_about_homework(self):
        """Проверка вчерашних уроков на предмет несданного ДЗ (в 19:00)."""
        from datetime import timedelta
        async with async_session_factory() as session:
            yesterday = datetime.now().date() - timedelta(days=1)
            
            # Ищем уроки за вчерашний день
            stmt = (
                select(Lesson)
                .where(Lesson.lesson_date == yesterday)
                .options(
                    selectinload(Lesson.group)
                    .selectinload(Group.student_groups)
                    .selectinload(StudentGroup.student)
                    .selectinload(Student.user)
                )
            )
            lessons = (await session.execute(stmt)).scalars().all()
            
            for lesson in lessons:
                # Если домашка не задавалась, пропускаем
                if not getattr(lesson, 'homework', None):
                    continue
                    
                for link in lesson.group.student_groups:
                    student = link.student
                    if not student.is_active:
                        continue
                        
                    # Проверяем, сдавал ли этот студент домашку на этот урок
                    from bot.models.education import HomeworkSubmission
                    sub_stmt = select(HomeworkSubmission).where(
                        HomeworkSubmission.lesson_id == lesson.id,
                        HomeworkSubmission.student_id == student.id
                    )
                    submission = (await session.execute(sub_stmt)).scalar_one_or_none()
                    
                    if not submission:
                        # Не сдал! Отправляем пуш
                        try:
                            await self.notifier.notify_user_status_change(
                                student.user.telegram_id,
                                f"⏰ *Напоминание о домашнем задании!*\n\n"
                                f"Вчера прошел урок по теме: `{lesson.topic}`.\n"
                                f"Вы еще не сдали домашнее задание! Не забудьте загрузить его в Личном Кабинете, чтобы получить опыт и не отставать от группы."
                            )
                        except Exception as e:
                            logger.error(f"Failed to send HW reminder to {student.id}: {e}")

    async def check_trial_expiry(self):
        """Проверяет пробных учеников (trial) — уведомляет админа если прошло 3 дня."""
        from datetime import timedelta, date as dt_date
        async with async_session_factory() as session:
            three_days_ago = datetime.now() - timedelta(days=3)
            
            # Ищем все записи со статусом 'trial', созданные 3+ дня назад
            from bot.models.education import StudentGroup
            from sqlalchemy import and_
            from sqlalchemy.orm import joinedload
            
            stmt = (
                select(StudentGroup)
                .where(
                    and_(
                        StudentGroup.status == "trial",
                        StudentGroup.created_at <= three_days_ago  # type: ignore
                    )
                )
                .options(
                    joinedload(StudentGroup.student).joinedload(Student.user),
                    joinedload(StudentGroup.group)
                )
            )
            trial_sgs = (await session.execute(stmt)).scalars().all()
            
            if not trial_sgs:
                return
            
            # Находим всех администраторов
            from bot.models.user import UserRole
            admin_stmt = select(User).where(User.role == UserRole.ADMIN)
            admins = (await session.execute(admin_stmt)).scalars().all()
            
            for sg in trial_sgs:
                student = sg.student
                group = sg.group
                if not student or not student.user or not group:
                    continue
                    
                # Уведомляем каждого администратора с кнопками
                from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
                kb = InlineKeyboardMarkup(inline_keyboard=[[
                    InlineKeyboardButton(
                        text="✅ Перевести в основной состав",
                        callback_data=f"st_gr_add:{student.id}:{group.id}:active"
                    ),
                    InlineKeyboardButton(
                        text="❌ Отчислить",
                        callback_data=f"student_toggle:{student.id}"
                    )
                ]])
                
                for admin in admins:
                    try:
                        await self.bot.send_message(
                            admin.telegram_id,
                            f"⏳ *Пробный период истёк!*\n\n"
                            f"👤 Ученик: *{student.user.full_name}*\n"
                            f"🏫 Группа: `{group.name}`\n\n"
                            f"Примите решение: переводить ли ученика в основной состав?",
                            parse_mode="Markdown",
                            reply_markup=kb
                        )
                    except Exception as e:
                        logger.error(f"Failed to notify admin {admin.telegram_id} about trial: {e}")

    def start(self):
        """Запуск планировщика."""
        self.scheduler.add_job(self.check_upcoming_lessons, 'interval', minutes=1)
        self.scheduler.add_job(self.remind_about_debts, 'cron', hour=10, minute=0)
        self.scheduler.add_job(self.remind_about_homework, 'cron', hour=19, minute=0)
        # Проверяем пробников каждое утро в 9:00
        self.scheduler.add_job(self.check_trial_expiry, 'cron', hour=9, minute=0)
        
        self.scheduler.start()
        logger.info("APScheduler started successfully.")

    def shutdown(self):
        """Остановка планировщика."""
        self.scheduler.shutdown()
        logger.info("APScheduler shut down.")
