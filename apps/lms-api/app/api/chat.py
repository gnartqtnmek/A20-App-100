"""Chat API: REST + SSE proxy for agent stream contract."""
from __future__ import annotations

import json
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.core.security import create_access_token
from app.db.database import get_db
from app.models.user import User
from app.schemas.chat import ChatMessageCreate, ChatMessageRead, ChatSessionCreate, ChatSessionRead
from app.services import chat_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/sessions", response_model=ChatSessionRead, status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatSessionRead:
    session = await chat_service.get_or_create_session(
        db,
        current_user.id,
        None,
        title=payload.title,
    )
    await db.commit()
    await db.refresh(session)
    return ChatSessionRead.model_validate(session)


@router.get("/sessions", response_model=list[ChatSessionRead])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ChatSessionRead]:
    sessions = await chat_service.list_sessions(db, current_user.id)
    return [ChatSessionRead.model_validate(s) for s in sessions]


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageRead])
async def get_messages(
    session_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ChatMessageRead]:
    messages = await chat_service.get_session_messages(db, session_id, current_user.id, limit=limit)
    return [ChatMessageRead.model_validate(m) for m in messages]


@router.post("/sessions/{session_id}/messages/stream")
async def stream_message(
    session_id: UUID,
    payload: ChatMessageCreate,
    course_id: UUID | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Stream assistant response using the same SSE event contract as agent-api."""

    async def _event_stream():
        access_token = create_access_token(current_user.id, current_user.role)
        try:
            async for event in chat_service.stream_chat(
                db,
                current_user.id,
                access_token,
                session_id,
                payload.content,
                course_id=course_id,
            ):
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as exc:
            logger.exception("stream_chat error for user %s", current_user.id)
            error_payload = {
                "type": "error",
                "error_code": "AI_UNAVAILABLE",
                "message": str(exc),
            }
            yield f"data: {json.dumps(error_payload, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        _event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageRead)
async def send_message(
    session_id: UUID,
    payload: ChatMessageCreate,
    course_id: UUID | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ChatMessageRead:
    """Non-streaming endpoint: aggregate token events then return latest assistant message."""
    access_token = create_access_token(current_user.id, current_user.role)
    async for _event in chat_service.stream_chat(
        db,
        current_user.id,
        access_token,
        session_id,
        payload.content,
        course_id=course_id,
    ):
        # Streaming service already persists final assistant message; ignore intermediate events here.
        pass

    from sqlalchemy import select

    from app.models.base import ChatMessageRole
    from app.models.chat import ChatMessage

    stmt = (
        select(ChatMessage)
        .where(
            ChatMessage.session_id == session_id,
            ChatMessage.role == ChatMessageRole.ASSISTANT,
        )
        .order_by(ChatMessage.created_at.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    msg = result.scalar_one_or_none()
    if msg is None:
        raise HTTPException(status_code=500, detail="Failed to retrieve assistant message")
    return ChatMessageRead.model_validate(msg)
