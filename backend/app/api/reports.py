import io
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile
from PIL import Image
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import CurrentUser, get_current_user
from app.database.session import get_db
from app.models.cleanup import CleanupSubmission
from app.models.report import Report, ReportStatus
from app.schemas.cleanup import CleanupPublic
from app.schemas.report import ReportPublic
from app.services.exif import extract_gps
from app.services.moderation import process_cleanup, process_report
from app.services.storage import delete_photo, upload_photo

router = APIRouter(prefix="/api/reports", tags=["reports"])

ALLOWED = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


@router.post("", response_model=ReportPublic, status_code=202)
async def create_report(
    background: BackgroundTasks,
    photo: UploadFile = File(...),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    comment: str | None = Form(None, max_length=500),
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Принимает фото + GPS от фронтенда (или берёт GPS из EXIF), запускает ИИ-модерацию."""
    if photo.content_type not in ALLOWED:
        raise HTTPException(415, "Допустимы JPEG, PNG, WebP")
    data = await photo.read()
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, f"Файл больше {settings.max_upload_mb} МБ")
    try:
        Image.open(io.BytesIO(data)).verify()
    except Exception:
        raise HTTPException(422, "Файл не является изображением")

    if latitude is None or longitude is None:
        gps = extract_gps(data)
        if not gps:
            raise HTTPException(422, "Не удалось определить геопозицию: разрешите доступ к GPS")
        latitude, longitude = gps
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        raise HTTPException(422, "Некорректные координаты")

    path = f"{user.id}/{uuid.uuid4()}.{ALLOWED[photo.content_type]}"
    url = upload_photo(path, data, photo.content_type)

    report = Report(
        user_id=user.id, photo_path=path, photo_url=url,
        latitude=latitude, longitude=longitude, user_comment=comment,
    )
    db.add(report)
    db.commit()
    background.add_task(process_report, report.id, data, photo.content_type)
    return report


@router.get("", response_model=list[ReportPublic])
def list_public(
    min_lat: float | None = None, max_lat: float | None = None,
    min_lon: float | None = None, max_lon: float | None = None,
    category: str | None = None,
    limit: int = Query(500, le=1000),
    db: Session = Depends(get_db),
):
    """Публичные точки для карты (только approved), с фильтром по видимой области."""
    q = select(Report).where(Report.status == ReportStatus.approved)
    if None not in (min_lat, max_lat, min_lon, max_lon):
        q = q.where(Report.latitude.between(min_lat, max_lat), Report.longitude.between(min_lon, max_lon))
    if category:
        q = q.where(Report.category == category)
    return db.scalars(q.order_by(Report.created_at.desc()).limit(limit)).all()


@router.get("/mine", response_model=list[ReportPublic])
def list_mine(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    q = select(Report).where(Report.user_id == user.id).order_by(Report.created_at.desc())
    return db.scalars(q).all()


@router.get("/{report_id}", response_model=ReportPublic)
def get_report(report_id: uuid.UUID, db: Session = Depends(get_db)):
    report = db.get(Report, report_id)
    if not report or report.status != ReportStatus.approved:
        raise HTTPException(404, "Заявка не найдена")
    return report


@router.post("/{report_id}/cleanup", response_model=CleanupPublic, status_code=202)
async def submit_cleanup(
    report_id: uuid.UUID,
    background: BackgroundTasks,
    photo: UploadFile = File(...),
    user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Фото-подтверждение, что загрязнение на месте заявки убрано. Доступно для любой опубликованной точки."""
    report = db.get(Report, report_id)
    if not report or report.status != ReportStatus.approved:
        raise HTTPException(404, "Заявка не найдена или уже не на карте")

    if photo.content_type not in ALLOWED:
        raise HTTPException(415, "Допустимы JPEG, PNG, WebP")
    data = await photo.read()
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, f"Файл больше {settings.max_upload_mb} МБ")
    try:
        Image.open(io.BytesIO(data)).verify()
    except Exception:
        raise HTTPException(422, "Файл не является изображением")

    path = f"cleanup/{user.id}/{uuid.uuid4()}.{ALLOWED[photo.content_type]}"
    url = upload_photo(path, data, photo.content_type)

    submission = CleanupSubmission(report_id=report.id, user_id=user.id, photo_path=path, photo_url=url)
    db.add(submission)
    db.commit()
    background.add_task(process_cleanup, submission.id, data, photo.content_type)
    return submission


@router.delete("/mine", status_code=204)
def delete_all_mine(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """Полностью очистить историю своих заявок (необратимо)."""
    reports = db.scalars(select(Report).where(Report.user_id == user.id)).all()
    for r in reports:
        delete_photo(r.photo_path)
        db.delete(r)
    db.commit()


@router.delete("/{report_id}", status_code=204)
def delete_my_report(report_id: uuid.UUID, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """Удалить одну свою заявку из истории (необратимо)."""
    report = db.get(Report, report_id)
    if not report or report.user_id != user.id:
        raise HTTPException(404, "Заявка не найдена")
    delete_photo(report.photo_path)
    db.delete(report)
    db.commit()
