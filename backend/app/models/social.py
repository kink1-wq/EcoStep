import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class ReportSupport(Base):
    """Голос «Тоже вижу» — подтверждение, что проблема действительно есть. Один голос от пользователя на точку."""

    __tablename__ = "report_supports"
    __table_args__ = (UniqueConstraint("report_id", "user_id", name="uq_support_report_user"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    report_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("reports.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(String, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ReportFlag(Base):
    """Жалоба на точку. Достаточное число жалоб скрывает точку с карты до проверки администратором."""

    __tablename__ = "report_flags"
    __table_args__ = (UniqueConstraint("report_id", "user_id", name="uq_flag_report_user"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    report_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("reports.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(String, index=True)
    reason: Mapped[str | None] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class BlockedUser(Base):
    """Заблокированный администратором пользователь: не может отправлять заявки, голоса и жалобы."""

    __tablename__ = "blocked_users"

    user_id: Mapped[str] = mapped_column(String, primary_key=True)
    reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
