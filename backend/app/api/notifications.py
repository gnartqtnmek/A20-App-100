"""Notification APIs."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.notification import NotificationRead
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/me", response_model=list[NotificationRead])
async def list_my_notifications(
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[NotificationRead]:
    notifications = await notification_service.list_notifications_for_user(
        db,
        current_user.id,
        unread_only=unread_only,
    )
    return [NotificationRead.model_validate(item) for item in notifications]


@router.post("/{notification_id}/read", response_model=NotificationRead)
async def mark_my_notification_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> NotificationRead:
    notification = await notification_service.mark_notification_as_read(
        db,
        notification_id,
        current_user.id,
    )
    return NotificationRead.model_validate(notification)
