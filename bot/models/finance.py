from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, func, DateTime, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from bot.models.base import Base

if TYPE_CHECKING:
    from bot.models.user import User, Student
    from bot.models.education import Registration

class Finance(Base):
    """
    Модель платежей (Финансы) с поддержкой типов и привязкой к курсам.
    """
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, init=False)
    
    # REQUIRED FIELDS
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2))
    
    # PAY TYPE & PURPOSE (NEW)
    payment_type: Mapped[str] = mapped_column(String(50), default="monthly_fee", index=True)
    registration_id: Mapped[Optional[int]] = mapped_column(ForeignKey("registrations.id", ondelete="SET NULL"), nullable=True, index=True, default=None)
    purpose: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, default=None)

    # FIELDS WITH DEFAULTS
    student_id: Mapped[Optional[int]] = mapped_column(ForeignKey("students.id"), nullable=True, default=None, index=True)
    status: Mapped[str] = mapped_column(String(50), default="pending", index=True) # pending, succeeded, canceled
    payment_method: Mapped[Optional[str]] = mapped_column(String(50), default=None) # Card, Cash, YooKassa
    
    yookassa_id: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True, default=None)
    admin_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), default=None)
    payment_date: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), default_factory=datetime.now)
    
    created_at: Mapped[datetime] = mapped_column(server_default=func.now(), init=False, index=True)
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now(), init=False)

    # RELATIONSHIPS
    user: Mapped["User"] = relationship(foreign_keys=[user_id], init=False, back_populates="payments")
    student: Mapped[Optional["Student"]] = relationship(init=False)
    registration: Mapped[Optional["Registration"]] = relationship(init=False)
