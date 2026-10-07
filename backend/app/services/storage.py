from supabase import create_client

from app.core.config import settings

_client = create_client(settings.supabase_url, settings.supabase_service_key)


def upload_photo(path: str, data: bytes, content_type: str) -> str:
    """Кладёт фото в Supabase Storage (бакет должен быть public), возвращает URL."""
    bucket = _client.storage.from_(settings.storage_bucket)
    bucket.upload(path, data, {"content-type": content_type})
    return bucket.get_public_url(path)


def delete_photo(path: str) -> None:
    """Удаляет фото из Supabase Storage. Не критично, если файла уже нет."""
    try:
        _client.storage.from_(settings.storage_bucket).remove([path])
    except Exception:
        pass
