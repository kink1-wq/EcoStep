import logging
import uuid
from datetime import datetime, timezone

from app.core.config import settings
from app.database.session import SessionLocal
from app.models.cleanup import CleanupStatus, CleanupSubmission
from app.models.report import Report, ReportStatus
from app.schemas.cleanup import AICleanupResult
from app.schemas.report import AIResult
from app.services.ai_vision import analyze_cleanup, analyze_photo

log = logging.getLogger(__name__)


def decide(ai: AIResult) -> tuple[ReportStatus, str]:
    """Три исхода: подтверждена / отклонена / сомнительный случай → человек."""
    if ai.is_polluted and ai.confidence >= settings.auto_approve_confidence:
        return ReportStatus.approved, "Автоматически подтверждено ИИ"
    if not ai.is_polluted and ai.confidence >= settings.auto_reject_confidence:
        return ReportStatus.rejected, "Загрязнение на фото не обнаружено"
    return ReportStatus.needs_review, "Низкая уверенность ИИ — нужна проверка"


def process_report(report_id: uuid.UUID, image: bytes, mime: str) -> None:
    """Фоновая задача: анализ фото → автомодерация. Любая ошибка ИИ → needs_review."""
    with SessionLocal() as db:
        report = db.get(Report, report_id)
        if not report:
            return
        try:
            ai = analyze_photo(image, mime)
            report.ai_is_polluted = ai.is_polluted
            report.ai_confidence = ai.confidence
            report.category = ai.category
            report.description = ai.description
            report.status, report.moderation_note = decide(ai)
        except Exception:
            log.exception("AI analysis failed for %s", report_id)
            report.status = ReportStatus.needs_review
            report.moderation_note = "Ошибка анализа ИИ — нужна проверка"
        db.commit()


def decide_cleanup(ai: AICleanupResult) -> tuple[CleanupStatus, str]:
    if ai.is_clean and ai.confidence >= settings.auto_approve_confidence:
        return CleanupStatus.confirmed, "Автоматически подтверждено ИИ: место убрано"
    if not ai.is_clean and ai.confidence >= settings.auto_reject_confidence:
        return CleanupStatus.rejected, "ИИ всё ещё видит загрязнение на фото"
    return CleanupStatus.needs_review, "Низкая уверенность ИИ — нужна проверка"


def process_cleanup(submission_id: uuid.UUID, image: bytes, mime: str) -> None:
    """Фоновая задача: сравнивает новое фото с исходной заявкой и решает, убрано ли загрязнение."""
    with SessionLocal() as db:
        submission = db.get(CleanupSubmission, submission_id)
        if not submission:
            return
        report = db.get(Report, submission.report_id)
        try:
            ai = analyze_cleanup(image, mime, report.category if report else None, report.description if report else None)
            submission.ai_is_clean = ai.is_clean
            submission.ai_confidence = ai.confidence
            submission.status, submission.moderation_note = decide_cleanup(ai)
            if submission.status == CleanupStatus.confirmed and report:
                report.status = ReportStatus.resolved
                report.resolved_at = datetime.now(timezone.utc)
        except Exception:
            log.exception("AI cleanup analysis failed for %s", submission_id)
            submission.status = CleanupStatus.needs_review
            submission.moderation_note = "Ошибка анализа ИИ — нужна проверка"
        db.commit()
