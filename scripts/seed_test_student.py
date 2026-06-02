"""
seed_test_student.py — заполняет тестовые данные для student@test.com (id=36).

Идемпотентен: безопасно перезапускать. Никакие реальные данные не трогаются —
скрипт создаёт сущности только если их ещё нет, либо обновляет конкретные
поля у user 36 / student 20.

Запуск:
    .venv\\Scripts\\python.exe scripts\\seed_test_student.py
"""
from __future__ import annotations

import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from core.models import (
    Achievement,
    Attendance,
    Course,
    Enrollment,
    Group,
    Homework,
    HomeworkSubmission,
    Lesson,
    Notification,
    Payment,
    Schedule,
    Student,
    StudentAchievement,
    StudentGroup,
    Teacher,
    User,
    UserAchievement,
    VocabularyWord,
)

DB_URL = "postgresql+psycopg2://postgres:root@localhost:5432/education_crm"
STUDENT_EMAIL = "student@test.com"
TODAY = date.today()
NOW = datetime.now(timezone.utc)


def get_or_create_student(s: Session) -> tuple[User, Student]:
    user = s.scalar(select(User).where(User.email == STUDENT_EMAIL))
    if not user:
        raise SystemExit(f"User {STUDENT_EMAIL} not found — seed aborted.")

    if not user.phone:
        user.phone = "+998901234567"
    if not user.date_of_birth:
        user.date_of_birth = date(2002, 4, 15)
    if not user.avatar_url:
        user.avatar_url = "https://api.dicebear.com/7.x/avataaars/svg?seed=TestStudent"
    if not user.username:
        user.username = "test_student"
    user.is_active = True

    student = s.scalar(select(Student).where(Student.user_id == user.id))
    if not student:
        student = Student(
            user_id=user.id,
            student_code=f"STU{user.id:04d}",
            enrollment_date=TODAY - timedelta(days=60),
            is_active=True,
            xp=1250,
            level=5,
            streak_days=7,
            last_activity_date=TODAY,
        )
        s.add(student)
        s.flush()
    else:
        if student.xp < 100:
            student.xp = 1250
        if student.level < 2:
            student.level = 5
        if not student.last_activity_date:
            student.last_activity_date = TODAY

    return user, student


def pick_course_teacher_group(s: Session) -> tuple[Course, Teacher, Group]:
    course = s.scalar(select(Course).where(Course.id == 1))
    teacher = s.scalar(select(Teacher).where(Teacher.id == 5))
    if not course or not teacher:
        raise SystemExit("Course id=1 / Teacher id=5 not found — seed aborted.")

    group = s.scalar(select(Group).where(Group.id == 2))
    if not group:
        group = Group(
            name="Test Group B1",
            course_id=course.id,
            teacher_id=teacher.id,
            max_students=8,
            current_students=0,
            start_date=TODAY - timedelta(days=60),
            is_active=True,
        )
        s.add(group)
        s.flush()
    return course, teacher, group


def link_student_to_group(s: Session, student: Student, group: Group) -> None:
    link = s.scalar(
        select(StudentGroup).where(
            StudentGroup.student_id == student.id,
            StudentGroup.group_id == group.id,
        )
    )
    if not link:
        s.add(StudentGroup(student_id=student.id, group_id=group.id, status="active"))
        group.current_students = (group.current_students or 0) + 1


def ensure_enrollment(s: Session, user: User, course: Course, group: Group) -> None:
    e = s.scalar(
        select(Enrollment).where(
            Enrollment.student_id == user.id,
            Enrollment.course_id == course.id,
        )
    )
    if not e:
        s.add(
            Enrollment(
                student_id=user.id,
                course_id=course.id,
                group_id=group.id,
                progress=42,
                xp=420,
            )
        )


