"""Pydantic schemas for Chat sessions and messages."""
from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ChatSessionCreate(BaseModel):
    title: str | None = Field(None, max_length=255)
    course_id: uuid.UUID | None = None


class ChatSessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: str | None
    last_active_at: datetime
    summarised_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ChatMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    session_id: uuid.UUID
    role: str
    content: str
    tool_name: str | None
    extra: dict | None
    tokens_used: int | None
    created_at: datetime


class ChatMessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=32_000)


class ChatStreamChunk(BaseModel):
    """One SSE data payload during streaming."""

    type: str  # "delta" | "done" | "error"
    delta: str | None = None
    message_id: str | None = None
    error: str | None = None


class AgentRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    session_id: uuid.UUID
    input_text: str
    output_text: str | None
    tools_called: list[dict]
    model: str | None
    input_tokens: int | None
    output_tokens: int | None
    latency_ms: int | None
    cost_usd: float | None
    created_at: datetime
