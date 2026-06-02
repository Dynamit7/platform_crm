from sqlalchemy import Column, Integer, BigInteger, String, Text, ForeignKey, DateTime, Float, Boolean, JSON, Date, Numeric, UniqueConstraint
from sqlalchemy.orm import declarative_base, relationship, synonym
from sqlalchemy.sql import func


class UserRole:
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"
    PENDING = "pending"

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, index=True, nullable=True)
    name = Column(String(255))
    full_name = synonym("name")
    username = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    phone = Column(String(50), nullable=True, index=True)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(20), default="student", index=True)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String, nullable=True)
    registration_source = Column(String, default="web")
    google_id = Column(String, nullable=True, unique=True)
    referral_code = Column(String(20), nullable=True, unique=True)
    date_of_birth = Column(Date, nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    admin = relationship("Admin", back_populates="user", uselist=False)
    teacher = relationship("Teacher", back_populates="user", uselist=False)
    student_profile = relationship("Student", back_populates="user", uselist=False)
    registrations = relationship("Registration", back_populates="user")
    feedback = relationship("Feedback", back_populates="user")
    payments = relationship("Payment", back_populates="user", foreign_keys="Payment.user_id")
    reminders = relationship("Reminder", back_populates="user")
    enrollments = relationship("Enrollment", back_populates="student")
    submissions = relationship("HomeworkSubmission", back_populates="student")
    notifications = relationship("Notification", back_populates="user")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")
    vocabulary = relationship("VocabularyWord", back_populates="student")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    user_achievements = relationship("UserAchievement", back_populates="student")
    login_attempts = relationship("LoginAttempt", back_populates="user")


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    permissions = Column(Text, default="all")

    user = relationship("User", back_populates="admin")


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=True)
    name = Column(String, index=True, nullable=True)
    specialization = Column(String(255), nullable=True)
    subjects = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    photo_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    user = relationship("User", back_populates="teacher")
    groups = relationship("Group", back_populates="teacher")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    student_code = Column(String(50), unique=True, nullable=True)
    enrollment_date = Column(Date, server_default=func.current_date())
    frozen_until = Column(Date, nullable=True)
    freeze_reason = Column(String(255), nullable=True)
    last_debt_reminder = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak_days = Column(Integer, default=0)
    last_activity_date = Column(Date, nullable=True)

    user = relationship("User", back_populates="student_profile")
    student_groups = relationship("StudentGroup", back_populates="student")

    progress = relationship("StudentProgress", back_populates="student")
    achievement_links = relationship("StudentAchievement", back_populates="student")


class TrainingType(Base):
    __tablename__ = "training_types"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    registrations = relationship("Registration", back_populates="training_type")


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), unique=True, nullable=False)
    time_start = Column(String(50), nullable=False)
    time_end = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)

    groups = relationship("Group", back_populates="schedule")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True)
    title = synonym("name")
    description = Column(Text, nullable=True)
    duration_months = Column(Integer, nullable=True)
    duration = Column(String, nullable=True)
    lessons_count = Column(Integer, nullable=True)
    price_group = Column(Integer, nullable=True)
    price_individual = Column(Integer, nullable=True)
    price = Column(Numeric(10, 2), nullable=True)
    image_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    groups = relationship("Group", back_populates="course")
    registrations = relationship("Registration", back_populates="course")
    feedback = relationship("Feedback", back_populates="course")
    leads = relationship("Lead", back_populates="course")


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id", ondelete="SET NULL"), nullable=True, index=True)
    schedule_json = Column(JSON, nullable=True)
    days_bitmask = Column(Integer, default=0)
    max_students = Column(Integer, default=10)
    current_students = Column(Integer, default=0)
    start_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course", back_populates="groups")
    teacher = relationship("Teacher", back_populates="groups")
    schedule = relationship("Schedule", back_populates="groups")
    student_groups = relationship("StudentGroup", back_populates="group")
    lessons = relationship("Lesson", back_populates="group")
    enrollments = relationship("Enrollment", back_populates="group")


class StudentGroup(Base):
    __tablename__ = "student_groups"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="active", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("student_id", "group_id"),)

    student = relationship("Student", back_populates="student_groups")
    group = relationship("Group", back_populates="student_groups")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True, index=True)
    progress = Column(Integer, default=0)
    xp = Column(Integer, default=0)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="enrollments")
    course = relationship("Course")
    group = relationship("Group", back_populates="enrollments")


class Registration(Base):
    __tablename__ = "registrations"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, index=True)
    training_type_id = Column(Integer, ForeignKey("training_types.id", ondelete="SET NULL"), nullable=True, index=True)
    status_code = Column(String(50), default="pending", index=True)
    trial_lesson_time = Column(DateTime(timezone=True), nullable=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    course = relationship("Course", back_populates="registrations")
    training_type = relationship("TrainingType", back_populates="registrations")
    user = relationship("User", back_populates="registrations")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    lesson_date = Column(Date, nullable=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True, index=True)
    topic = Column(String(255), default="Занятие по расписанию")
    description = Column(Text, nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    lesson_time = Column(String(50), nullable=True)
    zoom_link = Column(String, nullable=True)
    homework = Column(String(1000), nullable=True)
    is_completed = Column(Boolean, default=False, index=True)
    is_recorded = Column(Boolean, default=False)
    recording_url = Column(String, nullable=True)

    group = relationship("Group", back_populates="lessons")
    teacher = relationship("Teacher")
    attendance = relationship("Attendance", back_populates="lesson")


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="present", index=True)
    attended = Column(Boolean, default=False)
    notes = Column(String(255), nullable=True)

    __table_args__ = (UniqueConstraint("lesson_id", "student_id", name="uq_attendance_lesson_student"),)

    lesson = relationship("Lesson", back_populates="attendance")
    student = relationship("User", backref="attendances_as_student")


LessonAttendance = Attendance


class StudentProgress(Base):
    __tablename__ = "student_progress"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True)
    grade = Column(Integer, nullable=True)
    comment = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="progress")


