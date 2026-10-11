from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.cleanup import CleanupSubmission
from app.models.report import Report


def check_rate_limit(db: Session, user_id: str) -> None:
    """Не более N заявок (о загрязнении + на уборку вместе) в минуту с одного аккаунта. Считаем по базе —
    так лимит работает и после перезапуска сервера, и при нескольких экземплярах."""
    since = datetime.now(timezone.utc) - timedelta(seconds=60)
    reports = db.scalar(select(func.count()).select_from(Report).where(Report.user_id == user_id, Report.created_at >= since)) or 0
    cleanups = db.scalar(
        select(func.count()).select_from(CleanupSubmission).where(CleanupSubmission.user_id == user_id, CleanupSubmission.created_at >= since)
    ) or 0
    if reports + cleanups >= settings.rate_limit_per_minute:
        raise HTTPException(
            429, f"Слишком много заявок: не более {settings.rate_limit_per_minute} в минуту. Подождите немного и повторите."
        )
