"""Response/request schemas for the Agent tool endpoints.

These are deliberately *flat* (no nested models that the Agent has to
unpack). The Agent will paste these straight into a system prompt or use
them as ``ToolMessage`` content, so we keep field names self-documenting.
"""
from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


# ---------- get_my_grades ----------

class GradeForAgent(BaseModel):
    course_id: UUID
    course_code: str
    course_name: str
    assignment_id: UUID
    assignment_title: str
    score: float
    max_score: float
    weight: float
    recorded_at: datetime
    percent: float = Field(description="score / max_score * 100, rounded to 2 decimals")


# ---------- get_my_assignments ----------

class AssignmentForAgent(BaseModel):
    id: UUID
    title: str
    type: Literal["essay", "file", "quiz"]
    due_at: datetime | None
    course_id: UUID
    course_code: str
    course_name: str
    max_score: float
    weight: float
    submission_status: Literal["draft", "submitted", "late", "graded"] | None = Field(
        description="Null if the user has never submitted to this assignment."
    )
    submission_score: float | None
    is_overdue: bool


# ---------- get_lesson_content ----------

class LessonAttachmentForAgent(BaseModel):
    name: str
    url: str
    mime: str | None = None
    size: int | None = None


class LessonForAgent(BaseModel):
    id: UUID
    title: str
    content_md: str | None
    video_url: str | None
    duration_minutes: int | None
    module_title: str
    course_id: UUID
    course_code: str
    course_name: str
    attachments: list[LessonAttachmentForAgent]


# ---------- search_knowledge ----------

class KnowledgeSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    embedding: list[float] | None = Field(
        default=None,
        description=(
            "Optional precomputed embedding from the Agent. "
            "When supplied, vector cosine search is used; otherwise we fall "
            "back to trigram text search on the chunk content."
        ),
    )
    course_id: UUID | None = Field(
        default=None,
        description="Restrict the search to lessons inside this course.",
    )
    limit: int = Field(default=5, ge=1, le=20)


class KnowledgeMatchForAgent(BaseModel):
    chunk_id: UUID
    lesson_id: UUID
    lesson_title: str
    course_id: UUID
    course_code: str
    course_name: str
    chunk_index: int
    content: str
    similarity: float | None = Field(
        description="Cosine similarity (0..1) when vector search is used, else null."
    )


class KnowledgeSearchResponse(BaseModel):
    matches: list[KnowledgeMatchForAgent]
    used_vector_search: bool
    note: str | None = None
