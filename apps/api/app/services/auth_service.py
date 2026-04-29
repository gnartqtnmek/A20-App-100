from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.roles import UserRole
from app.core.security import (
    JWTError,
    create_access_token,
    create_refresh_token,
    decode_token,
    is_refresh_token_payload,
    verify_password,
)
from app.models import User
from app.schemas.auth import AuthUser, LoginRequest, TokenResponse


def map_user_to_auth_user(user: User) -> AuthUser:
    role = UserRole(user.role)
    return AuthUser(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=role,
        is_active=user.is_active,
    )


async def login_user(payload: LoginRequest, db: AsyncSession) -> TokenResponse:
    user = await db.scalar(select(User).where(User.email == payload.email))
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id, role=user.role)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=map_user_to_auth_user(user),
    )


async def refresh_access_token(refresh_token: str, db: AsyncSession) -> TokenResponse:
    try:
        payload = decode_token(refresh_token)
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token") from exc

    if not is_refresh_token_payload(payload):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token subject")

    user = await db.scalar(select(User).where(User.id == user_id, User.is_active.is_(True)))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")

    new_access_token = create_access_token(subject=user.id, role=user.role)
    new_refresh_token = create_refresh_token(subject=user.id, role=user.role)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user=map_user_to_auth_user(user),
    )
