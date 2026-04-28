"""Admin-only routes for dashboard and user management."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import require_roles
from app.db.database import get_db
from app.models.base import UserRole
from app.models.user import User
from app.schemas.admin import (
    AdminCreateUserResponse,
    AdminDashboardRead,
    AdminUserListItem,
    AdminUserListResponse,
)
from app.schemas.user import UserCreate, UserRead
from app.services import admin_service, user_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard", response_model=AdminDashboardRead)
async def get_admin_dashboard(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> AdminDashboardRead:
    payload = await admin_service.get_dashboard_stats(db)
    return AdminDashboardRead.model_validate(payload)


@router.get("/users", response_model=AdminUserListResponse)
async def list_admin_users(
    role: UserRole | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    search: str | None = Query(default=None, min_length=1, max_length=255),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> AdminUserListResponse:
    total, items = await admin_service.list_admin_users(
        db=db,
        role=role,
        is_active=is_active,
        search=search,
        page=page,
        limit=limit,
    )
    return AdminUserListResponse(
        items=[AdminUserListItem.model_validate(item) for item in items],
        total=total,
        page=page,
        limit=limit,
    )


@router.post("/users", response_model=AdminCreateUserResponse, status_code=status.HTTP_201_CREATED)
async def create_admin_user(
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
) -> AdminCreateUserResponse:
    user = await user_service.create_user(db, payload)
    return AdminCreateUserResponse(user=UserRead.model_validate(user))
