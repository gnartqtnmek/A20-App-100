"""API request and response schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator


class ConversationCreateRequest(BaseModel):
    course_id: str | None = None
    title: str | None = None


class ConversationEnsureRequest(BaseModel):
    course_id: str | None = None
    title: str | None = None


class MessageCreateRequest(BaseModel):
    content: str

    @field_validator("content")
    @classmethod
    def _validate_content(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Vui long nhap cau hoi")
        if len(normalized) > 2000:
            raise ValueError("Cau hoi toi da 2000 ky tu")
        return normalized


class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ConversationItemResponse(BaseModel):
    id: str
    user_id: str
    course_id: str | None = None
    title: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_message_at: datetime | None = None
    message_count: int = 0


class ConversationDetailResponse(BaseModel):
    id: str
    user_id: str
    course_id: str | None = None
    title: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_message_at: datetime | None = None
    message_count: int = 0


class PaginatedConversationsResponse(BaseModel):
    items: list[ConversationItemResponse]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool


class MessageRowResponse(BaseModel):
    conversation_id: str
    role: str  # user | assistant | tool
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class MessagesListResponse(BaseModel):
    conversation: ConversationItemResponse
    messages: list[MessageRowResponse]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool


class ConversationMessageResponse(BaseModel):
    conversation_id: str
    run_id: str
    turn_index: int
    assistant_message: str
    tool_trace_summary: list[str] = Field(default_factory=list)


class MemoryItemResponse(BaseModel):
    id: str
    mem0_memory_id: str | None = None
    memory_type: str
    content: str
    topic: str | None = None
    course_id: str | None = None
    source: str | None = None
    relevance_score: float | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    expires_at: datetime | None = None


class PaginatedMemoriesResponse(BaseModel):
    items: list[MemoryItemResponse]
    total: int
    by_type: dict[str, int] = Field(default_factory=dict)
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool
