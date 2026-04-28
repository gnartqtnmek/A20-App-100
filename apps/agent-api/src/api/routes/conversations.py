"""Conversation and message routes."""

from __future__ import annotations

import json
import logging
import math
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from ...infra.settings import get_settings
from ..auth import AuthUser, get_current_user
from ..deps import get_container, normalize_record
from ..schemas import (
    ConversationCreateRequest,
    ConversationDetailResponse,
    ConversationEnsureRequest,
    ConversationItemResponse,
    ConversationMessageResponse,
    ConversationResponse,
    MessageCreateRequest,
    MessageRowResponse,
    MessagesListResponse,
    PaginatedConversationsResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter()


def _to_message_response(conversation_id: str, msg: dict) -> MessageRowResponse:
    role_map = {
        "user": "user",
        "assistant": "assistant",
        "tool": "tool",
    }
    role = role_map.get(msg.get("role"), "user")
    content = msg.get("content", "")
    metadata: dict = {}
    if role == "assistant":
        tool_calls = msg.get("tool_calls")
        if tool_calls:
            metadata["tool_calls"] = tool_calls
    elif role == "tool":
        tool_name = msg.get("tool_name")
        if tool_name:
            metadata["tool_name"] = tool_name
    return MessageRowResponse(
        conversation_id=conversation_id,
        role=role,
        content=content,
        metadata=metadata,
    )


def _to_conversation_item(record: dict) -> ConversationItemResponse:
    messages = record.get("messages") or []
    payload = {
        **record,
        "course_id": record.get("course_id"),
        "message_count": record.get("message_count", len(messages)),
        "last_message_at": record.get("last_message_at") or record.get("updated_at"),
    }
    return ConversationItemResponse.model_validate(normalize_record(payload))


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    payload: ConversationCreateRequest,
    request: Request,
    current_user: AuthUser = Depends(get_current_user),
):
    container = get_container(request)
    conversation = await container.conversations.create_conversation(
        user_id=current_user.id,
        title=payload.title,
    )
    return ConversationResponse.model_validate(normalize_record(conversation))


@router.post("/conversations/{conversation_id}/ensure", response_model=ConversationResponse)
async def ensure_conversation(
    conversation_id: str,
    payload: ConversationEnsureRequest,
    request: Request,
    current_user: AuthUser = Depends(get_current_user),
):
    container = get_container(request)
    conversation = await container.conversations.get_or_create_conversation(
        conversation_id=conversation_id,
        user_id=current_user.id,
        title=payload.title,
    )
    return ConversationResponse.model_validate(normalize_record(conversation))


@router.get("/conversations", response_model=PaginatedConversationsResponse)
async def list_conversations(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: AuthUser = Depends(get_current_user),
):
    container = get_container(request)
    total, rows = await container.conversations.list_conversations_paginated(
        current_user.id,
        page=page,
        limit=limit,
    )
    items = [_to_conversation_item(row) for row in rows]
    pages = max(1, math.ceil(total / limit)) if total else 1
    return PaginatedConversationsResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages,
        has_next=page < pages,
        has_prev=page > 1,
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation_detail(
    conversation_id: str,
    request: Request,
    current_user: AuthUser = Depends(get_current_user),
):
    container = get_container(request)
    try:
        detail = await container.conversations.get_conversation_detail(conversation_id, current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return ConversationDetailResponse.model_validate(normalize_record(detail))


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    request: Request,
    current_user: AuthUser = Depends(get_current_user),
):
    container = get_container(request)
    deleted = await container.conversations.soft_delete_conversation(conversation_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"message": "Da xoa cuoc tro chuyen"}


