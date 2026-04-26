"""Security helpers for password hashing and JWT handling."""
from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID, uuid4

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings
from app.models.base import UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenType:
    ACCESS = "access"
    REFRESH = "refresh"


def hash_password(raw_password: str) -> str:
    return pwd_context.hash(raw_password)


def verify_password(raw_password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    return pwd_context.verify(raw_password, password_hash)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _create_token(
    *,
    subject: str,
    role: str,
    token_type: str,
    expires_delta: timedelta,
) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "role": role,
        "type": token_type,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "jti": str(uuid4()),
        "iat": int(now.timestamp()),
        "nbf": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: UUID, role: UserRole) -> str:
    settings = get_settings()
    return _create_token(
        subject=str(user_id),
        role=role.value,
        token_type=TokenType.ACCESS,
        expires_delta=timedelta(minutes=settings.access_token_minutes),
    )


def create_refresh_token(user_id: UUID, role: UserRole) -> str:
    settings = get_settings()
    return _create_token(
        subject=str(user_id),
        role=role.value,
        token_type=TokenType.REFRESH,
        expires_delta=timedelta(days=settings.refresh_token_days),
    )


def decode_token(token: str, expected_type: str | None = None) -> dict[str, Any]:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
        )
    except JWTError as exc:
        raise ValueError("Invalid token") from exc

    token_type = payload.get("type")
    if expected_type and token_type != expected_type:
        raise ValueError("Invalid token type")

    if "sub" not in payload:
        raise ValueError("Token subject is missing")

    return payload
