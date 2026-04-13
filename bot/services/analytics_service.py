import pandas as pd
from sqlalchemy import select, func, and_, case
from sqlalchemy.ext.asyncio import AsyncSession
from bot.models.education import Registration, Attendance, Group, Course
from bot.models.user import User, Student
from bot.payments.models import Finance as YookassaPayment
from datetime import datetime, timedelta


class AnalyticsService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_funnel_stats(self) -> pd.DataFrame:
        """
        Calculates Sales Funnel statistics.
        """
        # Leads (Total registrations)
        leads_res = await self.session.execute(select(func.count(Registration.id)))
        leads = leads_res.scalar() or 0

        # Trial (Scheduled trials)
        trial_res = await self.session.execute(
            select(func.count(Registration.id)).where(Registration.trial_lesson_time.isnot(None))
        )
        trials = trial_res.scalar() or 0

        # Paid (Students with successful payments)
        paid_res = await self.session.execute(
            select(func.count(func.distinct(YookassaPayment.user_id)))
            .where(YookassaPayment.status == "succeeded")
        )
        paid = paid_res.scalar() or 0

        data = {
            "Этап": ["Заявки (Leads)", "Пробные (Trials)", "Оплатили (Paid)"],
            "Кол-во": [leads, trials, paid],
            "Конверсия (%)": [
                100, 
                round((trials/leads * 100), 2) if leads > 0 else 0,
                round((paid/trials * 100), 2) if trials > 0 else 0
            ]
        }
        return pd.DataFrame(data)

    async def get_students_report(self) -> pd.DataFrame:
        """
        Returns a detailed list of students with group and course info.
        """
        stmt = (
            select(
                User.full_name.label("Имя"),
                User.phone.label("Телефон"),
                Course.name.label("Курс"),
                Group.name.label("Группа"),
                Student.is_active.label("Активен")
            )
            .join(Student, Student.user_id == User.id)
            .outerjoin(Registration, Registration.user_id == User.id)
            .outerjoin(Course, Course.id == Registration.course_id)
            .outerjoin(Group, Group.course_id == Course.id)
            .distinct()
        )
        result = await self.session.execute(stmt)
        data = result.all()
        return pd.DataFrame([dict(row._mapping) for row in data])

    async def get_financial_report(self, days: int = 30) -> pd.DataFrame:
        """
        Summarizes revenue for the last N days.
        """
        since_date = datetime.now() - timedelta(days=days)
        stmt = (
            select(
                func.date(YookassaPayment.created_at).label("Дата"),
                func.sum(YookassaPayment.amount).label("Сумма"),
                func.count(YookassaPayment.id).label("Транзакций")
            )
            .where(and_(YookassaPayment.status == "succeeded", YookassaPayment.created_at >= since_date))
            .group_by(func.date(YookassaPayment.created_at))
            .order_by(func.date(YookassaPayment.created_at))
        )
        result = await self.session.execute(stmt)
        data = result.all()
        return pd.DataFrame([dict(row._mapping) for row in data])

    async def get_attendance_report(self) -> pd.DataFrame:
        """
        Aggregates attendance by student.
        """
        stmt = (
            select(
                User.full_name.label("Студент"),
                func.count(Attendance.id).label("Всего занятий"),
                func.sum(case((Attendance.status == "present", 1), else_=0)).label("Был"),
                func.sum(case((Attendance.status == "absent", 1), else_=0)).label("Пропустил")
            )
            .join(Student, Student.id == Attendance.student_id)
            .join(User, User.id == Student.user_id)
            .group_by(User.full_name)
        )
        # Using SQLAlchemy case
        result = await self.session.execute(stmt)
        data = result.all()
        return pd.DataFrame([dict(row._mapping) for row in data])
