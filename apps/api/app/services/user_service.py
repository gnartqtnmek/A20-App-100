from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.roles import UserRole
from app.core.security import hash_password
from app.models import User
from app.schemas.user import UserCreate, UserOut, UserProfileUpdate, UserUpdate


def map_user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=UserRole(user.role),
        department_id=user.department_id,
        program_id=user.program_id,
        is_active=user.is_active,
    )


async def create_user(payload: UserCreate, db: AsyncSession) -> UserOut:
    existing = await db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User email already exists")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        role=payload.role.value,
        department_id=payload.department_id,
        program_id=payload.program_id,
        is_active=payload.is_active,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return map_user_out(user)


async def get_user_by_id(user_id: str, db: AsyncSession) -> User:
    user = await db.scalar(select(User).where(User.id == user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


async def update_user(user_id: str, payload: UserUpdate, db: AsyncSession) -> UserOut:
    user = await get_user_by_id(user_id, db)

    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.role is not None:
        user.role = payload.role.value
    if payload.department_id is not None:
        user.department_id = payload.department_id
    if payload.program_id is not None:
        user.program_id = payload.program_id
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password is not None:
        user.password_hash = hash_password(payload.password)

    await db.commit()
    await db.refresh(user)
    return map_user_out(user)


async def delete_user(user_id: str, db: AsyncSession) -> None:
    user = await get_user_by_id(user_id, db)
    await db.delete(user)
    await db.commit()


async def update_profile(current_user: User, payload: UserProfileUpdate, db: AsyncSession) -> UserOut:
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    await db.commit()
    await db.refresh(current_user)
    return map_user_out(current_user)


async def list_users(page: int, limit: int, db: AsyncSession) -> tuple[list[UserOut], int]:
    page = max(1, page)
    limit = max(1, min(limit, 100))
    offset = (page - 1) * limit

    rows = await db.scalars(select(User).offset(offset).limit(limit).order_by(User.created_at.desc()))
    total = await db.scalar(select(func.count()).select_from(User))
    items = [map_user_out(user) for user in rows.all()]
    return items, int(total or 0)
