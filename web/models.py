from sqlalchemy import Column, Integer, BigInteger, String, Text, ForeignKey, DateTime, Float, Boolean, JSON, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    duration = Column(String)
    price = Column(Float)
    image_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    leads = relationship("Lead", back_populates="course")
    groups = relationship("Group", back_populates="course")


class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    bio = Column(Text)
    photo_url = Column(String, nullable=True)
    subjects = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    groups = relationship("Group", back_populates="teacher")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    student_name = Column(String)
    text = Column(Text)
    rating = Column(Integer)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    group_name = Column(String, nullable=True)
    media_urls = Column(Text, nullable=True)  # JSON array of URLs
    status = Column(String, default="moderation")  # moderation, published, rejected
    admin_reply = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    student = relationship("User", foreign_keys=[student_id], lazy="joined")
    course = relationship("Course", foreign_keys=[course_id], lazy="joined")
    teacher = relationship("User", foreign_keys=[teacher_id], lazy="joined")


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    phone = Column(String)
    email = Column(String, nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    status = Column(String, default="new")  # new, contacted, enrolled, lost
    notes = Column(Text, nullable=True)
    source = Column(String, default="manual")  # manual, web, telegram
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    course = relationship("Course", back_populates="leads")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, index=True, nullable=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    phone = Column(String, nullable=True)
    password_hash = Column(String, nullable=True)
    role = Column(String, default="student")  # student, teacher, admin
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

    login_attempts = relationship("LoginAttempt", back_populates="user")
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")

    enrollments = relationship("Enrollment", back_populates="student")
    submissions = relationship("HomeworkSubmission", back_populates="student")
    notifications = relationship("Notification", back_populates="user")
    payments = relationship("Payment", back_populates="student")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="Message.receiver_id", back_populates="receiver")
    vocabulary = relationship("VocabularyWord", back_populates="student")
    achievements = relationship("Achievement", back_populates="student")

    student_profile = relationship("Student", back_populates="user", uselist=False)


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True)
    student_code = Column(String(50), unique=True, nullable=True)
    enrollment_date = Column(Date)
    frozen_until = Column(Date, nullable=True)
    freeze_reason = Column(String(255), nullable=True)
    last_debt_reminder = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak_days = Column(Integer, default=0)
    last_activity_date = Column(Date, nullable=True)

    user = relationship("User", back_populates="student_profile")


class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    max_students = Column(Integer, default=8)
    schedule_json = Column(JSON, nullable=True)  # [{"day": "Mon", "time": "18:00"}, ...]
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course", back_populates="groups")
    teacher = relationship("Teacher", back_populates="groups")
    lessons = relationship("Lesson", back_populates="group")
    enrollments = relationship("Enrollment", back_populates="group")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    progress = Column(Integer, default=0)
    xp = Column(Integer, default=0)
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="enrollments")
    course = relationship("Course")
    group = relationship("Group", back_populates="enrollments")


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"))
    topic = Column(String)
    description = Column(Text, nullable=True)
    scheduled_at = Column(DateTime(timezone=True))
    zoom_link = Column(String, nullable=True)
    homework = Column(String, nullable=True)
    lesson_date = Column(Date, nullable=True)
    lesson_time = Column(String, nullable=True)
    is_recorded = Column(Boolean, default=False)
    recording_url = Column(String, nullable=True)
    is_completed = Column(Boolean, default=False)

    group = relationship("Group", back_populates="lessons")
    attendance = relationship("LessonAttendance", back_populates="lesson")


class LessonAttendance(Base):
    __tablename__ = "lesson_attendance"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    attended = Column(Boolean, default=False)

    lesson = relationship("Lesson", back_populates="attendance")


class Homework(Base):
    __tablename__ = "homeworks"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)
    title = Column(String)
    description = Column(Text)
    due_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    course = relationship("Course")
    submissions = relationship("HomeworkSubmission", back_populates="homework")


class HomeworkSubmission(Base):
    __tablename__ = "homework_submissions"

    id = Column(Integer, primary_key=True, index=True)
    homework_id = Column(Integer, ForeignKey("homeworks.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    grade = Column(String, nullable=True)
    feedback = Column(Text, nullable=True)
    status = Column(String, default="submitted")  # submitted, graded, returned
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    graded_at = Column(DateTime(timezone=True), nullable=True)

    homework = relationship("Homework", back_populates="submissions")
    student = relationship("User", back_populates="submissions")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    amount = Column(Float)
    currency = Column(String, default="UZS")
    method = Column(String, default="cash")  # cash, card, online, transfer
    status = Column(String, default="paid")  # paid, pending, failed, refunded
    description = Column(String, nullable=True)
    period_month = Column(Integer, nullable=True)
    period_year = Column(Integer, nullable=True)
    bot_payment_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="payments")
    course = relationship("Course")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    receiver_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=True)
    file_url = Column(String, nullable=True)
    file_type = Column(String, nullable=True)  # 'image', 'document', etc.
    file_name = Column(String, nullable=True)  # original filename
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")


class VocabularyWord(Base):
    __tablename__ = "vocabulary_words"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    word = Column(String)
    translation = Column(String)
    progress = Column(Integer, default=0)  # 0-100
    times_reviewed = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="vocabulary")


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"))
    achievement_type = Column(String)  # first_hw, streak_5, club_10, etc.
    title = Column(String)
    description = Column(Text, nullable=True)
    xp_reward = Column(Integer, default=0)
    earned_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="achievements")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    message = Column(Text)
    notification_type = Column(String, default="info")  # info, warning, success, error
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="notifications")


class LessonTemplate(Base):
    __tablename__ = "lesson_templates"
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    title = Column(String(200))
    topic = Column(String(500))
    objectives = Column(Text, nullable=True)
    materials = Column(Text, nullable=True)
    homework_template = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class PromoCode(Base):
    __tablename__ = "promo_codes"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True)
    discount_percent = Column(Integer, default=0)
    discount_amount = Column(Integer, nullable=True)
    max_uses = Column(Integer, default=1)
    used_count = Column(Integer, default=0)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Referral(Base):
    __tablename__ = "referrals"
    id = Column(Integer, primary_key=True, index=True)
    referrer_id = Column(Integer, ForeignKey("users.id"), index=True)
    referred_id = Column(Integer, ForeignKey("users.id"), unique=True)
    reward_status = Column(String(20), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LeadHistory(Base):
    __tablename__ = "lead_history"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), index=True)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50))
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class BroadcastCampaign(Base):
    __tablename__ = "broadcast_campaigns"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    channel = Column(String(20), default="telegram")  # telegram, email, sms
    message = Column(Text)
    audience_config = Column(JSON, default=dict)  # {type: "all"|"role"|"group"|"course", value: ...}
    status = Column(String(20), default="draft")  # draft, scheduled, sent, cancelled
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    stats = Column(JSON, default=dict)  # {total: 0, sent: 0, failed: 0, opened: 0, clicked: 0}
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class LoginAttempt(Base):
    __tablename__ = "login_attempts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    email = Column(String, index=True)
    success = Column(Boolean, default=False)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="login_attempts")


class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    refresh_token = Column(String, unique=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="sessions")