class Homework(Base):
    __tablename__ = "homeworks"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course")
    submissions = relationship("HomeworkSubmission", back_populates="homework")


class HomeworkSubmission(Base):
    __tablename__ = "homework_submissions"

    id = Column(Integer, primary_key=True, index=True)
    homework_id = Column(Integer, ForeignKey("homeworks.id", ondelete="CASCADE"), nullable=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_id = Column(String(255), nullable=True)
    file_type = Column(String(50), nullable=True)
    content = Column(Text, nullable=True)
    text = Column(String(2000), nullable=True)
    status = Column(String(50), default="submitted", index=True)
    grade = Column(String, nullable=True)
    teacher_comment = Column(String(500), nullable=True)
    feedback = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    graded_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    homework = relationship("Homework", back_populates="submissions")
    student = relationship("User", back_populates="submissions")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="UZS")
    payment_type = Column(String(50), default="monthly_fee", index=True)
    registration_id = Column(Integer, ForeignKey("registrations.id", ondelete="SET NULL"), nullable=True, index=True)
    purpose = Column(String(255), nullable=True)
    method = Column(String(50), nullable=True)
    status = Column(String(50), default="pending", index=True)
    yookassa_id = Column(String(100), unique=True, nullable=True)
    admin_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    period_month = Column(Integer, nullable=True)
    period_year = Column(Integer, nullable=True)
    bot_payment_id = Column(Integer, nullable=True)
    description = Column(String(500), nullable=True)
    confirmation_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", foreign_keys=[user_id], back_populates="payments")
    course = relationship("Course")
    student = relationship("User", foreign_keys=[student_id])


Finance = Payment


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, index=True)
    comment = Column(String(1000), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    user = relationship("User", back_populates="feedback")
    course = relationship("Course", back_populates="feedback")


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True)
    uploader_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False, index=True)
    file_id = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    title = Column(String(255), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id", ondelete="CASCADE"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    group = relationship("Group")
    lesson = relationship("Lesson")

class StudentStatusModel(Base):
    __tablename__ = "student_statuses"

    id = Column(Integer, primary_key=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    icon = Column(String(10), default="🏆")
    xp_reward = Column(Integer, default=100)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student_links = relationship("StudentAchievement", back_populates="achievement")


class StudentAchievement(Base):
    """Bot's achievement-to-student link (achievement catalog instances)."""
    __tablename__ = "student_achievements"

    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    achievement_id = Column(Integer, ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False, index=True)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("Student", back_populates="achievement_links")
    achievement = relationship("Achievement", back_populates="student_links")


class UserAchievement(Base):
    """Web's per-user achievement record (flat, no catalog)."""
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    achievement_type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    xp_reward = Column(Integer, default=0)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", foreign_keys=[student_id], back_populates="user_achievements")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    student_name = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    rating = Column(Integer, nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    group_name = Column(String, nullable=True)
    media_urls = Column(Text, nullable=True)
    status = Column(String, default="moderation")
    admin_reply = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    course = relationship("Course")
    student = relationship("User", foreign_keys=[student_id])
    teacher = relationship("User", foreign_keys=[teacher_id])


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(50), default="new", index=True)
    notes = Column(Text, nullable=True)
    source = Column(String(50), default="manual", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    course = relationship("Course", back_populates="leads")


class LeadHistory(Base):
    __tablename__ = "lead_history"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("Lead")
    changer = relationship("User", foreign_keys=[changed_by])


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=True)
    file_url = Column(String(500), nullable=True)
    file_type = Column(String(50), nullable=True)
    file_name = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")


class VocabularyWord(Base):
    __tablename__ = "vocabulary_words"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, index=True)
    word = Column(String, nullable=False)
    translation = Column(String, nullable=False)
    progress = Column(Integer, default=0)
    times_reviewed = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="vocabulary")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="info")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")


class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    discount_percent = Column(Integer, default=0)
    discount_amount = Column(Integer, nullable=True)
    max_uses = Column(Integer, default=1)
    used_count = Column(Integer, default=0)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Referral(Base):
    __tablename__ = "referrals"

    id = Column(Integer, primary_key=True, index=True)
    referrer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    referred_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    reward_status = Column(String(20), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    referrer = relationship("User", foreign_keys=[referrer_id])
    referred = relationship("User", foreign_keys=[referred_id])

class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    text = Column(String(500), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    sent = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="reminders")


class LessonTemplate(Base):
    __tablename__ = "lesson_templates"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    topic = Column(String(500), nullable=False)
    objectives = Column(Text, nullable=True)
    materials = Column(Text, nullable=True)
    homework_template = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class GlobalSetting(Base):
    __tablename__ = "settings"

    key = Column(String(50), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)


class BroadcastCampaign(Base):
    __tablename__ = "broadcast_campaigns"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    channel = Column(String(20), default="telegram")
    message = Column(Text, nullable=False)
    audience_config = Column(JSON, default=dict)
    status = Column(String(20), default="draft")
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    stats = Column(JSON, default=dict)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class LoginAttempt(Base):
    __tablename__ = "login_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    email = Column(String, nullable=False, index=True)
    success = Column(Boolean, default=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="login_attempts")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    refresh_token = Column(String(500), unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="sessions")
