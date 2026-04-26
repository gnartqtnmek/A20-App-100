"""Declarative base, mixins, and shared enums."""
from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, MetaData, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


class UUIDMixin:
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
        default=uuid.uuid4,
    )


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class UserRole(str, enum.Enum):
    STUDENT = "student"
    LECTURER = "lecturer"
    ADMIN = "admin"


class EnrollmentStatus(str, enum.Enum):
    ACTIVE = "active"
    DROPPED = "dropped"
    COMPLETED = "completed"


class AssignmentType(str, enum.Enum):
    ESSAY = "essay"
    FILE = "file"
    QUIZ = "quiz"


class SubmissionStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    LATE = "late"
    GRADED = "graded"


class QuizQuestionType(str, enum.Enum):
    SINGLE_CHOICE = "single_choice"
    MULTI_CHOICE = "multi_choice"
    TRUE_FALSE = "true_false"


class NotificationType(str, enum.Enum):
    ASSIGNMENT_CREATED = "assignment_created"
    ASSIGNMENT_GRADED = "assignment_graded"
    DEADLINE_REMINDER = "deadline_reminder"
    COURSE_ANNOUNCEMENT = "course_announcement"
    WEEKLY_REPORT = "weekly_report"
    SYSTEM = "system"


class ChatMessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"
    SYSTEM = "system"


class MemoryType(str, enum.Enum):
    PROFILE = "profile"
    PREFERENCE = "preference"
    WEAKNESS = "weakness"
    ACHIEVEMENT = "achievement"
    FACT = "fact"


__all__ = [
    "Base",
    "UUIDMixin",
    "TimestampMixin",
    "UserRole",
    "EnrollmentStatus",
    "AssignmentType",
    "SubmissionStatus",
    "QuizQuestionType",
    "NotificationType",
    "ChatMessageRole",
    "MemoryType",
]
