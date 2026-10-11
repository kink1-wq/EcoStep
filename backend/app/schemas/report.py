import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.report import ReportStatus


class PrivacyBox(BaseModel):
    """Прямоугольник на фото, который нужно скрыть (лицо или номер автомобиля).
    Координаты — целые числа 0..1000 (доля от размера изображения, начало — левый верхний угол)."""
    kind: str
    ymin: int
    xmin: int
    ymax: int
    xmax: int


class ReportPublic(BaseModel):
    """Что видит любой посетитель карты."""
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    latitude: float
    longitude: float
    photo_url: str
    category: str | None
    description: str | None
    description_kk: str | None = None
    status: ReportStatus
    created_at: datetime
    support_count: int = 0


class ReportAdmin(ReportPublic):
    user_id: str
    user_comment: str | None
    ai_is_polluted: bool | None
    ai_confidence: float | None
    moderation_note: str | None
    flag_count: int = 0


class FlaggedReport(ReportAdmin):
    flag_reasons: list[str] = []


class AIResult(BaseModel):
    is_polluted: bool
    confidence: float
    category: str
    description: str
    description_kk: str = ""
    privacy_boxes: list[PrivacyBox] = []


class Decision(BaseModel):
    approve: bool
    note: str | None = None


class FlagBody(BaseModel):
    reason: str | None = Field(None, max_length=200)


class BlockBody(BaseModel):
    reason: str | None = Field(None, max_length=500)


class CountResult(BaseModel):
    count: int


class BlockedUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: str
    reason: str | None
    created_at: datetime


class ArchiveItem(BaseModel):
    """Убранное место: фото «до» и (если уборку подтверждали фото) «после»."""
    id: uuid.UUID
    latitude: float
    longitude: float
    category: str | None
    description: str | None
    description_kk: str | None
    photo_url: str
    after_photo_url: str | None
    created_at: datetime
    resolved_at: datetime | None
