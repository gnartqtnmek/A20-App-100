from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(subject: str, role: str) -> str:
    expires_delta = timedelta(minutes=settings.jwt_access_token_expire_minutes)
    return _create_token(
        {"sub": subject, "role": role, "token_type": "access"},
        expires_delta=expires_delta,
    )


def create_refresh_token(subject: str, role: str) -> str:
    expires_delta = timedelta(minutes=settings.jwt_refresh_token_expire_minutes)
    return _create_token(
        {"sub": subject, "role": role, "token_type": "refresh"},
        expires_delta=expires_delta,
    )


def decode_token(token: str) -> dict[str, Any]:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def _create_token(data: dict[str, Any], expires_delta: timedelta) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + expires_delta
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def is_refresh_token_payload(payload: dict[str, Any]) -> bool:
    return payload.get("token_type") == "refresh"


def is_access_token_payload(payload: dict[str, Any]) -> bool:
    return payload.get("token_type") == "access"


__all__ = [
    "JWTError",
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "hash_password",
    "is_access_token_payload",
    "is_refresh_token_payload",
    "verify_password",
]
