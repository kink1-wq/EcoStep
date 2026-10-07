import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.cleanup import CleanupStatus


class CleanupPublic(BaseModel):
    """Ответ пользователю после отправки фото-подтверждения уборки."""
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    report_id: uuid.UUID
    photo_url: str
    status: CleanupStatus
    created_at: datetime


class CleanupAdmin(CleanupPublic):
    user_id: str
    ai_is_clean: bool | None
    ai_confidence: float | None
    moderation_note: str | None
    # Контекст исходной заявки — чтобы администратор видел «было / стало» без второго запроса
    report_photo_url: str
    report_category: str | None
    report_description: str | None
    report_latitude: float
    report_longitude: float


class AICleanupResult(BaseModel):
    is_clean: bool
    confidence: float
    note: str
