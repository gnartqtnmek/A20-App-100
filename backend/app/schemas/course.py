"""Schemas for course and enrollment APIs."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.base import EnrollmentStatus


class CourseCreate(BaseModel):
    code: str = Field(min_length=2, max_length=32)
    name: str = Field(min_length=3, max_length=255)
    lecturer_id: UUID
    description: str | None = None
    syllabus_md: str | None = None
    semester: str | None = Field(default=None, max_length=32)
    is_published: bool = False
    invite_code: str | None = Field(default=None, max_length=32)
    cover_image_url: str | None = Field(default=None, max_length=500)


class CourseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    description: str | None
    syllabus_md: str | None
    lecturer_id: UUID
    semester: str | None
    is_published: bool
    invite_code: str | None
    cover_image_url: str | None
    created_at: datetime
    updated_at: datetime


class EnrollmentCreate(BaseModel):
    student_id: UUID
    status: EnrollmentStatus = EnrollmentStatus.ACTIVE


class EnrollmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    course_id: UUID
    student_id: UUID
    status: EnrollmentStatus
    enrolled_at: datetime
    created_at: datetime
    updated_at: datetime


class ModuleCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    description: str | None = None
    order_index: int = Field(default=0, ge=0)


class ModuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    course_id: UUID
    title: str
    description: str | None
    order_index: int
    created_at: datetime
    updated_at: datetime


class LessonCreate(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    content_md: str | None = None
    video_url: str | None = Field(default=None, max_length=500)
    attachments: list[dict] = Field(default_factory=list)
    order_index: int = Field(default=0, ge=0)
    duration_minutes: int | None = Field(default=None, ge=0)


class LessonRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    module_id: UUID
    title: str
    content_md: str | None
    video_url: str | None
    attachments: list[dict]
    order_index: int
    duration_minutes: int | None
    created_at: datetime
    updated_at: datetime
