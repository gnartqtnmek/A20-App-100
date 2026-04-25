"""Business logic for user operations."""
from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.base import UserRole
from app.models.user import LecturerProfile, StudentProfile, User
from app.schemas.user import UserCreate


async def get_user_or_404(db: AsyncSession, user_id: UUID) -> User:
    user = await db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


async def create_user(db: AsyncSession, payload: UserCreate) -> User:
    password_hash = hash_password(payload.password) if payload.password else None
    user = User(
        email=payload.email.strip().lower(),
        password_hash=password_hash,
        full_name=payload.full_name.strip(),
        role=payload.role,
        avatar_url=payload.avatar_url,
    )
    db.add(user)
    await db.flush()

    if payload.role == UserRole.STUDENT and payload.student_profile is not None:
        profile = StudentProfile(
            user_id=user.id,
            student_code=payload.student_profile.student_code.strip(),
            major=payload.student_profile.major,
            year=payload.student_profile.year,
            preferences=payload.student_profile.preferences,
        )
        db.add(profile)

    if payload.role == UserRole.LECTURER and payload.lecturer_profile is not None:
        profile = LecturerProfile(
            user_id=user.id,
            employee_code=payload.lecturer_profile.employee_code.strip(),
            department=payload.lecturer_profile.department,
            title=payload.lecturer_profile.title,
        )
        db.add(profile)

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User data violates uniqueness constraints",
        ) from exc

    await db.refresh(user)
    return user


async def list_users(db: AsyncSession, role: UserRole | None = None) -> list[User]:
    statement = select(User).order_by(User.created_at.desc())
    if role is not None:
        statement = statement.where(User.role == role)
    result = await db.execute(statement)
    return list(result.scalars().all())
