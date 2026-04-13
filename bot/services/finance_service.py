from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from sqlalchemy.orm import selectinload
from bot.models.user import User, Student
from bot.models.education import Registration, Course
from bot.models.finance import Finance
from typing import List, Dict, Any, Optional
from datetime import date

class FinanceService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_payment(self, 
                             student_id: int, 
                             amount: float, 
                             payment_type: str = "monthly_fee",
                             registration_id: Optional[int] = None,
                             payment_method: str = "Cash",
                             admin_id: Optional[int] = None,
                             status: str = "succeeded") -> Finance:
        """Создает новую запись о платеже."""
        # Получаем user_id из student_id
        stmt = select(Student).where(Student.id == student_id)
        student = (await self.session.execute(stmt)).scalar_one()
        
        new_finance = Finance(
            user_id=student.user_id,
            student_id=student_id,
            amount=amount,
            payment_type=payment_type,
            registration_id=registration_id,
            payment_method=payment_method,
            admin_id=admin_id,
            status=status
        )
        self.session.add(new_finance)
        await self.session.commit()
        await self.session.refresh(new_finance)
        return new_finance

    async def get_debtors_list(self) -> List[Dict[str, Any]]:
        """
        Оптимизированный расчет баланса с учетом ТИПОВ платежей (включая возвраты).
        """
        # 1. Подзапрос для суммирования платежей (с учетом возвратов через CASE)
        payments_sum_logic = case(
            (Finance.payment_type == "refund", -Finance.amount),
            else_=Finance.amount
        )

        payments_sub = (
            select(
                Finance.student_id,
                func.sum(payments_sum_logic).label("total_balance")
            )
            .where(Finance.status == "succeeded")
            .group_by(Finance.student_id)
        ).subquery()

        # 2. Подзапрос стоимости курсов (активные регистрации)
        courses_sub = (
            select(
                Student.id.label("student_id"),
                func.sum(Course.price_group).label("total_cost")
            )
            .join(User, User.id == Student.user_id)
            .join(Registration, Registration.user_id == User.id)
            .join(Course, Course.id == Registration.course_id)
            .group_by(Student.id)
        ).subquery()

        # 3. Финальный джойн
        stmt = (
            select(
                Student,
                func.coalesce(payments_sub.c.total_balance, 0).label("paid"),
                func.coalesce(courses_sub.c.total_cost, 0).label("cost")
            )
            .options(selectinload(Student.user))
            .outerjoin(payments_sub, Student.id == payments_sub.c.student_id)
            .outerjoin(courses_sub, Student.id == courses_sub.c.student_id)
            .where(Student.is_active == True)
        )

        result = await self.session.execute(stmt)
        debtors = []
        
        for row in result:
            student, paid, cost = row
            balance = float(paid) - float(cost)
            
            if balance < 0:
                if student.last_debt_reminder and (date.today() - student.last_debt_reminder).days < 3:
                    continue
                debtors.append({"student": student, "debt_amount": abs(balance)})
        
        return debtors
