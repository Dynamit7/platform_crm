"""
Seed script — creates admin user, sample teachers, courses, groups, leads.
Run once: python seed_crm.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine
import models
from auth import get_password_hash

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

def seed():
    print("🌱 Seeding CRM database...")

    # ── Admin user ──
    admin = db.query(models.User).filter(models.User.email == "admin@tiluser.uz").first()
    if not admin:
        admin = models.User(
            name="Администратор",
            email="admin@tiluser.uz",
            phone="+998901234567",
            password_hash=get_password_hash("REDACTED_PASSWORD"),
            role="admin",
            is_active=True
        )
        db.add(admin)
        db.commit()
        print("  ✅ Admin created: admin@tiluser.uz / REDACTED_PASSWORD")
    else:
        print("  ℹ️  Admin already exists")

    # ── Teacher users ──
    teacher_data = [
        {"name": "Анна В.", "email": "anna@tiluser.uz", "password": "teacher123"},
        {"name": "Елена С.", "email": "elena@tiluser.uz", "password": "teacher123"},
        {"name": "Марк Т.", "email": "mark@tiluser.uz", "password": "teacher123"},
    ]
    for td in teacher_data:
        existing = db.query(models.User).filter(models.User.email == td["email"]).first()
        if not existing:
            t_user = models.User(
                name=td["name"], email=td["email"],
                password_hash=get_password_hash(td["password"]),
                role="teacher", is_active=True
            )
            db.add(t_user)
    db.commit()

    # ── Teacher profiles ──
    if not db.query(models.Teacher).first():
        teachers = [
            models.Teacher(name="Анна В.", bio="Сертификат JLPT N1. Учит не просто языку, а погружает в культуру.", subjects="Японский язык"),
            models.Teacher(name="Елена С.", bio="Прожила в Лондоне 5 лет. Уровень C2. Средний балл учеников — 7.5", subjects="Английский (IELTS)"),
            models.Teacher(name="Марк Т.", bio="Окончил Сеульский Нац. Университет. Готовит к грантам в Корее.", subjects="Корейский (TOPIK)"),
        ]
        for t in teachers:
            db.add(t)
        db.commit()
        print("  ✅ Teachers created")

    # ── Student user ──
    student = db.query(models.User).filter(models.User.email == "samat@tiluser.uz").first()
    if not student:
        student = models.User(
            name="Самат",
            email="samat@tiluser.uz",
            phone="+998701234567",
            password_hash=get_password_hash("student123"),
            role="student",
            is_active=True
        )
        db.add(student)
        db.commit()
        print("  ✅ Student created: samat@tiluser.uz / student123")

    # ── Courses ──
    if not db.query(models.Course).first():
        courses = [
            models.Course(title="Японский язык N4", description="Подготовка к JLPT N4. Грамматика, кандзи, разговорная практика.", duration="4 месяца", price=400000),
            models.Course(title="Английский (IELTS)", description="Интенсивная подготовка к IELTS. Mock exams, speaking, writing.", duration="3 месяца", price=800000),
            models.Course(title="Корейский язык", description="Подготовка к TOPIK. K-pop культура, поступление в Корее.", duration="4 месяца", price=400000),
            models.Course(title="Русский язык", description="Для жизни, работы и учебы. Свободное общение без барьеров.", duration="3 месяца", price=300000),
        ]
        for c in courses:
            db.add(c)
        db.commit()
        print("  ✅ Courses created")

    # ── Groups ──
    if not db.query(models.Group).first():
        teacher1 = db.query(models.Teacher).first()
        course1 = db.query(models.Course).first()
        if teacher1 and course1:
            group = models.Group(name="Японский N4 — Группа А", course_id=course1.id, teacher_id=teacher1.id, max_students=8)
            db.add(group)
            db.commit()
            print("  ✅ Group created")

    # ── Enrollments ──
    student = db.query(models.User).filter(models.User.email == "samat@tiluser.uz").first()
    course1 = db.query(models.Course).first()
    course2 = db.query(models.Course).filter(models.Course.title.contains("IELTS")).first()
    if student and course1:
        existing = db.query(models.Enrollment).filter(models.Enrollment.student_id == student.id).first()
        if not existing:
            db.add(models.Enrollment(student_id=student.id, course_id=course1.id, progress=60, xp=750))
            if course2:
                db.add(models.Enrollment(student_id=student.id, course_id=course2.id, progress=40, xp=500))
            db.commit()
            print("  ✅ Enrollments created")

    # ── Sample Leads ──
    if not db.query(models.Lead).first():
        course1 = db.query(models.Course).first()
        leads_data = [
            {"name": "Аида К.", "phone": "+77051234567", "status": "new", "course_id": course1.id if course1 else None},
            {"name": "Тимур Р.", "phone": "+77771234567", "status": "contacted", "course_id": course1.id if course1 else None},
            {"name": "Жанна М.", "phone": "+77021234567", "status": "enrolled"},
            {"name": "Олег Н.", "phone": "+77007654321", "status": "new"},
            {"name": "Диана П.", "phone": "+77771239876", "status": "contacted"},
        ]
        for ld in leads_data:
            db.add(models.Lead(**ld))
        db.commit()
        print("  ✅ Sample leads created")

    # ── Vocabulary for student ──
    student = db.query(models.User).filter(models.User.email == "samat@tiluser.uz").first()
    if student and not db.query(models.VocabularyWord).filter(models.VocabularyWord.student_id == student.id).first():
        words = [
            models.VocabularyWord(student_id=student.id, word="先生", translation="Учитель", progress=100),
            models.VocabularyWord(student_id=student.id, word="学生", translation="Студент", progress=70),
            models.VocabularyWord(student_id=student.id, word="学校", translation="Школа", progress=0),
        ]
        for w in words:
            db.add(w)
        db.commit()
        print("  ✅ Vocabulary words created")

    # ── Sample payment ──
    if student and not db.query(models.Payment).filter(models.Payment.student_id == student.id).first():
        course1 = db.query(models.Course).first()
        db.add(models.Payment(
            student_id=student.id,
            course_id=course1.id if course1 else None,
            amount=400000, currency="UZS", method="cash",
            description="Оплата за октябрь 2025", status="paid"
        ))
        db.commit()
        print("  ✅ Sample payment created")

    db.close()
    print("\n✅ Done! CRM database seeded successfully.")
    print("\n📋 Credentials:")
    print("  Admin:   admin@tiluser.uz / REDACTED_PASSWORD")
    print("  Teacher: anna@tiluser.uz / teacher123")
    print("  Student: samat@tiluser.uz / student123")

if __name__ == "__main__":
    seed()
