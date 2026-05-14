import logging
from aiogram import Router, types, F, Bot
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from bot.models.user import User, UserRole
from bot.services.registration_service import RegistrationService
from bot.services.notification_service import NotificationService
from bot.keyboards.admin import get_pending_user_kb, get_admin_main_kb
from bot.utils.pagination import Paginator
from aiogram.utils.keyboard import InlineKeyboardBuilder

router = Router(name="admin_apps")
logger = logging.getLogger(__name__)

@router.callback_query(F.data.startswith("admin_apps:new"))
async def list_pending_applications(callback: types.CallbackQuery, session: AsyncSession):
    """Список всех пользователей в ожидании активации с пагинацией."""
    parts = callback.data.split(":")
    page = int(parts[2]) if len(parts) > 2 else 1
    
    stmt = select(User).where(User.role == UserRole.PENDING)
    result = await session.execute(stmt)
    pending_users = result.scalars().all()
    
    if not pending_users:
        await callback.message.edit_text(
            "📝 *Заявки на обучение*\n\nНа данный момент новых заявок нет.",
            parse_mode="Markdown",
            reply_markup=get_admin_main_kb()
        )
        return
    
    paginator = Paginator(pending_users, page=page, limit=5, callback_prefix="admin_apps:new")
    items = paginator.get_page_items()
    
    builder = InlineKeyboardBuilder()
    for user in items:
        builder.row(types.InlineKeyboardButton(text=f"👤 {user.full_name}", callback_data=f"app_view:{user.id}"))
    
    paginator.add_pagination_buttons(builder)
    builder.row(types.InlineKeyboardButton(text="⬅️ Главное меню", callback_data="admin:main"))
    
    text = f"📝 *Новые заявки ({len(pending_users)}):*\n\nВыберите анкету (стр. {page}/{paginator.total_pages}):"
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=builder.as_markup())
    await callback.answer()

@router.callback_query(F.data.startswith("app_view:"))
async def view_application(callback: types.CallbackQuery, session: AsyncSession):
    """Просмотр деталей выбранной заявки."""
    from sqlalchemy.orm import selectinload
    user_id = int(callback.data.split(":")[1])
    
    stmt = select(User).where(User.id == user_id).options(selectinload(User.registrations))
    user = (await session.execute(stmt)).scalar_one_or_none()
    
    if not user:
        await callback.answer("Ошибка: пользователь не найден")
        return

    last_reg = user.registrations[-1] if user.registrations else None
    trial_time_str = last_reg.trial_lesson_time.strftime('%d.%m.%Y %H:%M') if last_reg and last_reg.trial_lesson_time else "не указано"

    text = (
        f"📋 *Анкета кандидата*\n\n"
        f"👤 *Имя:* {user.full_name}\n"
        f"📞 *Телефон:* {user.phone}\n"
        f"⏳ *Зарегистрирован:* {user.created_at.strftime('%d.%m.%Y %H:%M')}\n\n"
        f"🗓 *Пробный урок:* `{trial_time_str}`\n"
        f"📚 *Заметки:* {last_reg.notes if last_reg else '---'}\n\n"
        f"Одобрить доступ?"
    )
    await callback.message.edit_text(text, parse_mode="Markdown", reply_markup=get_pending_user_kb(user.id))

@router.callback_query(F.data.startswith("app_approve:"))
async def approve_application(callback: types.CallbackQuery, session: AsyncSession, bot: Bot):
    """Атомарная активация ученика через RegistrationService."""
    user_id = int(callback.data.split(":")[1])
    
    reg_service = RegistrationService(session)
    notifier = NotificationService(bot)
    
    try:
        # ОСНОВНАЯ ЛОГИКА ТЕПЕРЬ ТУТ (включает создание записи в Students)
        student = await reg_service.approve_application(user_id)
        user = (await session.execute(select(User).where(User.id == user_id))).scalar_one()

        # Уведомляем ученика
        await notifier.notify_user_status_change(
            user.telegram_id, 
            f"🎉 *Поздравляем! Ваша заявка одобрена.*\n\n"
            f"🆔 Ваш код ученика: `{student.student_code}`\n\n"
            f"Теперь вам доступен Личный Кабинет ученика.\n"
            f"Используйте кнопку ниже для входа."
        )
        await callback.answer(f"✅ Ученик {user.full_name} активирован!\nКод: {student.student_code}", show_alert=True)
        
        # Уведомляем канал
        await notifier.notify_channel_action(
            f"✅ *ЗАЯВКА ОДОБРЕНА*\n\n"
            f"Ученик: {user.full_name}\n"
            f"ID студента: `{student.student_code}`\n\n"
            f"Активация проведена администратором."
        )
        
    except Exception as e:
        logger.error(f"Approval failed: {e}")
        await callback.answer(f"❌ Ошибка при одобрении: {e}", show_alert=True)
    
    await list_pending_applications(callback, session)

@router.callback_query(F.data.startswith("app_reject:"))
async def reject_application(callback: types.CallbackQuery, session: AsyncSession):
    user_id = int(callback.data.split(":")[1])
    stmt = select(User).where(User.id == user_id)
    user = (await session.execute(stmt)).scalar_one_or_none()
    
    if user:
        user.is_active = False
        await session.commit()
        await callback.answer(f"❌ Заявка {user.full_name} отклонена", show_alert=True)
        
        notifier = NotificationService(callback.bot)
        await notifier.notify_channel_action(
            f"❌ *ЗАЯВКА ОТКЛОНЕНА*\n\n"
            f"Ученик: {user.full_name}\n"
            f"Заявка была отклонена администратором."
        )
    
    await list_pending_applications(callback, session)

@router.callback_query(F.data.startswith("admin_apps:approved"))
async def list_approved_applications(callback: types.CallbackQuery, session: AsyncSession):
    """Одобренные заявки - студенты."""
    # Пока выводим просто заглушку, либо список недавно добавленных студентов
    await callback.message.edit_text(
        "✅ *Одобренные ученики*\n\nДля детального просмотра и управления одобренными студентами перейдите в раздел `Пользователи -> Поиск ученика`.",
        parse_mode="Markdown",
        reply_markup=get_admin_main_kb()
    )
    await callback.answer()
