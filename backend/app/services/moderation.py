import logging
import uuid
from datetime import datetime, timezone

from app.core.config import settings
from app.database.session import SessionLocal
from app.models.cleanup import CleanupStatus, CleanupSubmission
from app.models.report import Report, ReportStatus
from app.schemas.cleanup import AICleanupResult
from app.schemas.report import AIResult, PrivacyBox
from app.services.ai_vision import analyze_cleanup, analyze_photo
from app.services.notes import (
    NOTE_AI_ERROR, NOTE_AUTO_APPROVED, NOTE_AUTO_REJECTED, NOTE_BLUR_FAILED,
    NOTE_CLEANUP_CONFIRMED, NOTE_CLEANUP_REJECTED, NOTE_LOW_CONFIDENCE,
)
from app.services.privacy import blur_regions
from app.services.storage import delete_photo, upload_photo

log = logging.getLogger(__name__)


def decide(ai: AIResult) -> tuple[ReportStatus, str]:
    """Три исхода: подтверждена / отклонена / сомнительный случай → человек."""
    if ai.is_polluted and ai.confidence >= settings.auto_approve_confidence:
        return ReportStatus.approved, NOTE_AUTO_APPROVED
    if not ai.is_polluted and ai.confidence >= settings.auto_reject_confidence:
        return ReportStatus.rejected, NOTE_AUTO_REJECTED
    return ReportStatus.needs_review, NOTE_LOW_CONFIDENCE


def _protect_photo(folder: str, image: bytes, boxes: list[PrivacyBox]) -> tuple[str, str] | None:
    """Скрывает лица и номера автомобилей: загружает размытую копию, возвращает (путь, url) или None, если скрывать нечего."""
    blurred = blur_regions(image, boxes) if boxes else None
    if blurred is None:
        return None
    path = f"{folder}/{uuid.uuid4()}.jpg"
    return path, upload_photo(path, blurred, "image/jpeg")


def process_report(report_id: uuid.UUID, image: bytes, mime: str) -> None:
    """Фоновая задача: анализ фото → скрытие лиц/номеров → автомодерация. Любая ошибка ИИ → needs_review."""
    with SessionLocal() as db:
        report = db.get(Report, report_id)
        if not report:
            return
        old_path: str | None = None
        try:
            ai = analyze_photo(image, mime)
            report.ai_is_polluted = ai.is_polluted
            report.ai_confidence = ai.confidence
            report.category = ai.category
            report.description = ai.description
            report.description_kk = ai.description_kk or None
            report.status, report.moderation_note = decide(ai)

            # Приватность: публичная копия фото без читаемых лиц и номеров
            try:
                protected = _protect_photo(report.user_id, image, ai.privacy_boxes)
                if protected:
                    old_path = report.photo_path
                    report.photo_path, report.photo_url = protected
            except Exception:
                log.exception("Blur failed for %s", report_id)
                report.status = ReportStatus.needs_review  # не публикуем исходное фото без проверки человеком
                report.moderation_note = NOTE_BLUR_FAILED
        except Exception:
            log.exception("AI analysis failed for %s", report_id)
            report.status = ReportStatus.needs_review
            report.moderation_note = NOTE_AI_ERROR
        db.commit()
        if old_path:
            delete_photo(old_path)  # оригинал с лицами больше не нужен


def decide_cleanup(ai: AICleanupResult) -> tuple[CleanupStatus, str]:
    if ai.is_clean and ai.confidence >= settings.auto_approve_confidence:
        return CleanupStatus.confirmed, NOTE_CLEANUP_CONFIRMED
    if not ai.is_clean and ai.confidence >= settings.auto_reject_confidence:
        return CleanupStatus.rejected, NOTE_CLEANUP_REJECTED
    return CleanupStatus.needs_review, NOTE_LOW_CONFIDENCE


def process_cleanup(submission_id: uuid.UUID, image: bytes, mime: str) -> None:
    """Фоновая задача: сравнивает новое фото с исходной заявкой и решает, убрано ли загрязнение."""
    with SessionLocal() as db:
        submission = db.get(CleanupSubmission, submission_id)
        if not submission:
            return
        report = db.get(Report, submission.report_id)
        old_path: str | None = None
        try:
            ai = analyze_cleanup(image, mime, report.category if report else None, report.description if report else None)
            submission.ai_is_clean = ai.is_clean
            submission.ai_confidence = ai.confidence
            submission.status, submission.moderation_note = decide_cleanup(ai)

            try:
                protected = _protect_photo(f"cleanup/{submission.user_id}", image, ai.privacy_boxes)
                if protected:
                    old_path = submission.photo_path
                    submission.photo_path, submission.photo_url = protected
            except Exception:
                log.exception("Blur failed for cleanup %s", submission_id)
                submission.status = CleanupStatus.needs_review
                submission.moderation_note = NOTE_BLUR_FAILED

            if submission.status == CleanupStatus.confirmed and report:
                report.status = ReportStatus.resolved
                report.resolved_at = datetime.now(timezone.utc)
        except Exception:
            log.exception("AI cleanup analysis failed for %s", submission_id)
            submission.status = CleanupStatus.needs_review
            submission.moderation_note = NOTE_AI_ERROR
        db.commit()
        if old_path:
            delete_photo(old_path)
