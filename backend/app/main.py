import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text, update

from app.api import admin, cleanups, reports, stats
from app.core.config import settings
from app.database.session import Base, SessionLocal, engine
from app.models.cleanup import CleanupStatus, CleanupSubmission
from app.models.report import Report, ReportStatus
from app.models import social  # noqa: F401  — чтобы таблицы жалоб, голосов и блокировок попали в create_all
from app.services.notes import NOTE_STUCK

log = logging.getLogger(__name__)

# Все наши таблицы: на них включаем защиту строк (RLS), чтобы к ним нельзя было обратиться
# напрямую через публичный ключ Supabase — только через этот сервер.
TABLES = ["reports", "cleanup_submissions", "report_supports", "report_flags", "blocked_users"]


def ensure_schema() -> None:
    """Лёгкая автоматическая «миграция» при старте (Postgres): новые колонки и защита таблиц.
    Все команды безопасно повторять — они ничего не делают, если уже применены."""
    if engine.dialect.name != "postgresql":
        return
    statements = ["ALTER TABLE reports ADD COLUMN IF NOT EXISTS description_kk TEXT"]
    statements += [f"ALTER TABLE {t} ENABLE ROW LEVEL SECURITY" for t in TABLES]
    for stmt in statements:
        try:
            with engine.begin() as conn:
                conn.execute(text(stmt))
        except Exception:
            log.exception("Не удалось выполнить: %s", stmt)


def release_stuck_reports() -> None:
    """Заявки, зависшие в «анализе» (например, сервер перезапустили), отдаём на ручную проверку."""
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
    with SessionLocal() as db:
        db.execute(
            update(Report)
            .where(Report.status == ReportStatus.pending, Report.created_at < cutoff)
            .values(status=ReportStatus.needs_review, moderation_note=NOTE_STUCK)
        )
        db.execute(
            update(CleanupSubmission)
            .where(CleanupSubmission.status == CleanupStatus.pending, CleanupSubmission.created_at < cutoff)
            .values(status=CleanupStatus.needs_review, moderation_note=NOTE_STUCK)
        )
        db.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)  # для MVP; позже — Alembic
    ensure_schema()
    release_stuck_reports()
    yield


app = FastAPI(title="EcoStep API", lifespan=lifespan)
# Адреса, с которых открывается мобильное приложение (Capacitor): Android — https://localhost
# (в старых версиях http://localhost), iOS — capacitor://localhost. Они разрешены всегда, поэтому
# переменная CORS_ORIGINS нужна только для адресов сайта (Vercel и т.п.).
APP_ORIGIN_REGEX = r"^(https?://localhost(:\d+)?|capacitor://localhost|ionic://localhost)$"

app.add_middleware(
    CORSMiddleware, allow_origins=settings.cors_origins, allow_origin_regex=APP_ORIGIN_REGEX,
    allow_methods=["*"], allow_headers=["*"],
)
app.include_router(reports.router)
app.include_router(cleanups.router)
app.include_router(stats.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok"}
