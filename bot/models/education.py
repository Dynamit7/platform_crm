from datetime import datetime, date as date_type
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, DateTime, func, Integer, Boolean, Date, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from bot.models.base import Base

if TYPE_CHECKING:
    from bot.models.user import User, Teacher, Student

class TrainingType(Base):
    __tablename__ = "training_types"
    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    name: Mapped[str] = mapped_column(String(255), unique=True)
    description: Mapped[Optional[str]] = mapped_column(nullable=True, default=None)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), init=False)
    registrations: Mapped[List["Registration"]] = relationship(back_populates="training_type", default_factory=list)

class Schedule(Base):
    __tablename__ = "schedules"
    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    name: Mapped[str] = mapped_column(String(255), unique=True)
    time_start: Mapped[str] = mapped_column(String(50))
    time_end: Mapped[str] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    groups: Mapped[List["Group"]] = relationship(back_populates="schedule", default_factory=list)

class Course(Base):
    __tablename__ = "courses"
    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    name: Mapped[str] = mapped_column(String(255), unique=True)
    description: Mapped[Optional[str]] = mapped_column(nullable=True, default=None)
    duration_months: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    lessons_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    price_group: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    price_individual: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    groups: Mapped[List["Group"]] = relationship(back_populates="course", default_factory=list)
    registrations: Mapped[List["Registration"]] = relationship(back_populates="course", default_factory=list)
    feedback: Mapped[List["Feedback"]] = relationship(back_populates="course", default_factory=list)

class Group(Base):
    __tablename__ = "groups"
    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    name: Mapped[str] = mapped_column(String(255), unique=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), index=True)
    teacher_id: Mapped[Optional[int]] = mapped_column(ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True, index=True, default=None)
    schedule_id: Mapped[Optional[int]] = mapped_column(ForeignKey("schedules.id", ondelete="SET NULL"), nullable=True, index=True, default=None)
    days_bitmask: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    max_students: Mapped[int] = mapped_column(Integer, default=10)
    current_students: Mapped[int] = mapped_column(Integer, default=0)
    start_date: Mapped[Optional[date_type]] = mapped_column(Date, nullable=True, default=None)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    
    course: Mapped["Course"] = relationship(back_populates="groups", init=False)
    teacher: Mapped[Optional["Teacher"]] = relationship(back_populates="groups", init=False)
    schedule: Mapped[Optional["Schedule"]] = relationship(back_populates="groups", init=False)
    student_groups: Mapped[List["StudentGroup"]] = relationship(back_populates="group", default_factory=list, init=False)
    lessons: Mapped[List["Lesson"]] = relationship(back_populates="group", default_factory=list)

class StudentGroup(Base):
    __tablename__ = "student_groups"
    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(50), default="active", index=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), init=False)
    __table_args__ = (UniqueConstraint("student_id", "group_id"),)
    student: Mapped["Student"] = relationship(back_populates="student_groups", init=False)
    group: Mapped["Group"] = relationship(back_populates="student_groups", init=False)

class Lesson(Base):
    __tablename__ = "lessons"
    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"), index=True)
    lesson_date: Mapped[date_type] = mapped_column(Date, index=True)
    
    teacher_id: Mapped[Optional[int]] = mapped_column(ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True, index=True, default=None)
    topic: Mapped[str] = mapped_column(String(255), default="Занятие по расписанию")
    lesson_time: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default=None)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    homework: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True, default=None)
    
    group: Mapped["Group"] = relationship(back_populates="lessons", init=False)
    attendance: Mapped[List["Attendance"]] = relationship(back_populates="lesson", default_factory=list)

class Registration(Base):
    __tablename__ = "registrations"
    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    course_id: Mapped[Optional[int]] = mapped_column(ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, index=True, default=None)
    
    training_type_id: Mapped[Optional[int]] = mapped_column(ForeignKey("training_types.id", ondelete="SET NULL"), nullable=True, index=True, default=None)
    status_code: Mapped[str] = mapped_column(String(50), default="pending", index=True)
    trial_lesson_time: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, default=None)
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), init=False, index=True)
    course: Mapped["Course"] = relationship(back_populates="registrations", init=False)
    training_type: Mapped[Optional["TrainingType"]] = relationship(back_populates="registrations", init=False)
    user: Mapped["User"] = relationship(back_populates="registrations", init=False)

