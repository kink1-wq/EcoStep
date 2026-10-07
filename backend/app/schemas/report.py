import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.report import ReportStatus


class ReportPublic(BaseModel):
    """Что видит любой посетитель карты."""
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    latitude: float
    longitude: float
    photo_url: str
    category: str | None
    description: str | None
    status: ReportStatus
    created_at: datetime


class ReportAdmin(ReportPublic):
    user_id: str
    user_comment: str | None
    ai_is_polluted: bool | None
    ai_confidence: float | None
    moderation_note: str | None


class AIResult(BaseModel):
    is_polluted: bool
    confidence: float
    category: str
    description: str


class Decision(BaseModel):
    approve: bool
    note: str | None = None
