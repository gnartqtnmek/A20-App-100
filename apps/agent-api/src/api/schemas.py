"""API request and response schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ConversationCreateRequest(BaseModel):
    user_id: str
    title: str | None = None


class ConversationEnsureRequest(BaseModel):
    user_id: str
    title: str | None = None


class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class MessageCreateRequest(BaseModel):
    user_id: str
    content: str


class MessageRowResponse(BaseModel):
    """Message response in API format (converted from LangGraph format)."""
    conversation_id: str
    role: str  # "user" | "assistant" | "tool"
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class ConversationMessageResponse(BaseModel):
    conversation_id: str
    run_id: str
    turn_index: int
    assistant_message: str
    tool_trace_summary: list[str] = Field(default_factory=list)
