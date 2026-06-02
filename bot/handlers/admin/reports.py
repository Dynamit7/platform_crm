import logging
from aiogram import Router, types, F
from aiogram.types import BufferedInputFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from bot.models.user import User, UserRole, Student
from bot.models.education import Group, Attendance, StudentGroup
from bot.models.finance import Finance
from bot.utils.excel_exporter import export_to_excel
from bot.keyboards.admin import get_admin_reports_keyboard

router = Router(name="admin_reports")
logger = logging.getLogger(__name__)

@router.callback_query(F.data == "report_students")
async def export_students_report(callback: types.CallbackQuery, session: AsyncSession):
    """Экспорт всех учеников."""
    stmt = select(User).where(User.role == UserRole.STUDENT)
    result = await session.execute(stmt)
    users = result.scalars().all()
    
    if not users:
        await callback.answer("Нет данных для экспорта", show_alert=True)
        return

    data = []
    for u in users:
        data.append({
            "ID": u.id,
            "ФИО": u.full_name,
            "Телефон": u.phone,
            "Email": u.email or "---",
            "Дата регистрации": u.created_at.strftime("%d.%m.%Y"),
            "Статус": "Активен" if u.is_active else "Заблокирован"
        })

    file_content = export_to_excel(data, "Ученики")
    await callback.message.answer_document(
        BufferedInputFile(file_content.read(), filename="students_list.xlsx"),
        caption="📋 Полный список учеников центра"
    )
    await callback.answer()

@router.callback_query(F.data == "report_finance")
async def export_finance_report(callback: types.CallbackQuery, session: AsyncSession):
    """Экспорт всех платежей."""
    stmt = select(Finance).order_by(Finance.payment_date.desc()).options(selectinload(Finance.user))
    result = await session.execute(stmt)
    payments = result.scalars().all()
    
    if not payments:
        await callback.answer("Платежей еще не было", show_alert=True)
        return

    data = []
    for p in payments:
        data.append({
            "Дата": p.payment_date.strftime("%d.%m.%Y"),
            "Ученик": p.user.full_name if p.user else "---",
            "Сумма (сум)": p.amount,
            "Метод": p.payment_method or "---",
            "Статус": p.status,
            "Комментарий": p.purpose or ""
        })

    file_content = export_to_excel(data, "Платежи")
    await callback.message.answer_document(
        BufferedInputFile(file_content.read(), filename="finance_report.xlsx"),
        caption="💰 Отчет по финансовым операциям"
    )
    await callback.answer()

@router.callback_query(F.data == "report_funnel")
async def export_group_report(callback: types.CallbackQuery, session: AsyncSession):
    """Сводный отчет по успеваемости (вместо воронки для примера)."""
    stmt = select(Group).options(
        selectinload(Group.student_groups)
        .selectinload(StudentGroup.student)
        .selectinload(Student.user)
    )
    result = await session.execute(stmt)
    groups = result.scalars().all()
    
    if not groups:
        await callback.answer("Групп еще нет", show_alert=True)
        return

    data = []
    for g in groups:
        for link in g.student_groups:
            student = link.student
            # Считаем посещаемость
            att_stmt = select(func.count(Attendance.id)).where(Attendance.student_id == student.id, Attendance.status == "present")
            attended = await session.scalar(att_stmt) or 0
            
            data.append({
                "Группа": g.name,
                "Ученик": student.user.full_name,
                "Телефон": student.user.phone,
                "Посещений": attended,
                "Статус в группе": link.status
            })

    file_content = export_to_excel(data, "Успеваемость")
    await callback.message.answer_document(
        BufferedInputFile(file_content.read(), filename="performance_report.xlsx"),
        caption="📊 Сводный отчет по посещаемости групп"
    )
    await callback.answer()
