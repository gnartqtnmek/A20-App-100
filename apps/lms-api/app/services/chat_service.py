"""Chat service: proxy to agent-api for AI responses.

Flow per user turn:
  1. Load/create ChatSession in lms-api DB.
  2. Persist user message.
  3. Ensure conversation exists in agent-api (get_or_create by session UUID).
  4. Stream response from agent-api, translate SSE format.
  5. Persist assistant message.
"""
from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.base import ChatMessageRole
from app.models.chat import ChatMessage, ChatSession

logger = logging.getLogger(__name__)


async def get_or_create_session(
    db: AsyncSession,
    user_id: UUID,
    session_id: UUID | None,
    *,
    title: str | None = None,
) -> ChatSession:
    if session_id:
        session = await db.get(ChatSession, session_id)
        if session and session.user_id == user_id:
            return session

    session = ChatSession(user_id=user_id, title=title)
    db.add(session)
    await db.flush()
    return session


async def list_sessions(db: AsyncSession, user_id: UUID) -> list[ChatSession]:
    stmt = (
        select(ChatSession)
        .where(ChatSession.user_id == user_id)
        .order_by(ChatSession.last_active_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_session_messages(
    db: AsyncSession,
    session_id: UUID,
    user_id: UUID,
    *,
    limit: int = 50,
) -> list[ChatMessage]:
    stmt = (
        select(ChatMessage)
        .join(ChatSession)
        .where(
            ChatMessage.session_id == session_id,
            ChatSession.user_id == user_id,
        )
        .order_by(ChatMessage.created_at.asc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def stream_chat(
    db: AsyncSession,
    user_id: UUID,
    session_id: UUID | None,
    user_message: str,
    *,
    course_id: UUID | None = None,
) -> AsyncIterator[str]:
    """Proxy to agent-api: yield text chunks, persist messages to lms-api DB."""
    s = get_settings()
    session = await get_or_create_session(db, user_id, session_id)

    # Persist user message in lms-api DB
    db.add(ChatMessage(session_id=session.id, role=ChatMessageRole.USER, content=user_message))
    await db.flush()

    conversation_id = str(session.id)
    full_response = ""

    async with httpx.AsyncClient(timeout=120.0) as client:
        # Ensure a matching conversation exists in agent-api
        try:
            await client.post(
                f"{s.agent_service_url}/v1/conversations/{conversation_id}/ensure",
                json={"user_id": str(user_id)},
                timeout=10.0,
            )
        except Exception:
            logger.warning("Could not ensure agent conversation %s", conversation_id)

        # Stream from agent-api and translate SSE format
        try:
            async with client.stream(
                "POST",
                f"{s.agent_service_url}/v1/conversations/{conversation_id}/messages/stream",
                json={"user_id": str(user_id), "content": user_message},
                timeout=120.0,
            ) as response:
                response.raise_for_status()
                current_event = ""
                async for line in response.aiter_lines():
                    if line.startswith("event: "):
                        current_event = line[7:].strip()
                    elif line.startswith("data: ") and current_event == "chunk":
                        try:
                            payload = json.loads(line[6:])
                            text = payload.get("text", "")
                            if text:
                                full_response += text
                                yield text
                        except json.JSONDecodeError:
                            logger.warning(
                                "Failed to parse chunk event payload for session %s: %s",
                                conversation_id,
                                line,
                            )
                        except Exception:
                            logger.exception(
                                "Unexpected chunk handling error for session %s",
                                conversation_id,
                            )
                    elif not line:
                        current_event = ""
        except Exception:
            logger.exception("agent-api stream failed for session %s", conversation_id)
            if not full_response:
                yield "Xin lỗi, đã xảy ra lỗi kết nối với trợ lý AI."
                full_response = "Xin lỗi, đã xảy ra lỗi kết nối với trợ lý AI."

    # Persist assistant message
    from sqlalchemy import func as sqlfunc

    db.add(ChatMessage(session_id=session.id, role=ChatMessageRole.ASSISTANT, content=full_response))
    session.last_active_at = sqlfunc.now()  # type: ignore[assignment]
    await db.commit()
