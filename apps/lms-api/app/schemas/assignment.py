"""Schemas for assignment and submission APIs."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.base import AssignmentType, SubmissionStatus


class AssignmentCreate(BaseModel):
    course_id: UUID
    title: str = Field(min_length=3, max_length=255)
    description: str | None = None
    type: AssignmentType
    due_at: datetime | None = None
    max_score: float = Field(default=10.0, gt=0)
    weight: float = Field(default=1.0, gt=0)
    rubric: list[dict] | None = None
    attachments: list[dict] = Field(default_factory=list)
    time_limit_minutes: int | None = Field(default=None, gt=0)
    allow_late: bool = True
    is_published: bool = False


class AssignmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    course_id: UUID
    title: str
    description: str | None
    type: AssignmentType
    due_at: datetime | None
    max_score: float
    weight: float
    rubric: list[dict] | None
    attachments: list[dict]
    time_limit_minutes: int | None
    allow_late: bool
    is_published: bool
    created_at: datetime
    updated_at: datetime


class SubmissionCreate(BaseModel):
    student_id: UUID
    content: str | None = None
    file_url: str | None = None
    file_name: str | None = None
    quiz_answers: dict | None = None


class SubmissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    assignment_id: UUID
    student_id: UUID
    content: str | None
    file_url: str | None
    file_name: str | None
    quiz_answers: dict | None
    status: SubmissionStatus
    submitted_at: datetime | None
    score: float | None
    feedback: str | None
    graded_at: datetime | None
    graded_by: UUID | None
    attempt_count: int
    created_at: datetime
    updated_at: datetime


class GradeCreate(BaseModel):
    score: float = Field(ge=0)
    feedback: str | None = None


class GradeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    student_id: UUID
    course_id: UUID
    assignment_id: UUID
    score: float
    max_score: float
    weight: float
    recorded_at: datetime
    created_at: datetime
    updated_at: datetime
