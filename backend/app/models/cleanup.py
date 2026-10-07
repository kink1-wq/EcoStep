import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class CleanupStatus(str, enum.Enum):
    pending = "pending"            # ждёт анализа ИИ
    confirmed = "confirmed"        # подтверждено: место убрано, точка снята с карты
    rejected = "rejected"          # ИИ решил, что загрязнение ещё видно
    needs_review = "needs_review"  # сомнительный случай → администратор


class CleanupSubmission(Base):
    """Фото-подтверждение, что загрязнение на месте заявки убрано."""

    __tablename__ = "cleanup_submissions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    report_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("reports.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[str] = mapped_column(String, index=True)
    photo_path: Mapped[str] = mapped_column(String)
    photo_url: Mapped[str] = mapped_column(String)

    status: Mapped[CleanupStatus] = mapped_column(
        Enum(CleanupStatus, name="cleanup_status"), default=CleanupStatus.pending, index=True
    )
    ai_is_clean: Mapped[bool | None] = mapped_column()
    ai_confidence: Mapped[float | None] = mapped_column(Float)
    moderation_note: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
