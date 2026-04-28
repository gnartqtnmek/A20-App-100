"""Schemas for admin-only APIs."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.base import UserRole
from app.schemas.user import UserRead


class AdminUsersStats(BaseModel):
    total: int
    students: int
    instructors: int
    admins: int
    active: int


class AdminCoursesStats(BaseModel):
    total: int
    open: int
    archived: int


class AdminActivityStats(BaseModel):
    messages_today: int
    submissions_today: int
    active_users_today: int


class AdminAICostStats(BaseModel):
    this_month_usd: float
    this_week_usd: float
    today_usd: float


class AdminDashboardRead(BaseModel):
    users: AdminUsersStats
    courses: AdminCoursesStats
    activity: AdminActivityStats
    ai_costs: AdminAICostStats


class AdminUserListItem(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None
    student_id: str | None
    enrolled_courses_count: int


class AdminUserListResponse(BaseModel):
    items: list[AdminUserListItem]
    total: int
    page: int
    limit: int


class AdminCreateUserResponse(BaseModel):
    user: UserRead
