"""Business logic for authentication and RBAC session management."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import (
    TokenType,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.models.base import UserRole
from app.models.user import LecturerProfile, RefreshToken, StudentProfile, User
from app.schemas.auth import RegisterRequest, TokenPairRead


def _build_token_response(access_token: str, refresh_token: str) -> TokenPairRead:
    settings = get_settings()
    return TokenPairRead(
        token_type="bearer",
        access_token=access_token,
        refresh_token=refresh_token,
        access_token_expires_in=settings.access_token_minutes * 60,
        refresh_token_expires_in=settings.refresh_token_days * 24 * 60 * 60,
    )


async def _issue_token_pair(
    db: AsyncSession,
    user: User,
    *,
    user_agent: str | None,
    ip_address: str | None,
) -> TokenPairRead:
    settings = get_settings()
    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id, user.role)

    refresh_record = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(refresh_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_days),
        user_agent=user_agent,
        ip_address=ip_address,
    )
    db.add(refresh_record)
    await db.flush()

    return _build_token_response(access_token, refresh_token)


async def register(
    db: AsyncSession,
    payload: RegisterRequest,
    *,
    user_agent: str | None,
    ip_address: str | None,
) -> tuple[User, TokenPairRead]:
    if payload.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin account cannot be self-registered",
        )

    user = User(
        email=payload.email.strip().lower(),
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=payload.role,
        avatar_url=payload.avatar_url,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    if payload.role == UserRole.STUDENT and payload.student_profile is not None:
        db.add(
            StudentProfile(
                user_id=user.id,
                student_code=payload.student_profile.student_code.strip(),
                major=payload.student_profile.major,
                year=payload.student_profile.year,
                preferences=payload.student_profile.preferences,
            )
        )

    if payload.role == UserRole.LECTURER and payload.lecturer_profile is not None:
        db.add(
            LecturerProfile(
                user_id=user.id,
                employee_code=payload.lecturer_profile.employee_code.strip(),
                department=payload.lecturer_profile.department,
                title=payload.lecturer_profile.title,
            )
        )

    tokens = await _issue_token_pair(
        db,
        user,
        user_agent=user_agent,
        ip_address=ip_address,
    )

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or profile identifiers already exist",
        ) from exc

    await db.refresh(user)
    return user, tokens


async def login(
    db: AsyncSession,
    *,
    email: str,
    password: str,
    user_agent: str | None,
    ip_address: str | None,
) -> tuple[User, TokenPairRead]:
    stmt = select(User).where(User.email == email.strip().lower())
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")

    user.last_login_at = datetime.now(timezone.utc)
    tokens = await _issue_token_pair(
        db,
        user,
        user_agent=user_agent,
        ip_address=ip_address,
    )

    await db.commit()
    await db.refresh(user)
    return user, tokens


async def refresh_session(
    db: AsyncSession,
    *,
    refresh_token: str,
    user_agent: str | None,
    ip_address: str | None,
) -> TokenPairRead:
    try:
        payload = decode_token(refresh_token, expected_type=TokenType.REFRESH)
        user_id = UUID(payload["sub"])
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    token_hash = hash_refresh_token(refresh_token)
    now = datetime.now(timezone.utc)

    stmt = select(RefreshToken).where(
        RefreshToken.token_hash == token_hash,
        RefreshToken.revoked_at.is_(None),
    )
    result = await db.execute(stmt)
    token_record = result.scalar_one_or_none()

    if token_record is None or token_record.expires_at <= now or token_record.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is expired or revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not available")

    token_record.revoked_at = now
    tokens = await _issue_token_pair(
        db,
        user,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    await db.commit()

    return tokens


async def revoke_refresh_token(db: AsyncSession, refresh_token: str) -> None:
    token_hash = hash_refresh_token(refresh_token)
    stmt = select(RefreshToken).where(
        RefreshToken.token_hash == token_hash,
        RefreshToken.revoked_at.is_(None),
    )
    result = await db.execute(stmt)
    token_record = result.scalar_one_or_none()

    if token_record is None:
        return

    token_record.revoked_at = datetime.now(timezone.utc)
    await db.commit()
