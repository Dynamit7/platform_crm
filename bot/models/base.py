from datetime import datetime
from sqlalchemy import func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, MappedAsDataclass


class Base(DeclarativeBase, MappedAsDataclass):
    """Base class for all models."""
    pass


class TimestampMixin:
    """Mixin for adding created_at and updated_at columns."""
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), 
        default=None,
        init=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(), 
        onupdate=func.now(), 
        default=None,
        init=False
    )
