"""Schemas for notification APIs."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.base import NotificationType


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    type: NotificationType
    title: str
    body: str | None
    link: str | None
    metadata_: dict | None
    is_read: bool
    read_at: datetime | None
    email_sent_at: datetime | None
    created_at: datetime
    updated_at: datetime
