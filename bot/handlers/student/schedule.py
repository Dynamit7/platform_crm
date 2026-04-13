from aiogram import Router, types, F
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from bot.models.user import User, Student
from bot.models.education import Lesson
from bot.keyboards.student import get_back_to_cabinet_kb

router = Router(name="student_schedule")

@router.callback_query(F.data == "student:schedule")
async def view_student_schedule(callback: types.CallbackQuery, session: AsyncSession, db_user: User):
    """Просмотр расписания занятий для групп ученика."""
    # Получаем студента и ID его групп
    stmt = (
        select(Student)
        .where(Student.user_id == db_user.id)
        .options(selectinload(Student.student_groups))
    )
    res = await session.execute(stmt)
    student = res.scalar_one_or_none()
    
    if not student or not student.student_groups:
        await callback.message.edit_text("❌ Вы не привязаны ни к одной группе.", reply_markup=get_back_to_cabinet_kb())
        return

    group_ids = [link.group_id for link in student.student_groups]
    
    # Ищем уроки этих групп на ближайшее время
    stmt = (
        select(Lesson)
        .where(Lesson.group_id.in_(group_ids))
        .options(selectinload(Lesson.group))
        .order_by(Lesson.lesson_date.asc())
        .limit(10)
    )
    res = await session.execute(stmt)
    lessons = res.scalars().all()
    
    text = "🗓 *Ваше ближайшее расписание:*\n\n"
    if not lessons:
        text += "_Занятий пока не запланировано._"
    else:
        for l in lessons:
            text += (
                f"📅 *{l.lesson_date.strftime('%d.%m')}* | {l.lesson_time or '--:--'}\n"
                f"📖 Группа: {l.group.name}\n"
                f"📝 Тема: {l.topic}\n\n"
            )

    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=get_back_to_cabinet_kb())
    await callback.answer()
