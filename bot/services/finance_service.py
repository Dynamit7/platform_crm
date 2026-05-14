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

    async def update_reminder_date(self, student_id: int):
        stmt = select(Student).where(Student.id == student_id)
        student = (await self.session.execute(stmt)).scalar_one()
        student.last_debt_reminder = date.today()
        await self.session.commit()

    async def get_debtors_list(self) -> List[Dict[str, Any]]:
        """
        Умный биллинг: проверяет активные группы студента (StudentGroup).
        Если с момента последней оплаты прошло более 30 дней, студент считается должником.
        Оптимизировано для предотвращения N+1 проблемы.
        """
        from bot.models.education import StudentGroup, Group
        from bot.models.user import User
        from datetime import timedelta
        
        thirty_days_ago = date.today() - timedelta(days=30)
        
        # Получаем всех активных учеников со связанными данными
        stmt = (
            select(Student)
            .options(
                selectinload(Student.user),
                selectinload(Student.student_groups).selectinload(StudentGroup.group).selectinload(Group.course)
            )
            .where(Student.is_active == True)
        )
        students = (await self.session.execute(stmt)).scalars().all()
        
        # Создаем список user_id для фильтрации платежей
        user_ids = [st.user_id for st in students if not (st.frozen_until and st.frozen_until >= date.today())]
        last_payments = {}
        if user_ids:
            # Получаем самый свежий успешный платеж для каждого user_id
            subq = (
                select(Finance.user_id, func.max(Finance.payment_date).label('max_date'))
                .where(Finance.user_id.in_(user_ids), Finance.status == "succeeded")
                .group_by(Finance.user_id)
                .subquery()
            )
            
            pay_stmt = (
                select(Finance)
                .join(subq, (Finance.user_id == subq.c.user_id) & (Finance.payment_date == subq.c.max_date))
            )
            payments = (await self.session.execute(pay_stmt)).scalars().all()
            for p in payments:
                last_payments[p.user_id] = p

        debtors = []
        for st in students:
            if st.frozen_until and st.frozen_until >= date.today():
                continue
                
            sgs = [sg for sg in st.student_groups if sg.status == "active"]
            if not sgs:
                continue
                
            monthly_fee = 0.0
            for sg in sgs:
                course = sg.group.course
                if not course: continue
                if sg.group.max_students == 1:
                    monthly_fee += (course.price_individual or 0)
                else:
                    monthly_fee += (course.price_group or 0)
                    
            if monthly_fee == 0:
                continue
                
            last_payment = last_payments.get(st.user_id)
            
            if not last_payment or last_payment.payment_date.date() < thirty_days_ago:
                if st.last_debt_reminder and (date.today() - st.last_debt_reminder).days < 3:
                    continue
                debtors.append({"student": st, "debt_amount": monthly_fee})
                
        return debtors

    async def is_student_debtor(self, student: Student) -> bool:
        """Быстрая проверка, является ли студент должником (для блокировки материалов)."""
        from bot.models.education import StudentGroup, Group
        from datetime import timedelta
        
        thirty_days_ago = date.today() - timedelta(days=30)
        
        if not student.is_active or (student.frozen_until and student.frozen_until >= date.today()):
            return True
            
        sg_stmt = select(StudentGroup).where(StudentGroup.student_id == student.id, StudentGroup.status.in_(["active"]))
        sgs = (await self.session.execute(sg_stmt)).scalars().all()
        if not sgs: return False # Нет групп - нет долгов
            
        pay_stmt = select(Finance).where(Finance.user_id == student.user_id, Finance.status == "succeeded").order_by(Finance.payment_date.desc()).limit(1)
        last_payment = (await self.session.execute(pay_stmt)).scalars().first()
        
        if not last_payment or last_payment.payment_date.date() < thirty_days_ago:
            return True
            
        return False
