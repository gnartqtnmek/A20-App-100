"""Conversation and message routes."""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from ...infra.settings import get_settings
from ..deps import get_container, normalize_record
from ..schemas import (
    ConversationCreateRequest,
    ConversationMessageResponse,
    ConversationResponse,
    MessageCreateRequest,
    MessageRowResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1")


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(payload: ConversationCreateRequest, request: Request):
    container = get_container(request)
    conversation = await container.conversations.create_conversation(
        user_id=payload.user_id,
        title=payload.title,
    )
    return ConversationResponse.model_validate(normalize_record(conversation))


@router.get("/users/{user_id}/conversations", response_model=list[ConversationResponse])
async def list_conversations(user_id: str, request: Request):
    container = get_container(request)
    rows = await container.conversations.list_conversations(user_id)
    return [ConversationResponse.model_validate(normalize_record(row)) for row in rows]


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageRowResponse])
async def list_messages(
    conversation_id: str,
    request: Request,
    user_id: str = Query(...),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    container = get_container(request)
    try:
        messages = await container.conversations.list_messages(
            conversation_id=conversation_id,
            user_id=user_id,
            limit=limit,
            offset=offset,
        )
        
        # Convert simplified format to API format
        result = []
        for msg in messages:
            role_map = {
                "user": "user",
                "assistant": "assistant",
                "tool": "tool"
            }
            
            role = role_map.get(msg.get("role"), "user")
            content = msg.get("content", "")
            
            # Extract metadata for frontend
            metadata = {}
            if role == "assistant":
                tool_calls = msg.get("tool_calls")
                if tool_calls:
                    metadata["tool_calls"] = tool_calls
            elif role == "tool":
                tool_name = msg.get("tool_name")
                if tool_name:
                    metadata["tool_name"] = tool_name
            
            result.append(MessageRowResponse(
                conversation_id=conversation_id,
                role=role,
                content=content,
                metadata=metadata
            ))
        
        return result
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=ConversationMessageResponse,
)
async def create_message(
    conversation_id: str,
    payload: MessageCreateRequest,
    request: Request,
):
    container = get_container(request)
    active_settings = get_settings()
    try:
        turn_index = await container.conversations.create_user_turn(
            conversation_id=conversation_id,
            user_id=payload.user_id,
            content=payload.content,
        )
        result = await container.agent_runtime.invoke(
            user_id=payload.user_id,
            conversation_id=conversation_id,
            content=payload.content,
        )
        await container.conversations.persist_agent_messages(
            conversation_id=conversation_id,
            turn_index=turn_index,
            generated_messages=result.generated_messages,
            run_id=result.run_id,
            model_provider=active_settings.llm_provider,
            model_name=active_settings.default_model,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - hot path defensive handling
        logger.exception("Failed to handle message for conversation %s", conversation_id)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return ConversationMessageResponse(
        conversation_id=conversation_id,
        run_id=result.run_id,
        turn_index=turn_index,
        assistant_message=result.assistant_message,
        tool_trace_summary=result.tool_trace_summary,
    )


def _sse_event(event_name: str, payload: dict) -> str:
    return f"event: {event_name}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


@router.post("/conversations/{conversation_id}/messages/stream")
async def create_message_stream(
    conversation_id: str,
    payload: MessageCreateRequest,
    request: Request,
):
    container = get_container(request)
    active_settings = get_settings()

    try:
        turn_index = await container.conversations.create_user_turn(
            conversation_id=conversation_id,
            user_id=payload.user_id,
            content=payload.content,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    async def event_source():
        final_result = None
        try:
            async for event in container.agent_runtime.stream(
                user_id=payload.user_id,
                conversation_id=conversation_id,
                content=payload.content,
            ):
                event_type = event["type"]
                if event_type == "chunk":
                    yield _sse_event("chunk", {"text": event["text"]})
                elif event_type == "tool_call":
                    yield _sse_event(
                        "tool_call",
                        {"name": event["name"], "args": event["args"]},
                    )
                elif event_type == "tool_result":
                    yield _sse_event(
                        "tool_result",
                        {"name": event["name"], "content": event["content"]},
                    )
                elif event_type == "final":
                    final_result = event["result"]

            if final_result is not None:
                await container.conversations.persist_agent_messages(
                    conversation_id=conversation_id,
                    turn_index=turn_index,
                    generated_messages=final_result.generated_messages,
                    run_id=final_result.run_id,
                    model_provider=active_settings.llm_provider,
                    model_name=active_settings.default_model,
                )
                yield _sse_event(
                    "final",
                    {
                        "conversation_id": conversation_id,
                        "run_id": final_result.run_id,
                        "turn_index": turn_index,
                        "assistant_message": final_result.assistant_message,
                        "tool_trace_summary": final_result.tool_trace_summary,
                    },
                )
        except Exception as exc:  # pragma: no cover - hot path defensive handling
            logger.exception("Streaming failed for conversation %s", conversation_id)
            yield _sse_event("error", {"detail": str(exc)})

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
