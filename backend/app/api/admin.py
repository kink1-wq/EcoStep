import uuid

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import require_admin
from app.database.session import get_db
from app.models.cleanup import CleanupStatus, CleanupSubmission
from app.models.report import Report, ReportStatus
from app.schemas.cleanup import CleanupAdmin
from app.schemas.report import Decision, ReportAdmin
from app.services.storage import delete_photo

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/reports", response_model=list[ReportAdmin])
def queue(status: ReportStatus = ReportStatus.needs_review, limit: int = 100, db: Session = Depends(get_db)):
    q = select(Report).where(Report.status == status).order_by(Report.created_at).limit(limit)
    return db.scalars(q).all()


@router.post("/reports/{report_id}/decision", response_model=ReportAdmin)
def decide(report_id: uuid.UUID, body: Decision, db: Session = Depends(get_db)):
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(404, "Заявка не найдена")
    report.status = ReportStatus.approved if body.approve else ReportStatus.rejected
    report.moderation_note = f"Решение администратора: {body.note or '—'}"
    db.commit()
    return report


@router.get("/cleanups", response_model=list[CleanupAdmin])
def cleanup_queue(status: CleanupStatus = CleanupStatus.needs_review, limit: int = 100, db: Session = Depends(get_db)):
    q = (
        select(CleanupSubmission, Report)
        .join(Report, Report.id == CleanupSubmission.report_id)
        .where(CleanupSubmission.status == status)
        .order_by(CleanupSubmission.created_at)
        .limit(limit)
    )
    out = []
    for sub, report in db.execute(q).all():
        out.append(CleanupAdmin(
            id=sub.id, report_id=sub.report_id, photo_url=sub.photo_url, status=sub.status,
            created_at=sub.created_at, user_id=sub.user_id, ai_is_clean=sub.ai_is_clean,
            ai_confidence=sub.ai_confidence, moderation_note=sub.moderation_note,
            report_photo_url=report.photo_url, report_category=report.category,
            report_description=report.description, report_latitude=report.latitude,
            report_longitude=report.longitude,
        ))
    return out


@router.post("/cleanups/{submission_id}/decision", response_model=CleanupAdmin)
def decide_cleanup_submission(submission_id: uuid.UUID, body: Decision, db: Session = Depends(get_db)):
    sub = db.get(CleanupSubmission, submission_id)
    if not sub:
        raise HTTPException(404, "Заявка на уборку не найдена")
    report = db.get(Report, sub.report_id)
    sub.status = CleanupStatus.confirmed if body.approve else CleanupStatus.rejected
    sub.moderation_note = f"Решение администратора: {body.note or '—'}"
    if body.approve and report:
        report.status = ReportStatus.resolved
        report.resolved_at = datetime.now(timezone.utc)
    db.commit()
    return CleanupAdmin(
        id=sub.id, report_id=sub.report_id, photo_url=sub.photo_url, status=sub.status,
        created_at=sub.created_at, user_id=sub.user_id, ai_is_clean=sub.ai_is_clean,
        ai_confidence=sub.ai_confidence, moderation_note=sub.moderation_note,
        report_photo_url=report.photo_url if report else "", report_category=report.category if report else None,
        report_description=report.description if report else None,
        report_latitude=report.latitude if report else 0, report_longitude=report.longitude if report else 0,
    )


@router.post("/reports/{report_id}/resolve", response_model=ReportAdmin)
def resolve_report(report_id: uuid.UUID, db: Session = Depends(get_db)):
    """Снять точку с карты вручную (без фото), например если администратор сам убедился на месте."""
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(404, "Заявка не найдена")
    report.status = ReportStatus.resolved
    report.resolved_at = datetime.now(timezone.utc)
    report.moderation_note = "Снята администратором вручную"
    db.commit()
    return report


@router.delete("/reports/{report_id}", status_code=204)
def delete_report(report_id: uuid.UUID, db: Session = Depends(get_db)):
    """Полностью удалить заявку и её фото (необратимо)."""
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(404, "Заявка не найдена")
    delete_photo(report.photo_path)
    db.delete(report)
    db.commit()
