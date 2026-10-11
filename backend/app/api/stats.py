from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.cleanup import CleanupStatus, CleanupSubmission
from app.models.report import Report, ReportStatus
from app.models.social import ReportSupport
from app.schemas.stats import CategoryStat, DayStat, StatsOut
from app.services.metrics import cleanup_ai_metrics, report_ai_metrics

router = APIRouter(prefix="/api/stats", tags=["stats"])

LOCAL_TZ = timezone(timedelta(hours=5))  # Акмолинская область, UTC+5
DAYS = 30


def _local_date(dt: datetime):
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(LOCAL_TZ).date()


@router.get("", response_model=StatsOut)
def stats(db: Session = Depends(get_db)):
    """Публичная статистика проекта: масштаб, результативность и работа ИИ."""
    rows = db.execute(
        select(
            Report.status, Report.category, Report.created_at, Report.resolved_at,
            Report.ai_is_polluted, Report.ai_confidence, Report.moderation_note,
        )
    ).all()

    published = [r for r in rows if r.status in (ReportStatus.approved, ReportStatus.resolved)]
    active = [r for r in published if r.status == ReportStatus.approved]
    resolved = [r for r in published if r.status == ReportStatus.resolved]

    durations = [
        (r.resolved_at - r.created_at).total_seconds() / 86400
        for r in resolved
        if r.resolved_at and r.created_at and r.resolved_at.replace(tzinfo=None) >= r.created_at.replace(tzinfo=None)
    ]

    by_cat: dict[str, list[int]] = defaultdict(lambda: [0, 0])
    for r in published:
        by_cat[r.category or "другое"][0 if r.status == ReportStatus.approved else 1] += 1
    by_category = [
        CategoryStat(category=c, active=a, resolved=z)
        for c, (a, z) in sorted(by_cat.items(), key=lambda kv: -(kv[1][0] + kv[1][1]))
    ]

    today = datetime.now(LOCAL_TZ).date()
    days = [today - timedelta(days=i) for i in range(DAYS - 1, -1, -1)]
    reported = defaultdict(int)
    closed = defaultdict(int)
    for r in published:
        if r.created_at:
            reported[_local_date(r.created_at)] += 1
        if r.status == ReportStatus.resolved and r.resolved_at:
            closed[_local_date(r.resolved_at)] += 1
    by_day = [DayStat(date=d.isoformat(), reported=reported[d], resolved=closed[d]) for d in days]

    supports = db.scalar(select(func.count()).select_from(ReportSupport)) or 0
    cleanup_rows = db.execute(
        select(CleanupSubmission.status, CleanupSubmission.ai_is_clean, CleanupSubmission.ai_confidence, CleanupSubmission.moderation_note)
    ).all()

    return StatsOut(
        total=len(published), active=len(active), resolved=len(resolved),
        resolution_rate=round(len(resolved) / len(published), 4) if published else None,
        avg_days_to_resolve=round(sum(durations) / len(durations), 1) if durations else None,
        supports=supports,
        cleanups_confirmed=sum(1 for c in cleanup_rows if c.status == CleanupStatus.confirmed),
        by_category=by_category, by_day=by_day,
        ai_reports=report_ai_metrics([(r.status, r.ai_is_polluted, r.ai_confidence, r.moderation_note) for r in rows]),
        ai_cleanups=cleanup_ai_metrics([tuple(c) for c in cleanup_rows]),
    )
