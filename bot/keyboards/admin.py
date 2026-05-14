from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
from bot.keyboards.common import get_back_button

def get_admin_main_kb() -> InlineKeyboardMarkup:
    """Главное меню админ-панели (красивый вид)."""
    buttons = [
        # --- Люди ---
        [
            InlineKeyboardButton(text="📝 Заявки", callback_data="admin:apps"),
            InlineKeyboardButton(text="👥 Ученики", callback_data="admin:students"),
        ],
        [
            InlineKeyboardButton(text="👨‍🏫 Учителя", callback_data="admin:teachers"),
            InlineKeyboardButton(text="🏫 Группы", callback_data="admin:groups"),
        ],
        [
            InlineKeyboardButton(text="🔍 Управление / Поиск", callback_data="admin:users"),
        ],
        # --- Учеба ---
        [
            InlineKeyboardButton(text="🎓 Курсы", callback_data="admin:courses"),
            InlineKeyboardButton(text="📅 Расписание", callback_data="admin:schedule"),
        ],
        # --- Бизнес ---
        [
            InlineKeyboardButton(text="💰 Финансы", callback_data="admin:finance"),
            InlineKeyboardButton(text="📊 Отчеты", callback_data="admin:reports"),
        ],
        # --- Коммуникация ---
        [InlineKeyboardButton(text="📢 Рассылка", callback_data="admin:broadcast")],
        [InlineKeyboardButton(text="⚙️ Настройки", callback_data="admin:settings")],
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_pending_user_kb(user_id: int) -> InlineKeyboardMarkup:
    """Клавиатура для управления заявкой пользователя."""
    buttons = [
        [
            InlineKeyboardButton(text="✅ Принять", callback_data=f"app_approve:{user_id}"),
            InlineKeyboardButton(text="❌ Отклонить", callback_data=f"app_reject:{user_id}")
        ],
        [get_back_button("admin:apps")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_admin_apps_kb() -> InlineKeyboardMarkup:
    """Меню управления заявками."""
    buttons = [
        [InlineKeyboardButton(text="🕒 Новые заявки", callback_data="admin_apps:new")],
        [InlineKeyboardButton(text="✅ Одобренные", callback_data="admin_apps:approved")],
        [get_back_button("admin:main")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_admin_users_kb() -> InlineKeyboardMarkup:
    """Меню управления пользователями."""
    buttons = [
        [InlineKeyboardButton(text="🔍 Поиск ученика", callback_data="admin_users:search")],
        [InlineKeyboardButton(text="👨‍🏫 Учителя", callback_data="admin_users:teachers")],
        [get_back_button("admin:main")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_admin_groups_kb() -> InlineKeyboardMarkup:
    """Меню управления группами."""
    buttons = [
        [InlineKeyboardButton(text="📋 Список групп", callback_data="admin_groups:list")],
        [InlineKeyboardButton(text="➕ Создать группу", callback_data="admin_groups:create")],
        [get_back_button("admin:main")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_admin_reports_keyboard() -> InlineKeyboardMarkup:
    """Меню аналитики."""
    buttons = [
        [InlineKeyboardButton(text="📊 Воронка продаж", callback_data="report_funnel")],
        [InlineKeyboardButton(text="👥 Список учеников", callback_data="report_students")],
        [InlineKeyboardButton(text="💰 Финансовый отчет", callback_data="report_finance")],
        [get_back_button("admin:main")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_admin_schedule_main_kb() -> InlineKeyboardMarkup:
    """Главное меню расписания."""
    buttons = [
        [InlineKeyboardButton(text="🗓 Посмотреть все уроки", callback_data="admin_sch:list_all")],
        [InlineKeyboardButton(text="➕ Назначить новый урок", callback_data="admin_sch:add_start")],
        [get_back_button("admin:main")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)

def get_lesson_manage_kb(lesson_id: int) -> InlineKeyboardMarkup:
    """Клавиатура управления конкретным уроком."""
    buttons = [
        [InlineKeyboardButton(text="❌ Удалить урок", callback_data=f"lesson_delete:{lesson_id}")],
        [get_back_button("admin_sch:list_all")]
    ]
    return InlineKeyboardMarkup(inline_keyboard=buttons)
