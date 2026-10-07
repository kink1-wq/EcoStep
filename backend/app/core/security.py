import logging

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from pydantic import BaseModel
from supabase import create_client

from app.core.config import settings

log = logging.getLogger(__name__)
bearer = HTTPBearer()

# Быстрая локальная проверка: новые проекты Supabase подписывают токены асимметрично (JWKS)
_jwks = PyJWKClient(f"{settings.supabase_url}/auth/v1/.well-known/jwks.json", cache_keys=True)
# Запасной путь: спросить сам Supabase Auth — работает при любом способе подписи токенов
_sb = create_client(settings.supabase_url, settings.supabase_service_key)


class CurrentUser(BaseModel):
    id: str
    role: str = "user"


def _decode(token: str) -> dict:
    alg = jwt.get_unverified_header(token).get("alg")
    if alg == "HS256":  # старые проекты: общий секрет
        if not settings.supabase_jwt_secret:
            raise jwt.InvalidTokenError("JWT secret not configured")
        return jwt.decode(token, settings.supabase_jwt_secret, algorithms=["HS256"], audience="authenticated")
    key = _jwks.get_signing_key_from_jwt(token).key
    return jwt.decode(token, key, algorithms=["ES256", "RS256"], audience="authenticated")


def _verify_remote(token: str) -> CurrentUser:
    res = _sb.auth.get_user(token)
    user = res.user if res else None
    if not user:
        raise ValueError("Supabase не вернул пользователя")
    return CurrentUser(id=str(user.id), role=(user.app_metadata or {}).get("role", "user"))


def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> CurrentUser:
    token = creds.credentials
    try:
        payload = _decode(token)
        return CurrentUser(id=payload["sub"], role=(payload.get("app_metadata") or {}).get("role", "user"))
    except Exception as e:
        log.warning("Локальная проверка JWT не прошла (%r), проверяю через Supabase Auth", e)
    try:
        return _verify_remote(token)
    except Exception as e:
        log.warning("Supabase Auth отклонил токен: %r", e)
        raise HTTPException(401, "Недействительный токен")


def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if user.role != "admin":
        raise HTTPException(403, "Нужны права администратора")
    return user
