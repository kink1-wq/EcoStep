import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Float, Index, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class ReportStatus(str, enum.Enum):
    pending = "pending"            # ждёт анализа ИИ
    approved = "approved"          # подтверждена, видна на карте
    rejected = "rejected"          # отклонена
    needs_review = "needs_review"  # сомнительный случай → администратор
    resolved = "resolved"          # убрана (подтверждено фото или решением администратора)


class Report(Base):
    __tablename__ = "reports"
    __table_args__ = (Index("ix_reports_geo", "latitude", "longitude"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[str] = mapped_column(String, index=True)
    photo_path: Mapped[str] = mapped_column(String)
    photo_url: Mapped[str] = mapped_column(String)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    user_comment: Mapped[str | None] = mapped_column(String(500))

    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus, name="report_status"), default=ReportStatus.pending, index=True
    )
    category: Mapped[str | None] = mapped_column(String(64))
    description: Mapped[str | None] = mapped_column(Text)
    description_kk: Mapped[str | None] = mapped_column(Text)
    ai_is_polluted: Mapped[bool | None] = mapped_column(Boolean)
    ai_confidence: Mapped[float | None] = mapped_column(Float)
    moderation_note: Mapped[str | None] = mapped_column(Text)

    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
