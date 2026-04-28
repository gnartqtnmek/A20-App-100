"""Business logic for notification APIs."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import EnrollmentStatus, NotificationType
from app.models.course import CourseEnrollment
from app.models.notification import Notification

logger = logging.getLogger(__name__)


async def list_notifications_for_user(
    db: AsyncSession,
    user_id: UUID,
    unread_only: bool = False,
) -> list[Notification]:
    statement = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        statement = statement.where(Notification.is_read.is_(False))
    statement = statement.order_by(Notification.created_at.desc())
    result = await db.execute(statement)
    return list(result.scalars().all())


async def mark_notification_as_read(
    db: AsyncSession,
    notification_id: UUID,
    user_id: UUID,
) -> Notification:
    notification = await db.get(Notification, notification_id)
    if notification is None or notification.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    notification.is_read = True
    notification.read_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(notification)
    return notification


async def create_notification(
    db: AsyncSession,
    *,
    user_id: UUID,
    type: NotificationType,
    title: str,
    body: str | None = None,
    link: str | None = None,
    metadata: dict | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        link=link,
        metadata_=metadata,
    )
    db.add(notification)
    return notification


async def notify_assignment_created(
    db: AsyncSession,
    *,
    course_id: UUID,
    assignment_id: UUID,
    assignment_title: str,
    course_name: str,
    due_at: datetime | None,
) -> None:
    """Create in-app notifications for all active students enrolled in the course."""
    stmt = select(CourseEnrollment).where(
        CourseEnrollment.course_id == course_id,
        CourseEnrollment.status == EnrollmentStatus.ACTIVE,
    )
    enrollments = list((await db.execute(stmt)).scalars().all())

    due_str = due_at.strftime("%d/%m/%Y %H:%M") if due_at else "không có hạn"
    for enrollment in enrollments:
        await create_notification(
            db,
            user_id=enrollment.student_id,
            type=NotificationType.ASSIGNMENT_CREATED,
            title=f"Bài tập mới: {assignment_title}",
            body=f"Môn {course_name} vừa có bài tập mới. Hạn nộp: {due_str}.",
            link=f"/assignments/{assignment_id}",
            metadata={"assignment_id": str(assignment_id), "course_id": str(course_id)},
        )

    if enrollments:
        try:
            await db.commit()
        except Exception:
            await db.rollback()
            logger.warning(
                "Failed to commit assignment-created notifications for course %s", course_id
            )


async def notify_submission_graded(
    db: AsyncSession,
    *,
    student_id: UUID,
    assignment_id: UUID,
    assignment_title: str,
    score: float,
    max_score: float,
) -> None:
    """Create a notification for the student whose submission was graded."""
    pct = round(score / max_score * 100, 1) if max_score else 0.0
    await create_notification(
        db,
        user_id=student_id,
        type=NotificationType.ASSIGNMENT_GRADED,
        title=f"Bài tập đã được chấm: {assignment_title}",
        body=f"Điểm của bạn: {score}/{max_score} ({pct}%).",
        link=f"/assignments/{assignment_id}",
        metadata={
            "assignment_id": str(assignment_id),
            "score": score,
            "max_score": max_score,
        },
    )
    try:
        await db.commit()
    except Exception:
        await db.rollback()
        logger.warning(
            "Failed to commit graded notification for student %s", student_id
        )
