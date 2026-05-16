from enum import Enum


class NotificationType(Enum):
    LESSON_REMINDER_60 = "lesson_reminder_60"
    LESSON_REMINDER_30 = "lesson_reminder_30"
    STATUS_CHANGE = "status_change"
    PAYMENT_REMINDER = "payment_reminder"
    PAYMENT_SUCCESS = "payment_success"
    HOMEWORK_NEW = "homework_new"
    HOMEWORK_GRADED = "homework_graded"
    SYSTEM_ALERT = "system_alert"
    SCHEDULE_DAILY = "schedule_daily"
