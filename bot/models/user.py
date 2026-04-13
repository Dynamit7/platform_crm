from datetime import datetime, date as date_type
from enum import Enum
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, BigInteger, Boolean, ForeignKey, Date, func, Text, Enum as SQLAlchemyEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from bot.models.base import Base

from bot.models.finance import Finance

if TYPE_CHECKING:
    from bot.models.education import Group, StudentGroup, Attendance, StudentProgress, Feedback
    from bot.models.features import StudentAchievement, Reminder

class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"
    PENDING = "pending"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True, default=None)
    username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default=None)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default=None)
    role: Mapped[UserRole] = mapped_column(SQLAlchemyEnum(UserRole, values_callable=lambda obj: [e.value for e in obj]), default=UserRole.PENDING, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), init=False)
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), init=False)

    # RELATIONSHIPS
    admin: Mapped[Optional["Admin"]] = relationship(back_populates="user", init=False)
    teacher: Mapped[Optional["Teacher"]] = relationship(back_populates="user", init=False)
    student: Mapped[Optional["Student"]] = relationship(back_populates="user", init=False)
    
    # Ссылки на отзывы и оплаты (строковые)
    feedback: Mapped[List["Feedback"]] = relationship(back_populates="user", default_factory=list, init=False)
    payments: Mapped[List["Finance"]] = relationship(
        primaryjoin="User.id == Finance.user_id",
        foreign_keys="[Finance.user_id]",
        back_populates="user", 
        default_factory=list, 
        init=False
    )
    reminders: Mapped[List["Reminder"]] = relationship(back_populates="user", default_factory=list, init=False)
    registrations: Mapped[List["Registration"]] = relationship(back_populates="user", default_factory=list, init=False)

class Admin(Base):
    __tablename__ = "admins"

    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    permissions: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default="all") # JSON-строка или текст

    user: Mapped["User"] = relationship(back_populates="admin", init=False)

class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    specialization: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default=None)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped["User"] = relationship(back_populates="teacher", init=False)
    groups: Mapped[List["Group"]] = relationship(back_populates="teacher", default_factory=list, init=False)

class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    
    # Status fields
    student_code: Mapped[Optional[str]] = mapped_column(String(50), unique=True, nullable=True, default=None)
    enrollment_date: Mapped[date_type] = mapped_column(Date, server_default=func.current_date(), default_factory=date_type.today)
    
    # Freeze & Debt
    frozen_until: Mapped[Optional[date_type]] = mapped_column(Date, nullable=True, default=None)
    freeze_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default=None)
    last_debt_reminder: Mapped[Optional[date_type]] = mapped_column(Date, nullable=True, default=None)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # RELATIONSHIPS
    user: Mapped["User"] = relationship(back_populates="student", init=False)
    student_groups: Mapped[List["StudentGroup"]] = relationship(back_populates="student", default_factory=list, init=False)
    attendance: Mapped[List["Attendance"]] = relationship(back_populates="student", default_factory=list, init=False)
    progress: Mapped[List["StudentProgress"]] = relationship(back_populates="student", default_factory=list, init=False)
    achievement_links: Mapped[List["StudentAchievement"]] = relationship(back_populates="student", default_factory=list, init=False)
