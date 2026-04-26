"""RAG search over past conversation history using pgvector."""

from __future__ import annotations

import uuid
from typing import Any

import tiktoken
from openai import AsyncOpenAI

from ..infra.db import Database
from ..infra.settings import Settings

_CHUNK_NS = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")
_CHUNK_TOKEN_SIZE = 512
_ENCODING_NAME = "cl100k_base"

_enc: tiktoken.Encoding | None = None


def _get_enc() -> tiktoken.Encoding:
    global _enc
    if _enc is None:
        _enc = tiktoken.get_encoding(_ENCODING_NAME)
    return _enc


def chunk_by_tokens(text: str) -> list[str]:
    enc = _get_enc()
    tokens = enc.encode(text)
    if not tokens:
        return []
    return [enc.decode(tokens[i : i + _CHUNK_TOKEN_SIZE]) for i in range(0, len(tokens), _CHUNK_TOKEN_SIZE)]


def build_turn_text(messages: list[dict[str, Any]], turn_index: int) -> tuple[str, list[int]]:
    """Build turn text from messages in simplified format.
    
    Args:
        messages: List of message dicts in simplified format
        turn_index: Target turn index
        
    Returns:
        Tuple of (turn_text, message_indices)
    """
    # Calculate turn for each message and collect messages for target turn
    current_turn = 0
    turn_messages = []
    
    for idx, msg in enumerate(messages):
        role = msg.get("role")
        content = msg.get("content", "")
        
        if role == "user":
            current_turn += 1
        
        if current_turn == turn_index:
            turn_messages.append((idx, role, content))
    
    # Build text
    parts: list[str] = []
    msg_indices: list[int] = []
    
    for idx, role, content in turn_messages:
        if not content:
            continue
        msg_indices.append(idx)
        if role == "user":
            parts.append(f"User: {content}")
        elif role == "assistant":
            parts.append(f"Assistant: {content}")
    
    return "\n".join(parts), msg_indices


def chunk_uuid(conversation_id: str, turn_index: int, chunk_seq: int) -> str:
    return str(uuid.uuid5(_CHUNK_NS, f"{conversation_id}:{turn_index}:{chunk_seq}"))


def vec_literal(embedding: list[float]) -> str:
    return "[" + ",".join(str(x) for x in embedding) + "]"


class RAGService:
    def __init__(self, db: Database, settings: Settings) -> None:
        self.db = db
        self._client = AsyncOpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.embedding_base_url or "https://api.openai.com/v1",
        )
        self._model = settings.embedding_model
        self._dimensions = settings.embedding_dimensions

    async def _embed(self, texts: list[str]) -> list[list[float]]:
        response = await self._client.embeddings.create(
            model=self._model,
            input=texts,
            dimensions=self._dimensions,
        )
        return [item.embedding for item in sorted(response.data, key=lambda x: x.index)]

    async def search(self, user_id: str, query: str, top_k: int = 3) -> str:
        [query_vec] = await self._embed([query])

        rows = await self.db.fetch_all(
            """
            SELECT conversation_id, turn_index
            FROM message_embeddings
            WHERE user_id = %s
            ORDER BY embedding <=> %s::vector
            LIMIT %s
            """,
            (user_id, vec_literal(query_vec), top_k),
        )
        if not rows:
            return ""

        seen: set[tuple[str, int]] = set()
        blocks: list[str] = []

        for row in rows:
            conv_id = str(row["conversation_id"])
            turn_index = int(row["turn_index"])
            key = (conv_id, turn_index)
            if key in seen:
                continue
            seen.add(key)

            conv_row = await self.db.fetch_one(
                "SELECT messages FROM conversations WHERE id = %s",
                (conv_id,),
            )
            if not conv_row:
                continue
            messages = conv_row.get("messages") or []
            if not isinstance(messages, list):
                messages = []

            parts: list[str] = []

            if turn_index > 1:
                prev_text, _ = build_turn_text(messages, turn_index - 1)
                if prev_text:
                    parts.append(f"[Lượt {turn_index - 1} - ngữ cảnh]\n{prev_text}")

            curr_text, _ = build_turn_text(messages, turn_index)
            if curr_text:
                parts.append(f"[Lượt {turn_index}]\n{curr_text}")

            if parts:
                blocks.append("\n\n".join(parts))

        return "\n\n---\n\n".join(blocks)
