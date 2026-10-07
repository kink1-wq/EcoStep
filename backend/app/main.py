from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import update

from app.api import admin, reports
from app.core.config import settings
from app.database.session import Base, SessionLocal, engine
from app.models.cleanup import CleanupStatus, CleanupSubmission
from app.models.report import Report, ReportStatus


def release_stuck_reports() -> None:
    """Заявки, зависшие в «анализе» (например, сервер перезапустили), отдаём на ручную проверку."""
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
    with SessionLocal() as db:
        db.execute(
            update(Report)
            .where(Report.status == ReportStatus.pending, Report.created_at < cutoff)
            .values(status=ReportStatus.needs_review, moderation_note="Анализ не завершился — нужна проверка")
        )
        db.execute(
            update(CleanupSubmission)
            .where(CleanupSubmission.status == CleanupStatus.pending, CleanupSubmission.created_at < cutoff)
            .values(status=CleanupStatus.needs_review, moderation_note="Анализ не завершился — нужна проверка")
        )
        db.commit()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)  # для MVP; позже — Alembic
    release_stuck_reports()
    yield


app = FastAPI(title="EcoStep API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, allow_origins=settings.cors_origins,
    allow_methods=["*"], allow_headers=["*"],
)
app.include_router(reports.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok"}