@router.get("/conversations/{conversation_id}/messages", response_model=MessagesListResponse)
async def list_messages(
    conversation_id: str,
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: AuthUser = Depends(get_current_user),
):
    container = get_container(request)
    try:
        conversation, total, messages = await container.conversations.list_messages_paginated(
            conversation_id=conversation_id,
            user_id=current_user.id,
            page=page,
            limit=limit,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    pages = max(1, math.ceil(total / limit)) if total else 1
    return MessagesListResponse(
        conversation=_to_conversation_item(conversation),
        messages=[_to_message_response(conversation_id, msg) for msg in messages],
        total=total,
        page=page,
        limit=limit,
        pages=pages,
        has_next=page < pages,
        has_prev=page > 1,
    )


# Legacy endpoint kept for backward compatibility with older clients.
@router.get("/users/{user_id}/conversations", response_model=list[ConversationResponse])
async def list_conversations_legacy(
    user_id: str,
    request: Request,
    current_user: AuthUser = Depends(get_current_user),
):
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Permission denied")
    container = get_container(request)
    rows = await container.conversations.list_conversations(user_id)
    return [ConversationResponse.model_validate(normalize_record(row)) for row in rows]


@router.get("/conversations/{conversation_id}/messages/flat", response_model=list[MessageRowResponse])
async def list_messages_legacy(
    conversation_id: str,
    request: Request,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: AuthUser = Depends(get_current_user),
):
    container = get_container(request)
    try:
        messages = await container.conversations.list_messages(
            conversation_id=conversation_id,
            user_id=current_user.id,
            limit=limit,
            offset=offset,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return [_to_message_response(conversation_id, msg) for msg in messages]


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=ConversationMessageResponse,
)
async def create_message(
    conversation_id: str,
    payload: MessageCreateRequest,
    request: Request,
    current_user: AuthUser = Depends(get_current_user),
):
    container = get_container(request)
    active_settings = get_settings()
    try:
        turn_index = await container.conversations.create_user_turn(
            conversation_id=conversation_id,
            user_id=current_user.id,
            content=payload.content,
        )
        result = await container.agent_runtime.invoke(
            user_id=current_user.id,
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


def _sse_data(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"


def _tool_display_message(tool_name: str) -> str:
    display_map = {
        "get_my_grades": "Dang tra cuu diem so...",
        "get_my_assignments": "Dang tra cuu bai tap...",
        "search_knowledge": "Dang tim kiem tai lieu khoa hoc...",
        "get_lesson_content": "Dang tai noi dung bai hoc...",
    }
    return display_map.get(tool_name, f"Dang goi cong cu {tool_name}...")


@router.post("/conversations/{conversation_id}/messages/stream")
async def create_message_stream(
    conversation_id: str,
    payload: MessageCreateRequest,
    request: Request,
    current_user: AuthUser = Depends(get_current_user),
):
    container = get_container(request)
    active_settings = get_settings()

    try:
        turn_index = await container.conversations.create_user_turn(
            conversation_id=conversation_id,
            user_id=current_user.id,
            content=payload.content,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    async def event_source():
        final_result = None
        pending_tools: list[str] = []
        try:
            async for event in container.agent_runtime.stream(
                user_id=current_user.id,
                conversation_id=conversation_id,
                content=payload.content,
            ):
                event_type = event["type"]
                if event_type == "chunk":
                    yield _sse_data({"type": "token", "content": event["text"]})
                elif event_type == "tool_call":
                    tool_name = event["name"]
                    pending_tools.append(tool_name)
                    yield _sse_data(
                        {
                            "type": "tool_call_start",
                            "tool_name": tool_name,
                            "display_message": _tool_display_message(tool_name),
                        }
                    )
                elif event_type == "tool_result":
                    tool_name = event["name"]
                    summary = event.get("content", "")[:180]
                    yield _sse_data(
                        {"type": "tool_result", "tool_name": tool_name, "summary": summary}
                    )
                    if tool_name in pending_tools:
                        pending_tools.remove(tool_name)
                        yield _sse_data({"type": "tool_call_end", "tool_name": tool_name})
                elif event_type == "final":
                    final_result = event["result"]

            for tool_name in list(pending_tools):
                yield _sse_data({"type": "tool_call_end", "tool_name": tool_name})

            if final_result is not None:
                message_id = str(uuid.uuid4())
                await container.conversations.persist_agent_messages(
                    conversation_id=conversation_id,
                    turn_index=turn_index,
                    generated_messages=final_result.generated_messages,
                    run_id=final_result.run_id,
                    model_provider=active_settings.llm_provider,
                    model_name=active_settings.default_model,
                )
                yield _sse_data(
                    {
                        "type": "done",
                        "message_id": message_id,
                        "tokens_used": 0,
                        "model_used": active_settings.default_model,
                    }
                )
                yield "data: [DONE]\n\n"
        except Exception as exc:  # pragma: no cover - hot path defensive handling
            logger.exception("Streaming failed for conversation %s", conversation_id)
            yield _sse_data(
                {
                    "type": "error",
                    "error_code": "AI_UNAVAILABLE",
                    "message": f"He thong AI tam thoi gian doan: {exc}",
                }
            )
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )

