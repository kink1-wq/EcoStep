import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import CurrentUser, get_current_user
from app.database.session import get_db
from app.models.cleanup import CleanupSubmission
from app.models.report import Report
from app.schemas.cleanup import CleanupMine
from app.services.storage import delete_photo

router = APIRouter(prefix="/api/cleanups", tags=["cleanups"])


@router.get("/mine", response_model=list[CleanupMine])
def list_my_cleanups(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """Заявки на уборку, отправленные текущим пользователем (для раздела «Мои заявки»)."""
    q = (
        select(CleanupSubmission, Report)
        .join(Report, Report.id == CleanupSubmission.report_id)
        .where(CleanupSubmission.user_id == user.id)
        .order_by(CleanupSubmission.created_at.desc())
    )
    return [
        CleanupMine(
            id=sub.id, report_id=sub.report_id, photo_url=sub.photo_url, status=sub.status,
            created_at=sub.created_at, report_photo_url=report.photo_url,
            report_category=report.category, report_description=report.description,
            report_description_kk=report.description_kk,
        )
        for sub, report in db.execute(q).all()
    ]


@router.delete("/mine", status_code=204)
def delete_all_my_cleanups(user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """Очистить свою историю заявок на уборку (сами точки на карте это не меняет)."""
    subs = db.scalars(select(CleanupSubmission).where(CleanupSubmission.user_id == user.id)).all()
    for s in subs:
        delete_photo(s.photo_path)
        db.delete(s)
    db.commit()


@router.delete("/{submission_id}", status_code=204)
def delete_my_cleanup(
    submission_id: uuid.UUID, user: CurrentUser = Depends(get_current_user), db: Session = Depends(get_db)
):
    sub = db.get(CleanupSubmission, submission_id)
    if not sub or sub.user_id != user.id:
        raise HTTPException(404, "Заявка не найдена")
    delete_photo(sub.photo_path)
    db.delete(sub)
    db.commit()
