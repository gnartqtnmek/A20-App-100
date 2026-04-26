"""Business logic for notification APIs."""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


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
