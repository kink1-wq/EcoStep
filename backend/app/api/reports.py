import io
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile
from PIL import Image
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import CurrentUser, get_active_user, get_current_user
from app.database.session import get_db
from app.models.cleanup import CleanupStatus, CleanupSubmission
from app.models.report import Report, ReportStatus
from app.models.social import ReportFlag, ReportSupport
from app.schemas.cleanup import CleanupPublic
from app.schemas.report import ArchiveItem, CountResult, FlagBody, ReportPublic
from app.services.exif import extract_gps
from app.services.geo import bbox, haversine_m
from app.services.limits import check_rate_limit
from app.services.moderation import process_cleanup, process_report
from app.services.storage import delete_photo, upload_photo

router = APIRouter(prefix="/api/reports", tags=["reports"])

ALLOWED = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


# ---------- общие помощники ----------

def _visible(q):
    """Только подтверждённые точки, не скрытые жалобами (скрывает достаточное число жалоб — до решения администратора)."""
    hidden = select(ReportFlag.report_id).group_by(ReportFlag.report_id).having(func.count() >= settings.flag_hide_threshold)
    return q.where(Report.status == ReportStatus.approved, ~Report.id.in_(hidden))


def _with_counts(db: Session, reports: list[Report]) -> list[ReportPublic]:
    """Добавляет к заявкам число голосов «Тоже вижу»."""
    ids = [r.id for r in reports]
    counts: dict = {}
    if ids:
        counts = dict(
            db.execute(
                select(ReportSupport.report_id, func.count()).where(ReportSupport.report_id.in_(ids)).group_by(ReportSupport.report_id)
            ).all()
        )
    return [ReportPublic.model_validate(r).model_copy(update={"support_count": counts.get(r.id, 0)}) for r in reports]


async def _read_valid_image(photo: UploadFile) -> bytes:
    if photo.content_type not in ALLOWED:
        raise HTTPException(415, "Допустимы JPEG, PNG, WebP")
    data = await photo.read()
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(413, f"Файл больше {settings.max_upload_mb} МБ")
    try:
        Image.open(io.BytesIO(data)).verify()
    except Exception:
        raise HTTPException(422, "Файл не является изображением")
    return data


# ---------- создание заявки ----------

@router.post("", response_model=ReportPublic, status_code=202)
async def create_report(
    background: BackgroundTasks,
    photo: UploadFile = File(...),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    comment: str | None = Form(None, max_length=500),
    user: CurrentUser = Depends(get_active_user),
    db: Session = Depends(get_db),
):
    """Принимает фото + GPS от фронтенда (или берёт GPS из EXIF), запускает ИИ-модерацию."""
    check_rate_limit(db, user.id)
    data = await _read_valid_image(photo)

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


# ---------- публичные списки (статические пути — раньше «/{report_id}») ----------

@router.get("", response_model=list[ReportPublic])
def list_public(
    min_lat: float | None = None, max_lat: float | None = None,
    min_lon: float | None = None, max_lon: float | None = None,
    category: str | None = None,
    limit: int = Query(500, le=1000),
    db: Session = Depends(get_db),
):
    """Публичные точки для карты (только approved), с фильтром по видимой области."""
    q = _visible(select(Report))
    if None not in (min_lat, max_lat, min_lon, max_lon):
        q = q.where(Report.latitude.between(min_lat, max_lat), Report.longitude.between(min_lon, max_lon))
    if category:
        q = q.where(Report.category == category)
    return _with_counts(db, list(db.scalars(q.order_by(Report.created_at.desc()).limit(limit)).all()))