def seed_lessons_and_attendance(
    s: Session, user: User, teacher: Teacher, group: Group
) -> list[Lesson]:
    lessons: list[Lesson] = []
    past_topics = [
        ("Greetings & introductions", "Базовые приветствия и знакомство"),
        ("Present Simple drills", "Утвердительные, отрицательные, вопросы"),
        ("Daily routines", "Лексика повседневных действий + writing"),
        ("Family & relations", "Описание семьи, словарь родственников"),
        ("Past Simple basics", "Правильные глаголы, окончание -ed"),
        ("Past Simple irregular", "Топ-30 неправильных глаголов"),
        ("Travel vocabulary", "Аэропорт, отель, бронь — диалоги"),
        ("Mock test #1", "Промежуточный тест на 60 минут"),
    ]
    upcoming_topics = [
        ("Future forms: will vs going to", "Сравнение двух будущих"),
        ("Conditionals Type 1", "Реальные условия в настоящем"),
        ("Modal verbs: must/should/can", "Обязанность, совет, способность"),
        ("Speaking club: hobbies", "Свободная разговорная практика"),
    ]

    # past lessons (раз в неделю в течение последних 8 недель)
    for i, (topic, descr) in enumerate(past_topics):
        d = TODAY - timedelta(weeks=8 - i)
        existing = s.scalar(
            select(Lesson).where(
                Lesson.group_id == group.id,
                Lesson.lesson_date == d,
                Lesson.topic == topic,
            )
        )
        if existing:
            lessons.append(existing)
            continue
        lesson = Lesson(
            group_id=group.id,
            teacher_id=teacher.id,
            lesson_date=d,
            topic=topic,
            description=descr,
            scheduled_at=datetime.combine(d, datetime.min.time(), tzinfo=timezone.utc).replace(hour=15),
            lesson_time="18:30",
            zoom_link="https://zoom.us/j/test-classroom-001",
            homework="Повторить материал урока, выполнить упражнения из учебника.",
            is_completed=True,
        )
        s.add(lesson)
        s.flush()
        lessons.append(lesson)

    # upcoming lessons
    for i, (topic, descr) in enumerate(upcoming_topics):
        d = TODAY + timedelta(weeks=i + 1)
        existing = s.scalar(
            select(Lesson).where(
                Lesson.group_id == group.id,
                Lesson.lesson_date == d,
                Lesson.topic == topic,
            )
        )
        if existing:
            lessons.append(existing)
            continue
        lesson = Lesson(
            group_id=group.id,
            teacher_id=teacher.id,
            lesson_date=d,
            topic=topic,
            description=descr,
            scheduled_at=datetime.combine(d, datetime.min.time(), tzinfo=timezone.utc).replace(hour=15),
            lesson_time="18:30",
            zoom_link="https://zoom.us/j/test-classroom-001",
            homework="Подготовиться к занятию: словарь + аудио на платформе.",
            is_completed=False,
        )
        s.add(lesson)
        s.flush()
        lessons.append(lesson)

    # attendance only for past
    statuses = ["present", "present", "present", "late", "present", "absent", "present", "present"]
    past = [l for l in lessons if l.is_completed]
    for lesson, status in zip(past, statuses):
        existing = s.scalar(
            select(Attendance).where(
                Attendance.lesson_id == lesson.id,
                Attendance.student_id == user.id,
            )
        )
        if existing:
            continue
        s.add(
            Attendance(
                lesson_id=lesson.id,
                student_id=user.id,
                status=status,
                attended=status != "absent",
                notes=None if status == "present" else f"Статус: {status}",
            )
        )

    return lessons


