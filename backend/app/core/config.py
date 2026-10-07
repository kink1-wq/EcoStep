from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    supabase_url: str
    supabase_service_key: str
    supabase_jwt_secret: str | None = None  # нужен только старым проектам (HS256)
    storage_bucket: str = "report-photos"
    gemini_api_key: str
    gemini_model: str = "gemini-2.5-flash"
    cors_origins: list[str] = ["http://localhost:3000"]
    max_upload_mb: int = 8
    # Пороги автомодерации
    auto_approve_confidence: float = 0.80
    auto_reject_confidence: float = 0.85


settings = Settings()
