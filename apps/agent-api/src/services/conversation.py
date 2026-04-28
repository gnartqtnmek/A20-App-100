"""Conversation and message persistence service."""

from __future__ import annotations

import json
import uuid
from typing import Any, Sequence

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, ToolMessage
from psycopg.types.json import Jsonb

from ..infra.db import Database


def _normalize_messages(raw_messages: Any) -> list[dict[str, Any]]:
    return [dict(item) for item in raw_messages if isinstance(item, dict)] if isinstance(raw_messages, list) else []


def _serialize_message(msg: BaseMessage) -> dict[str, Any]:
    """Serialize a LangChain message to simplified JSON format.
    
    Args:
        msg: BaseMessage to serialize
        
    Returns:
        Simplified dict with only essential fields
    """
    if isinstance(msg, HumanMessage):
        return {
            "role": "user",
            "content": str(msg.content) if msg.content else ""
        }
    elif isinstance(msg, AIMessage):
        # Extract text content from list or string
        content = msg.content
        if isinstance(content, list):
            text_parts = []
            for block in content:
                if isinstance(block, dict) and block.get("type") == "text":
                    text_parts.append(block.get("text", ""))
                elif isinstance(block, str):
                    text_parts.append(block)
            content_str = "".join(text_parts)
        else:
            content_str = str(content) if content else ""
        
        result: dict[str, Any] = {
            "role": "assistant",
            "content": content_str
        }
        
        # Add tool_calls if present
        tool_calls = getattr(msg, "tool_calls", None)
        if tool_calls:
            result["tool_calls"] = [
                {
                    "id": tc.get("id"),
                    "name": tc.get("name"),
                    "args": tc.get("args", {})
                }
                for tc in tool_calls
            ]
        
        return result
    elif isinstance(msg, ToolMessage):
        return {
            "role": "tool",
            "content": str(msg.content) if msg.content else "",
            "tool_call_id": getattr(msg, "tool_call_id", None),
            "tool_name": getattr(msg, "name", None)
        }
    else:
        # Fallback for unknown message types
        return {
            "role": "unknown",
            "content": str(msg.content) if hasattr(msg, "content") else ""
        }


def _deserialize_message(data: dict[str, Any]) -> BaseMessage:
    """Deserialize simplified JSON format back to LangChain message.
    
    Args:
        data: Simplified message dict
        
    Returns:
        BaseMessage object
    """
    role = data.get("role")
    content = data.get("content", "")
    
    if role == "user":
        return HumanMessage(content=content)
    elif role == "assistant":
        tool_calls = data.get("tool_calls")
        return AIMessage(content=content, tool_calls=tool_calls or [])
    elif role == "tool":
        return ToolMessage(
            content=content,
            tool_call_id=data.get("tool_call_id", ""),
            name=data.get("tool_name")
        )
    else:
        # Fallback
        return HumanMessage(content=content)


class ConversationService:
    def __init__(self, db: Database):
        self.db = db

    async def create_conversation(
        self,
        user_id: str,
        title: str | None = None,
        conversation_id: str | None = None,
    ) -> dict[str, Any]:
        cid = uuid.UUID(conversation_id) if conversation_id else uuid.uuid4()
        await self.db.execute(
            """
            INSERT INTO conversations (id, user_id, title, messages)
            VALUES (%s, %s, %s, %s)
            """,
            (cid, user_id, title, Jsonb([])),
        )
        return await self.get_conversation(str(cid), user_id)

    async def get_or_create_conversation(
        self,
        conversation_id: str,
        user_id: str,
        title: str | None = None,
    ) -> dict[str, Any]:
        try:
            return await self.get_conversation(conversation_id, user_id)
        except ValueError:
            return await self.create_conversation(user_id, title, conversation_id=conversation_id)

    async def get_conversation(self, conversation_id: str, user_id: str | None = None) -> dict[str, Any]:
        sql = """
            SELECT id, user_id, title, messages, is_active, created_at, updated_at
            FROM conversations
            WHERE id = %s AND is_active = TRUE
        """
        params: tuple[Any, ...] = (conversation_id,)
        if user_id:
            sql += " AND user_id = %s"
            params = (conversation_id, user_id)
        row = await self.db.fetch_one(sql, params)
        if not row:
            raise ValueError("Conversation not found.")
        row = dict(row)
        row["messages"] = _normalize_messages(row.get("messages"))
        return row

    async def list_conversations(self, user_id: str) -> list[dict[str, Any]]:
        rows = await self.db.fetch_all(
            """
            SELECT id, user_id, title, messages, is_active, created_at, updated_at
            FROM conversations
            WHERE user_id = %s AND is_active = TRUE
            ORDER BY updated_at DESC
            """,
            (user_id,),
        )
        normalized_rows: list[dict[str, Any]] = []
        for row in rows:
            record = dict(row)
            record["messages"] = _normalize_messages(record.get("messages"))
            normalized_rows.append(record)
        return normalized_rows

    async def list_messages(
        self,
        conversation_id: str,
        user_id: str,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """List messages in LangGraph format."""
        conversation = await self.get_conversation(conversation_id, user_id)
        messages = conversation.get("messages") or []
        sliced_messages = messages[offset: offset + limit]
        return sliced_messages

    async def create_user_turn(
        self,
        conversation_id: str,
        user_id: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> int:
        await self.get_conversation(conversation_id, user_id)
        async with self.db.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    SELECT messages
                    FROM conversations
                    WHERE id = %s AND user_id = %s AND is_active = TRUE
                    FOR UPDATE
                    """,
                    (conversation_id, user_id),
                )
                row = await cur.fetchone()
                if not row:
                    raise ValueError("Conversation not found.")

                messages = _normalize_messages(row.get("messages"))
                
                # Create and serialize HumanMessage
                human_msg = HumanMessage(content=content)
                msg_dict = _serialize_message(human_msg)
                
                messages.append(msg_dict)
                
                # Calculate turn index from message sequence
                turn_index = sum(1 for m in messages if m.get("role") == "user")

                await cur.execute(
                    """
                    UPDATE conversations
                    SET messages = %s,
                        updated_at = NOW()
                    WHERE id = %s
                    """,
                    (Jsonb(messages), conversation_id),
                )
        return turn_index

    async def persist_agent_messages(
        self,
        conversation_id: str,
        turn_index: int,
        generated_messages: Sequence[BaseMessage],
        *,
        run_id: str,
        model_provider: str,
        model_name: str,
    ) -> None:
        async with self.db.connection() as conn:
            async with conn.cursor() as cur:
                await cur.execute(
                    """
                    SELECT messages, user_id
                    FROM conversations
                    WHERE id = %s AND is_active = TRUE
                    FOR UPDATE
                    """,
                    (conversation_id,),
                )
                row = await cur.fetchone()
                if not row:
                    raise ValueError("Conversation not found.")

                messages = _normalize_messages(row.get("messages"))
                
                # Serialize messages using custom format
                serialized = [_serialize_message(msg) for msg in generated_messages]
                messages.extend(serialized)

                await cur.execute(
                    """
                    UPDATE conversations
                    SET messages = %s,
                        updated_at = NOW()
                    WHERE id = %s
                    """,
                    (Jsonb(messages), conversation_id),
                )

                await cur.execute(
                    """
                    INSERT INTO embedding_jobs (conversation_id, turn_index, status, retry_count, updated_at)
                    VALUES (%s, %s, 'pending', 0, NOW())
                    ON CONFLICT (conversation_id, turn_index)
                    DO UPDATE SET status = 'pending', updated_at = NOW()
                    """,
                    (conversation_id, turn_index),
                )

