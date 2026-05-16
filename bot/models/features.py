from datetime import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, DateTime, func, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from bot.models.base import Base

class Referral(Base):
    __tablename__ = "referrals"
    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    referrer_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    referred_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    reward_status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), init=False)

if TYPE_CHECKING:
    from bot.models.user import User, Student


class Reminder(Base):
    __tablename__ = "reminders"

    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    
    # REQUIRED FIELDS
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    text: Mapped[str] = mapped_column(String(500))
    due_date: Mapped[datetime] = mapped_column(DateTime)
    
    # FIELDS WITH DEFAULTS
    sent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), init=False)

    # RELATIONSHIPS
    user: Mapped["User"] = relationship(init=False)


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    
    # REQUIRED FIELDS
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(String(255))
    
    # FIELDS WITH DEFAULTS
    icon: Mapped[str] = mapped_column(String(10), default="🏆")
    xp_reward: Mapped[int] = mapped_column(Integer, default=100)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), init=False)

    student_links: Mapped[List["StudentAchievement"]] = relationship(back_populates="achievement", default_factory=list)


class StudentAchievement(Base):
    __tablename__ = "student_achievements"

    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    
    # REQUIRED FIELDS
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id", ondelete="CASCADE"))
    achievement_id: Mapped[int] = mapped_column(ForeignKey("achievements.id", ondelete="CASCADE"))
    
    # FIELDS WITH DEFAULTS
    earned_at: Mapped[datetime] = mapped_column(server_default=func.now(), init=False)

    student: Mapped["Student"] = relationship(init=False)
    achievement: Mapped["Achievement"] = relationship(back_populates="student_links", init=False)
