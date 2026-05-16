from bot.notifications.types import NotificationType

TEMPLATES = {
    NotificationType.LESSON_REMINDER_60: (
        "🕒 *Напоминание за 1 час!*\n\n"
        "Уважаемый {name}, ваш урок по теме \"{topic}\" начнется через 60 минут.\n"
        "📍 Приготовьте все необходимое!"
    ),
    NotificationType.LESSON_REMINDER_30: (
        "⏳ *Осталось 30 минут!*\n\n"
        "Урок \"{topic}\" начнется совсем скоро. Проверьте интернет и заходите в кабинет."
    ),
    NotificationType.STATUS_CHANGE: (
        "🔔 *Изменение статуса*\n\n"
        "Ваш статус в системе изменен на: *{status}*."
    ),
    NotificationType.PAYMENT_REMINDER: (
        "💳 *Напоминание об оплате*\n\n"
        "Уважаемый {name}, напоминаем о необходимости пополнить баланс для продолжения обучения.\n"
        "Текущий баланс: {balance} сум."
    ),
    NotificationType.PAYMENT_SUCCESS: (
        "✅ *Оплата получена!*\n\n"
        "Сумма: {amount} {currency}\n"
        "{description}\n"
        "Спасибо, что вы с нами! 🙌"
    ),
    NotificationType.HOMEWORK_NEW: (
        "📝 *Новое домашнее задание*\n\n"
        "Преподаватель добавил ДЗ к уроку \"{topic}\". Срок сдачи: {deadline}."
    ),
    NotificationType.HOMEWORK_GRADED: (
        "⭐ *ДЗ проверено!*\n\n"
        "Ваше задание по теме \"{topic}\" проверено. Оценка: *{grade}*."
    ),
    NotificationType.SCHEDULE_DAILY: (
        "📅 *Расписание на завтра*\n\n"
        "{lessons}\n\n"
        "Готовьтесь заранее и не опаздывайте! 🎯"
    )
}