@router.get("/mine", response_model=list[ReportPublic])
def list_mine(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    q = select(Report).where(Report.user_id == user.id).order_by(Report.created_at.desc())
    return _with_counts(db, list(db.scalars(q).all()))


@router.get("/nearby", response_model=list[ReportPublic])
def nearby(
    lat: float, lng: float,
    radius: int | None = Query(None, ge=5, le=500),
    db: Session = Depends(get_db),
):
    """Уже отмеченные точки рядом (по умолчанию в радиусе ~30 м) — чтобы не плодить дубликаты."""
    r = radius or settings.duplicate_radius_m
    min_lat, max_lat, min_lon, max_lon = bbox(lat, lng, r)
    q = _visible(select(Report)).where(
        Report.latitude.between(min_lat, max_lat), Report.longitude.between(min_lon, max_lon)
    )
    found = [(haversine_m(lat, lng, x.latitude, x.longitude), x) for x in db.scalars(q).all()]
    found = sorted((t for t in found if t[0] <= r), key=lambda t: t[0])
    return _with_counts(db, [x for _, x in found[:10]])


@router.get("/archive", response_model=list[ArchiveItem])
def archive(limit: int = Query(24, ge=1, le=100), db: Session = Depends(get_db)):
    """Убранные места: фото «до» и, если уборку подтверждали фото, — «после»."""
    reports = db.scalars(
        select(Report)
        .where(Report.status == ReportStatus.resolved)
        .order_by(Report.resolved_at.desc().nulls_last(), Report.created_at.desc())
        .limit(limit)
    ).all()
    after: dict = {}
    if reports:
        subs = db.scalars(
            select(CleanupSubmission)
            .where(CleanupSubmission.report_id.in_([r.id for r in reports]), CleanupSubmission.status == CleanupStatus.confirmed)
            .order_by(CleanupSubmission.created_at.desc())
        ).all()
        for s in subs:
            after.setdefault(s.report_id, s.photo_url)  # берём самое свежее подтверждение
    return [
        ArchiveItem(
            id=r.id, latitude=r.latitude, longitude=r.longitude, category=r.category,
            description=r.description, description_kk=r.description_kk, photo_url=r.photo_url,
            after_photo_url=after.get(r.id), created_at=r.created_at, resolved_at=r.resolved_at,
        )
        for r in reports
    ]


@router.delete("/mine", status_code=204)
def delete_all_mine(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """Полностью очистить историю своих заявок (необратимо)."""
    reports = db.scalars(select(Report).where(Report.user_id == user.id)).all()
    for r in reports:
        delete_photo(r.photo_path)
        db.delete(r)
    db.commit()


# ---------- одна заявка ----------

@router.get("/{report_id}", response_model=ReportPublic)
def get_report(report_id: uuid.UUID, db: Session = Depends(get_db)):
    report = db.scalar(_visible(select(Report)).where(Report.id == report_id))
    if not report:
        raise HTTPException(404, "Заявка не найдена")
    return _with_counts(db, [report])[0]


@router.delete("/{report_id}", status_code=204)
def delete_my_report(report_id: uuid.UUID, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """Удалить одну свою заявку из истории (необратимо)."""
    report = db.get(Report, report_id)
    if not report or report.user_id != user.id:
        raise HTTPException(404, "Заявка не найдена")
    delete_photo(report.photo_path)
    db.delete(report)
    db.commit()


# ---------- «Тоже вижу» и жалобы ----------

def _get_public_report_or_404(db: Session, report_id: uuid.UUID) -> Report:
    report = db.scalar(_visible(select(Report)).where(Report.id == report_id))
    if not report:
        raise HTTPException(404, "Заявка не найдена или уже не на карте")
    return report


@router.post("/{report_id}/support", response_model=CountResult)
def support_report(report_id: uuid.UUID, user: CurrentUser = Depends(get_active_user), db: Session = Depends(get_db)):
    """«Тоже вижу»: подтвердить, что проблема действительно есть. Один голос на точку."""
    report = _get_public_report_or_404(db, report_id)
    if report.user_id == user.id:
        raise HTTPException(400, "Это ваша собственная заявка.")
    db.add(ReportSupport(report_id=report.id, user_id=user.id))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Вы уже подтверждали эту точку.")
    count = db.scalar(select(func.count()).select_from(ReportSupport).where(ReportSupport.report_id == report.id)) or 0
    return CountResult(count=count)


@router.post("/{report_id}/flag", response_model=CountResult)
def flag_report(
    report_id: uuid.UUID, body: FlagBody, user: CurrentUser = Depends(get_active_user), db: Session = Depends(get_db)
):
    """Пожаловаться на точку. Достаточное число жалоб скрывает её с карты до проверки администратором."""
    report = _get_public_report_or_404(db, report_id)
    if report.user_id == user.id:
        raise HTTPException(400, "Нельзя пожаловаться на собственную заявку.")
    db.add(ReportFlag(report_id=report.id, user_id=user.id, reason=(body.reason or None)))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Вы уже отправляли жалобу на эту точку.")
    count = db.scalar(select(func.count()).select_from(ReportFlag).where(ReportFlag.report_id == report.id)) or 0
    return CountResult(count=count)


# ---------- подтверждение уборки ----------

@router.post("/{report_id}/cleanup", response_model=CleanupPublic, status_code=202)
async def submit_cleanup(
    report_id: uuid.UUID,
    background: BackgroundTasks,
    photo: UploadFile = File(...),
    latitude: float | None = Form(None),
    longitude: float | None = Form(None),
    user: CurrentUser = Depends(get_active_user),
    db: Session = Depends(get_db),
):
    """Фото-подтверждение, что загрязнение убрано. Нужно находиться не дальше 1 км от точки (администраторам — не обязательно)."""
    report = _get_public_report_or_404(db, report_id)
    check_rate_limit(db, user.id)

    if user.role != "admin":
        if latitude is None or longitude is None:
            raise HTTPException(422, "Не удалось определить ваше местоположение: разрешите доступ к геопозиции.")
        distance = haversine_m(latitude, longitude, report.latitude, report.longitude)
        if distance > settings.cleanup_max_distance_m:
            raise HTTPException(
                403,
                f"Вы слишком далеко от точки ({round(distance)} м). "
                f"Подтвердить уборку можно, находясь не дальше {settings.cleanup_max_distance_m} м от места.",
            )

    data = await _read_valid_image(photo)
    path = f"cleanup/{user.id}/{uuid.uuid4()}.{ALLOWED[photo.content_type]}"
    url = upload_photo(path, data, photo.content_type)

    submission = CleanupSubmission(report_id=report.id, user_id=user.id, photo_path=path, photo_url=url)
    db.add(submission)
    db.commit()
    background.add_task(process_cleanup, submission.id, data, photo.content_type)
    return submission