class Attendance(Base):
    __tablename__ = "attendance"
    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(50), default="present", index=True)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default=None)
    __table_args__ = (UniqueConstraint("lesson_id", "student_id", name="uq_attendance_lesson_student"),)
    lesson: Mapped["Lesson"] = relationship(back_populates="attendance", init=False)
    student: Mapped["Student"] = relationship(back_populates="attendance", init=False)

class Feedback(Base):
    __tablename__ = "feedback"
    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    rating: Mapped[int] = mapped_column(Integer)
    
    student_id: Mapped[Optional[int]] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), nullable=True, index=True, default=None)
    lesson_id: Mapped[Optional[int]] = mapped_column(ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True, index=True, default=None)
    course_id: Mapped[Optional[int]] = mapped_column(ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, index=True, default=None)
    comment: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), init=False, index=True)
    user: Mapped["User"] = relationship(back_populates="feedback", init=False)
    course: Mapped[Optional["Course"]] = relationship(back_populates="feedback", init=False)

class Material(Base):
    __tablename__ = "materials"
    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    uploader_id: Mapped[int] = mapped_column(ForeignKey("teachers.id", ondelete="CASCADE"), index=True)
    file_id: Mapped[str] = mapped_column(String(255))
    file_type: Mapped[str] = mapped_column(String(50)) # photo, video, document
    title: Mapped[str] = mapped_column(String(255))
    
    group_id: Mapped[Optional[int]] = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"), nullable=True, index=True, default=None)
    lesson_id: Mapped[Optional[int]] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), nullable=True, index=True, default=None)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), init=False)
    
    teacher: Mapped["Teacher"] = relationship(init=False)

class StudentStatusModel(Base):
    """Справочник статусов студентов (active, frozen, expelled и т.д.)"""
    __tablename__ = "student_statuses"
    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    code: Mapped[str] = mapped_column(String(50), unique=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default=None)

class StudentProgress(Base):
    """Оценки и прогресс ученика по курсам."""
    __tablename__ = "student_progress"
    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True)
    course_id: Mapped[Optional[int]] = mapped_column(ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, index=True, default=None)
    lesson_id: Mapped[Optional[int]] = mapped_column(ForeignKey("lessons.id", ondelete="SET NULL"), nullable=True, index=True, default=None)
    grade: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    comment: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), init=False)
    student: Mapped["Student"] = relationship(back_populates="progress", init=False)
    course: Mapped[Optional["Course"]] = relationship(init=False)

class HomeworkSubmission(Base):
    """Сдача домашних заданий учениками."""
    __tablename__ = "homework_submissions"
    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"), index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    file_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default=None)
    file_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default=None)
    text: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True, default=None)
    status: Mapped[str] = mapped_column(String(50), default="pending", index=True)  # pending, accepted, rejected
    grade: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    teacher_comment: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), init=False)
    student: Mapped["Student"] = relationship(init=False)
    lesson: Mapped["Lesson"] = relationship(init=False)

class LessonTemplate(Base):
    __tablename__ = "lesson_templates"
    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(200))
    topic: Mapped[str] = mapped_column(String(500))
    course_id: Mapped[Optional[int]] = mapped_column(ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, default=None)
    objectives: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True, default=None)
    materials: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True, default=None)
    homework_template: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True, default=None)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), init=False)

class PromoCode(Base):
    __tablename__ = "promo_codes"
    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    discount_percent: Mapped[int] = mapped_column(Integer, default=0)
    max_uses: Mapped[int] = mapped_column(Integer, default=1)
    used_count: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    discount_amount: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=None)
    course_id: Mapped[Optional[int]] = mapped_column(ForeignKey("courses.id", ondelete="SET NULL"), nullable=True, default=None)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, default=None)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), init=False)
