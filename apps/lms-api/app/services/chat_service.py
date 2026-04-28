"""Chat service: proxy to agent-api for AI responses."""
from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator
from typing import Any
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
    access_token: str,
    session_id: UUID | None,
    user_message: str,
    *,
    course_id: UUID | None = None,
) -> AsyncIterator[dict[str, Any]]:
    """Proxy stream from agent-api and persist user/assistant messages."""
    settings = get_settings()
    session = await get_or_create_session(db, user_id, session_id)

    db.add(ChatMessage(session_id=session.id, role=ChatMessageRole.USER, content=user_message))
    await db.flush()

    conversation_id = str(session.id)
    full_response = ""
    headers = {"Authorization": f"Bearer {access_token}"}

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            await client.post(
                f"{settings.agent_service_url}/v1/conversations/{conversation_id}/ensure",
                json={},
                headers=headers,
                timeout=10.0,
            )
        except Exception:
            logger.warning("Could not ensure agent conversation %s", conversation_id)

        try:
            async with client.stream(
                "POST",
                f"{settings.agent_service_url}/v1/conversations/{conversation_id}/messages/stream",
                json={"content": user_message},
                headers=headers,
                timeout=120.0,
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue

                    raw_data = line[6:].strip()
                    if raw_data == "[DONE]":
                        break

                    try:
                        payload = json.loads(raw_data)
                    except json.JSONDecodeError:
                        logger.warning("Malformed stream payload for session %s: %s", conversation_id, line)
                        continue

                    if payload.get("type") == "token":
                        text = payload.get("content", "")
                        if text:
                            full_response += text
                    yield payload
        except Exception:
            logger.exception("agent-api stream failed for session %s", conversation_id)
            if not full_response:
                full_response = "Xin loi, da xay ra loi ket noi voi tro ly AI."
            yield {
                "type": "error",
                "error_code": "AI_UNAVAILABLE",
                "message": full_response,
            }

    from sqlalchemy import func as sqlfunc

    db.add(ChatMessage(session_id=session.id, role=ChatMessageRole.ASSISTANT, content=full_response))
    session.last_active_at = sqlfunc.now()  # type: ignore[assignment]
    await db.commit()
