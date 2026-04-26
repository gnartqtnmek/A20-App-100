"""Message loader service for loading chat history from conversations table."""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, ToolMessage

from ..infra.db import Database

logger = logging.getLogger(__name__)


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
        tool_call_id = data.get("tool_call_id", "")
        if not tool_call_id:
            logger.warning("ToolMessage missing tool_call_id, using empty string")
        return ToolMessage(
            content=content,
            tool_call_id=tool_call_id,
            name=data.get("tool_name")
        )
    else:
        logger.warning(f"Unknown message role '{role}', falling back to HumanMessage")
        return HumanMessage(content=content)


class MessageLoader:
    """Service for loading chat history from conversations table."""
    
    def __init__(self, db: Database):
        """Initialize MessageLoader.
        
        Args:
            db: Database instance for querying conversations
        """
        self.db = db
    
    async def load_history(
        self,
        conversation_id: str,
        user_id: str
    ) -> list[BaseMessage]:
        """Load chat history and convert to LangGraph messages.
        
        Args:
            conversation_id: UUID of the conversation
            user_id: User ID for validation (required)
            
        Returns:
            List of BaseMessage objects (HumanMessage, AIMessage, ToolMessage)
            in insertion order. Returns empty list if conversation not found
            or deserialization fails.
        """
        # Query conversations table with user_id validation
        sql = "SELECT messages FROM conversations WHERE id = %s AND user_id = %s"
        params: tuple[Any, ...] = (conversation_id, user_id)
        
        row = await self.db.fetch_one(sql, params)
        
        if not row:
            logger.warning(f"Conversation {conversation_id} not found for user {user_id}")
            return []
        
        # Get messages from JSONB column
        messages_data = row.get("messages") or []
        
        if not messages_data:
            # Empty conversation - return empty list
            return []
        
        # Deserialize using custom format
        try:
            return [_deserialize_message(msg) for msg in messages_data]
        except Exception as exc:
            logger.error(f"Failed to deserialize messages for conversation {conversation_id}", exc_info=exc)
            return []
