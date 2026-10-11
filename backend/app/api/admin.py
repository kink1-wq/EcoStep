import csv
import io
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.core.security import CurrentUser, require_admin
from app.database.session import get_db
from app.models.cleanup import CleanupStatus, CleanupSubmission
from app.models.report import Report, ReportStatus
from app.models.social import BlockedUser, ReportFlag, ReportSupport
from app.schemas.cleanup import CleanupAdmin
from app.schemas.report import BlockBody, BlockedUserOut, CountResult, Decision, FlaggedReport, ReportAdmin
from app.services.notes import NOTE_ADMIN_PREFIX, NOTE_ADMIN_RESOLVED
from app.services.storage import delete_photo

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


def _flag_counts(db: Session, ids: list) -> dict:
    if not ids:
        return {}
    return dict(
        db.execute(select(ReportFlag.report_id, func.count()).where(ReportFlag.report_id.in_(ids)).group_by(ReportFlag.report_id)).all()
    )


@router.get("/reports", response_model=list[ReportAdmin])
def queue(status: ReportStatus = ReportStatus.needs_review, limit: int = 100, db: Session = Depends(get_db)):
    q = select(Report).where(Report.status == status).order_by(Report.created_at).limit(limit)
    reports = db.scalars(q).all()
    flags = _flag_counts(db, [r.id for r in reports])
    return [ReportAdmin.model_validate(r).model_copy(update={"flag_count": flags.get(r.id, 0)}) for r in reports]


@router.post("/reports/{report_id}/decision", response_model=ReportAdmin)
def decide(report_id: uuid.UUID, body: Decision, db: Session = Depends(get_db)):
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(404, "Заявка не найдена")
    report.status = ReportStatus.approved if body.approve else ReportStatus.rejected
    report.moderation_note = f"{NOTE_ADMIN_PREFIX}: {body.note or '—'}"
    db.execute(delete(ReportFlag).where(ReportFlag.report_id == report.id))  # решение принято — жалобы закрыты
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
    sub.moderation_note = f"{NOTE_ADMIN_PREFIX}: {body.note or '—'}"
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
    report.moderation_note = NOTE_ADMIN_RESOLVED
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


# ---------- жалобы ----------

@router.get("/flags", response_model=list[FlaggedReport])
def flagged(db: Session = Depends(get_db)):
    """Точки, на которые пожаловались пользователи (больше всего жалоб — выше)."""
    rows = db.execute(
        select(Report, func.count(ReportFlag.id))
        .join(ReportFlag, ReportFlag.report_id == Report.id)
        .group_by(Report.id)
        .order_by(func.count(ReportFlag.id).desc())
    ).all()
    reasons: dict = {}
    if rows:
        for rid, reason in db.execute(select(ReportFlag.report_id, ReportFlag.reason).where(ReportFlag.report_id.in_([r.id for r, _ in rows]))).all():
            if reason:
                reasons.setdefault(rid, []).append(reason)
    return [
        FlaggedReport.model_validate(r).model_copy(update={"flag_count": n, "flag_reasons": reasons.get(r.id, [])})
        for r, n in rows
    ]


@router.post("/reports/{report_id}/dismiss-flags", response_model=CountResult)
def dismiss_flags(report_id: uuid.UUID, db: Session = Depends(get_db)):
    """Жалобы необоснованны: сбросить их, точка снова видна на карте."""
    removed = db.execute(delete(ReportFlag).where(ReportFlag.report_id == report_id)).rowcount or 0
    db.commit()
    return CountResult(count=removed)


# ---------- блокировка пользователей ----------

@router.post("/users/{user_id}/block", response_model=BlockedUserOut)
def block_user(user_id: str, body: BlockBody, admin: CurrentUser = Depends(require_admin), db: Session = Depends(get_db)):
    if user_id == admin.id:
        raise HTTPException(400, "Нельзя заблокировать самого себя.")
    row = db.get(BlockedUser, user_id)
    if row:
        row.reason = body.reason or row.reason
    else:
        row = BlockedUser(user_id=user_id, reason=body.reason)
        db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/users/{user_id}/block", status_code=204)
def unblock_user(user_id: str, db: Session = Depends(get_db)):
    row = db.get(BlockedUser, user_id)
    if row:
        db.delete(row)
        db.commit()


@router.get("/blocked", response_model=list[BlockedUserOut])
def blocked_users(db: Session = Depends(get_db)):
    return db.scalars(select(BlockedUser).order_by(BlockedUser.created_at.desc())).all()


# ---------- выгрузка для ответственных организаций ----------

_STATUS_RU = {
    ReportStatus.pending: "Анализ ИИ", ReportStatus.approved: "На карте", ReportStatus.rejected: "Отклонена",
    ReportStatus.needs_review: "На проверке", ReportStatus.resolved: "Убрана",
}


def _csv_safe(value) -> str:
    """Защита от «формульной инъекции» в Excel: ячейки, начинающиеся с = + - @, делаем текстом."""
    text = "" if value is None else str(value)
    return "'" + text if text[:1] in ("=", "+", "-", "@") else text


@router.get("/export.csv")
def export_csv(scope: str = Query("active", pattern="^(active|resolved|all)$"), db: Session = Depends(get_db)):
    """CSV для передачи в акимат и профильные службы. scope: active — точки на карте, resolved — убранные, all — все заявки."""
    q = select(Report).order_by(Report.created_at.desc())
    if scope == "active":
        q = q.where(Report.status == ReportStatus.approved)
    elif scope == "resolved":
        q = q.where(Report.status == ReportStatus.resolved)
    reports = db.scalars(q).all()
    ids = [r.id for r in reports]
    supports = dict(db.execute(select(ReportSupport.report_id, func.count()).where(ReportSupport.report_id.in_(ids)).group_by(ReportSupport.report_id)).all()) if ids else {}
    flags = _flag_counts(db, ids)

    buf = io.StringIO()
    w = csv.writer(buf, delimiter=";")
    w.writerow([
        "ID", "Дата заявки", "Статус", "Категория", "Описание (рус)", "Сипаттамасы (қаз)", "Широта", "Долгота",
        "Ссылка на карту", "Фото", "Подтверждений «Тоже вижу»", "Жалоб", "Дата уборки",
    ])
    for r in reports:
        w.writerow([
            r.id, r.created_at.strftime("%Y-%m-%d %H:%M") if r.created_at else "", _STATUS_RU.get(r.status, r.status.value),
            _csv_safe(r.category), _csv_safe(r.description), _csv_safe(r.description_kk),
            f"{r.latitude:.6f}", f"{r.longitude:.6f}",
            f"https://www.openstreetmap.org/?mlat={r.latitude}&mlon={r.longitude}#map=18/{r.latitude}/{r.longitude}",
            r.photo_url, supports.get(r.id, 0), flags.get(r.id, 0),
            r.resolved_at.strftime("%Y-%m-%d %H:%M") if r.resolved_at else "",
        ])
    body = ("\ufeff" + buf.getvalue()).encode("utf-8")  # BOM — чтобы Excel правильно показал кириллицу
    return Response(
        content=body, media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="ecostep-{scope}.csv"'},
    )
