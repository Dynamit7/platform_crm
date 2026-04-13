from typing import Dict

# Статусы посещаемости
class AttendanceStatus:
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    EXCUSED = "excused"

    ICONS: Dict[str, str] = {
        PRESENT: "✅",
        ABSENT: "❌",
        LATE: "⏳",
        EXCUSED: "📩",
        None: "⚪️"
    }
    
    LABELS: Dict[str, str] = {
        PRESENT: "Присутствует",
        ABSENT: "Отсутствует",
        LATE: "Опоздал",
        EXCUSED: "Уважительная"
    }

# Статусы заявок и учеников
class StudentStatus:
    PENDING = "pending"
    ACTIVE = "active"
    FROZEN = "frozen"
    GRADUATED = "graduated"
    
    ICONS: Dict[str, str] = {
        PENDING: "⏳",
        ACTIVE: "✅",
        FROZEN: "❄️",
        GRADUATED: "🎓"
    }

# Префиксы для Callback Query
class CallbackPrefix:
    ADMIN_MAIN = "admin:main"
    ADMIN_STUDENTS = "admin:students"
    ADMIN_APPS = "admin:apps"
    ADMIN_COURSES = "admin:courses"
    ADMIN_GROUPS = "admin:groups"
    ADMIN_REPORTS = "admin:reports"
    ADMIN_TEACHERS = "admin:teachers"
    ADMIN_SETTINGS = "admin_menu:settings"
    
    STUDENT_CABINET = "student:cabinet"
    TEACHER_PANEL = "teacher:panel"

# Лимиты и настройки
PAGINATION_LIMIT = 10
DEBT_REMINDER_DAYS = 3
