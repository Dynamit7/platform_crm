"""Telegram push notifications from web CRM."""
import os, logging
import requests

logger = logging.getLogger("crm.notifications")

BOT_TOKEN = os.getenv("BOT_TOKEN")


def _send(telegram_id: int, text: str) -> bool:
    if not BOT_TOKEN or not telegram_id:
        return False
    try:
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
        resp = requests.post(url, json={
            "chat_id": telegram_id,
            "text": text,
            "parse_mode": "Markdown",
        }, timeout=5)
        return resp.status_code == 200
    except Exception as e:
        logger.warning(f"TG notify error (to {telegram_id}): {e}")
        return False


def notify_student_payment(student_tg_id: int, amount: float, currency: str = "RUB"):
    _send(student_tg_id,
        f"💳 *Оплата зафиксирована!*\n"
        f"Сумма: `{amount} {currency}`\n"
        f"Спасибо за своевременную оплату!")


def notify_student_homework_graded(student_tg_id: int, grade: str, feedback: str | None = None):
    text = (
        f"📝 *Домашнее задание проверено!*\n"
        f"⭐ Оценка: `{grade}`\n"
    )
    if feedback:
        text += f"✉️ {feedback}"
    _send(student_tg_id, text)


def notify_admin_new_lead(admin_tg_ids: list[int], lead_name: str, lead_phone: str, course_name: str | None = None):
    text = (
        f"🆕 *Новая заявка!*\n"
        f"👤 {lead_name}\n"
        f"📞 {lead_phone}\n"
    )
    if course_name:
        text += f"📚 Курс: {course_name}\n"
    text += "\n_Зайдите в CRM для обработки_"
    for tid in admin_tg_ids:
        _send(tid, text)


def notify_admin_new_registration(admin_tg_ids: list[int], user_name: str, user_email: str):
    text = (
        f"📝 *Новая регистрация на сайте!*\n"
        f"👤 {user_name}\n"
        f"📧 {user_email}\n"
        f"_Требуется подтверждение администратором_"
    )
    for tid in admin_tg_ids:
        _send(tid, text)


def notify_student_welcome(student_tg_id: int):
    _send(student_tg_id,
        f"👋 *Добро пожаловать в SmartEdu!*\n"
        f"Ваш аккаунт активирован. Используйте /cabinet для входа в личный кабинет.")


def notify_lead_converted(student_tg_id: int):
    _send(student_tg_id,
        f"🎉 *Ваша заявка одобрена!*\n"
        f"Добро пожаловать в ряды студентов SmartEdu!\n"
        f"Скоро с вами свяжется администратор.")


def get_admin_telegram_ids(db_session) -> list[int]:
    """Get telegram IDs of all admin users."""
    from models import User
    admins = db_session.query(User).filter(User.role == "admin", User.telegram_id.isnot(None)).all()
    return [a.telegram_id for a in admins]
