from enum import Enum


class NotificationType(Enum):
    LESSON_REMINDER_60 = "lesson_reminder_60"
    LESSON_REMINDER_30 = "lesson_reminder_30"
    LESSON_REMINDER = "lesson_reminder"
    STATUS_CHANGE = "status_change"
    PAYMENT_REMINDER = "payment_reminder"
    PAYMENT_SUCCESS = "payment_success"
    HOMEWORK_NEW = "homework_new"
    HOMEWORK_GRADED = "homework_graded"
    NEW_HOMEWORK = "new_homework"
    GRADE_REVIEW = "grade_review"
    FEEDBACK_REQUEST = "feedback_request"
    SYSTEM_ALERT = "system_alert"
    SCHEDULE_DAILY = "schedule_daily"