def seed_homeworks(s: Session, user: User, course: Course, group: Group, lessons: list[Lesson]) -> None:
    past_lessons = [l for l in lessons if l.is_completed]
    if not past_lessons:
        return

    hw1 = s.scalar(
        select(Homework).where(
            Homework.course_id == course.id,
            Homework.title == "Past Simple — 30 sentences",
        )
    )
    if not hw1:
        hw1 = Homework(
            course_id=course.id,
            group_id=group.id,
            title="Past Simple — 30 sentences",
            description="Напишите 30 предложений в Past Simple (10 утвердительных, "
            "10 отрицательных, 10 вопросительных). Используйте правильные и "
            "неправильные глаголы.",
            due_date=NOW - timedelta(days=10),
        )
        s.add(hw1)
        s.flush()

    hw2 = s.scalar(
        select(Homework).where(
            Homework.course_id == course.id,
            Homework.title == "Travel dialogue",
        )
    )
    if not hw2:
        hw2 = Homework(
            course_id=course.id,
            group_id=group.id,
            title="Travel dialogue",
            description="Составьте диалог на 12-15 реплик: бронирование отеля и "
            "регистрация в аэропорту. Минимум 20 новых слов из урока.",
            due_date=NOW + timedelta(days=4),
        )
        s.add(hw2)
        s.flush()

    sub1 = s.scalar(
        select(HomeworkSubmission).where(
            HomeworkSubmission.homework_id == hw1.id,
            HomeworkSubmission.student_id == user.id,
        )
    )
    if not sub1:
        s.add(
            HomeworkSubmission(
                homework_id=hw1.id,
                lesson_id=past_lessons[4].id if len(past_lessons) > 4 else past_lessons[-1].id,
                student_id=user.id,
                text="Здесь 30 предложений в Past Simple… (тестовая сдача)",
                content="Здесь 30 предложений в Past Simple… (тестовая сдача)",
                status="graded",
                grade="5",
                teacher_comment="Отличная работа! Обрати внимание на 3-е лицо в вопросах.",
                feedback="Хорошо разобрался с неправильными глаголами.",
                submitted_at=NOW - timedelta(days=12),
                graded_at=NOW - timedelta(days=9),
            )
        )

    sub2 = s.scalar(
        select(HomeworkSubmission).where(
            HomeworkSubmission.homework_id == hw2.id,
            HomeworkSubmission.student_id == user.id,
        )
    )
    if not sub2:
        s.add(
            HomeworkSubmission(
                homework_id=hw2.id,
                lesson_id=past_lessons[-1].id,
                student_id=user.id,
                text="Черновик диалога: At the hotel — Hi, I have a reservation…",
                content="Черновик диалога: At the hotel — Hi, I have a reservation…",
                status="submitted",
                submitted_at=NOW - timedelta(days=1),
            )
        )


