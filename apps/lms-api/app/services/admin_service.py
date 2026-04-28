"""Business logic for admin-only analytics and user management."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assignment import Submission
from app.models.base import EnrollmentStatus, UserRole
from app.models.chat import AgentRun, ChatMessage, ChatSession
from app.models.course import Course, CourseEnrollment
from app.models.user import StudentProfile, User


def _start_of_today_utc(now: datetime) -> datetime:
    return datetime(now.year, now.month, now.day, tzinfo=timezone.utc)


async def get_dashboard_stats(db: AsyncSession) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    today_start = _start_of_today_utc(now)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = today_start.replace(day=1)

    users_total = await db.scalar(select(func.count(User.id))) or 0
    students = await db.scalar(select(func.count(User.id)).where(User.role == UserRole.STUDENT)) or 0
    instructors = await db.scalar(select(func.count(User.id)).where(User.role == UserRole.INSTRUCTOR)) or 0
    admins = await db.scalar(select(func.count(User.id)).where(User.role == UserRole.ADMIN)) or 0
    active_users = await db.scalar(select(func.count(User.id)).where(User.is_active.is_(True))) or 0

    courses_total = await db.scalar(select(func.count(Course.id))) or 0
    courses_open = await db.scalar(select(func.count(Course.id)).where(Course.is_published.is_(True))) or 0
    courses_archived = max(courses_total - courses_open, 0)

    messages_today = await db.scalar(
        select(func.count(ChatMessage.id)).where(ChatMessage.created_at >= today_start)
    ) or 0
    submissions_today = await db.scalar(
        select(func.count(Submission.id)).where(Submission.submitted_at >= today_start)
    ) or 0
    active_users_today = await db.scalar(
        select(func.count(func.distinct(ChatSession.user_id))).where(ChatSession.last_active_at >= today_start)
    ) or 0

    month_cost = await db.scalar(
        select(func.coalesce(func.sum(AgentRun.cost_usd), 0.0)).where(
            AgentRun.created_at >= month_start
        )
    ) or 0.0
    week_cost = await db.scalar(
        select(func.coalesce(func.sum(AgentRun.cost_usd), 0.0)).where(
            AgentRun.created_at >= week_start
        )
    ) or 0.0
    today_cost = await db.scalar(
        select(func.coalesce(func.sum(AgentRun.cost_usd), 0.0)).where(
            AgentRun.created_at >= today_start
        )
    ) or 0.0

    return {
        "users": {
            "total": int(users_total),
            "students": int(students),
            "instructors": int(instructors),
            "admins": int(admins),
            "active": int(active_users),
        },
        "courses": {
            "total": int(courses_total),
            "open": int(courses_open),
            "archived": int(courses_archived),
        },
        "activity": {
            "messages_today": int(messages_today),
            "submissions_today": int(submissions_today),
            "active_users_today": int(active_users_today),
        },
        "ai_costs": {
            "this_month_usd": round(float(month_cost), 4),
            "this_week_usd": round(float(week_cost), 4),
            "today_usd": round(float(today_cost), 4),
        },
    }


async def list_admin_users(
    db: AsyncSession,
    role: UserRole | None = None,
    is_active: bool | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[int, list[dict[str, Any]]]:
    filters = []
    if role is not None:
        filters.append(User.role == role)
    if is_active is not None:
        filters.append(User.is_active.is_(is_active))
    if search:
        like = f"%{search.strip()}%"
        filters.extend([User.full_name.ilike(like) | User.email.ilike(like)])

    total_stmt = select(func.count(User.id))
    if filters:
        total_stmt = total_stmt.where(*filters)
    total = int((await db.scalar(total_stmt)) or 0)

    enrolled_count_subquery = (
        select(func.count(CourseEnrollment.id))
        .where(
            CourseEnrollment.student_id == User.id,
            CourseEnrollment.status == EnrollmentStatus.ACTIVE,
        )
        .correlate(User)
        .scalar_subquery()
    )

    stmt = (
        select(
            User,
            StudentProfile.student_code,
            enrolled_count_subquery.label("enrolled_courses_count"),
        )
        .outerjoin(StudentProfile, StudentProfile.user_id == User.id)
        .order_by(User.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    if filters:
        stmt = stmt.where(*filters)

    rows = (await db.execute(stmt)).all()

    items: list[dict[str, Any]] = []
    for user, student_code, enrolled_count in rows:
        items.append(
            {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "is_active": user.is_active,
                "created_at": user.created_at,
                "last_login_at": user.last_login_at,
                "student_id": student_code,
                "enrolled_courses_count": int(enrolled_count or 0),
            }
        )

    return total, items