def seed_payments(s: Session, user: User, course: Course) -> None:
    plan = [
        ("paid", -90, 1, 550000, "completed", "card", "Оплата за месяц 1"),
        ("paid", -60, 2, 550000, "completed", "card", "Оплата за месяц 2"),
        ("paid", -30, 3, 550000, "completed", "yookassa", "Оплата за месяц 3"),
        ("pending", 0, 4, 550000, "pending", "yookassa", "Ожидает оплаты за месяц 4"),
    ]
    for label, day_offset, idx, amount, status, method, purpose in plan:
        period_month = ((TODAY.month - 1 + day_offset // 30) % 12) + 1
        period_year = TODAY.year if (TODAY.month + day_offset // 30) > 0 else TODAY.year - 1
        existing = s.scalar(
            select(Payment).where(
                Payment.user_id == user.id,
                Payment.purpose == purpose,
            )
        )
        if existing:
            continue
        s.add(
            Payment(
                user_id=user.id,
                student_id=user.id,
                course_id=course.id,
                amount=amount,
                currency="UZS",
                payment_type="monthly_fee",
                purpose=purpose,
                description=purpose,
                method=method,
                status=status,
                payment_date=NOW + timedelta(days=day_offset),
                period_month=period_month,
                period_year=period_year,
                created_at=NOW + timedelta(days=day_offset),
            )
        )


def seed_notifications(s: Session, user: User) -> None:
    items = [
        ("Добро пожаловать!", "Ваш кабинет готов. Заглядывайте на занятия и в раздел Домашка.", "info", -14),
        ("Оценка по домашке", "Преподаватель проверил «Past Simple — 30 sentences». Оценка: 5.", "success", -9),
        ("Скоро занятие", "Завтра в 18:30 у вас занятие: Future forms — will vs going to.", "reminder", -1),
    ]
    for title, message, ntype, day_offset in items:
        existing = s.scalar(
            select(Notification).where(
                Notification.user_id == user.id,
                Notification.title == title,
            )
        )
        if existing:
            continue
        s.add(
            Notification(
                user_id=user.id,
                title=title,
                message=message,
                notification_type=ntype,
                is_read=day_offset < -7,
                created_at=NOW + timedelta(days=day_offset),
            )
        )


def seed_vocabulary(s: Session, user: User, course: Course) -> None:
    words = [
        ("reservation", "бронь, бронирование", 80),
        ("schedule", "расписание", 60),
        ("departure", "отправление, вылет", 45),
        ("luggage", "багаж", 90),
        ("delay", "задержка", 30),
        ("appointment", "встреча, приём", 70),
        ("borrow", "одолжить (у кого-то)", 25),
    ]
    for w, tr, progress in words:
        existing = s.scalar(
            select(VocabularyWord).where(
                VocabularyWord.student_id == user.id,
                VocabularyWord.word == w,
            )
        )
        if existing:
            continue
        s.add(
            VocabularyWord(
                student_id=user.id,
                course_id=course.id,
                word=w,
                translation=tr,
                progress=progress,
                times_reviewed=max(1, progress // 20),
            )
        )


def seed_achievements(s: Session, user: User, student: Student) -> None:
    items = [
        ("first_lesson", "Первый шаг", "Посетил первое занятие", 50),
        ("streak_7", "Неделя в строю", "Серия активности 7 дней подряд", 150),
        ("homework_5", "Отличник недели", "Получил 5 за домашнее задание", 100),
    ]
    for code, title, descr, xp in items:
        existing = s.scalar(
            select(UserAchievement).where(
                UserAchievement.student_id == user.id,
                UserAchievement.achievement_type == code,
            )
        )
        if existing:
            continue
        s.add(
            UserAchievement(
                student_id=user.id,
                achievement_type=code,
                title=title,
                description=descr,
                xp_reward=xp,
                earned_at=NOW - timedelta(days=20 - items.index((code, title, descr, xp)) * 7),
            )
        )

    # каталог достижений (для бота) — на случай, если используется бот-кабинет
    catalog = [
        ("Первый шаг", "Посетил первое занятие", "🌱", 50),
        ("Неделя в строю", "Серия активности 7 дней подряд", "🔥", 150),
        ("Отличник недели", "Получил 5 за домашнее задание", "🏅", 100),
    ]
    for name, descr, icon, xp in catalog:
        ach = s.scalar(select(Achievement).where(Achievement.name == name))
        if not ach:
            ach = Achievement(name=name, description=descr, icon=icon, xp_reward=xp)
            s.add(ach)
            s.flush()
        link = s.scalar(
            select(StudentAchievement).where(
                StudentAchievement.student_id == student.id,
                StudentAchievement.achievement_id == ach.id,
            )
        )
        if not link:
            s.add(StudentAchievement(student_id=student.id, achievement_id=ach.id))


def main() -> None:
    engine = create_engine(DB_URL, client_encoding="utf8")
    with Session(engine) as s:
        user, student = get_or_create_student(s)
        course, teacher, group = pick_course_teacher_group(s)
        link_student_to_group(s, student, group)
        ensure_enrollment(s, user, course, group)
        lessons = seed_lessons_and_attendance(s, user, teacher, group)
        seed_homeworks(s, user, course, group, lessons)
        seed_payments(s, user, course)
        seed_notifications(s, user)
        seed_vocabulary(s, user, course)
        seed_achievements(s, user, student)
        s.commit()

        # отчёт
        from sqlalchemy import func

        totals = {
            "user": user.email,
            "student_id": student.id,
            "group": group.name,
            "course": course.name,
            "teacher_id": teacher.id,
            "lessons_in_group": s.scalar(select(func.count()).select_from(Lesson).where(Lesson.group_id == group.id)),
            "attendance_records": s.scalar(select(func.count()).select_from(Attendance).where(Attendance.student_id == user.id)),
            "payments": s.scalar(select(func.count()).select_from(Payment).where(Payment.user_id == user.id)),
            "notifications": s.scalar(select(func.count()).select_from(Notification).where(Notification.user_id == user.id)),
            "vocabulary": s.scalar(select(func.count()).select_from(VocabularyWord).where(VocabularyWord.student_id == user.id)),
            "achievements": s.scalar(select(func.count()).select_from(UserAchievement).where(UserAchievement.student_id == user.id)),
        }
        print("=" * 60)
        print(" SEED DONE — student@test.com")
        print("=" * 60)
        for k, v in totals.items():
            print(f"  {k:>22} : {v}")


if __name__ == "__main__":
    main()
