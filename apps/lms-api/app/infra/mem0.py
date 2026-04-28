"""Mem0 long-term memory client.

Two modes:
  1. Cloud (MEM0_API_KEY set)  → uses Mem0 managed platform.
  2. Self-hosted OSS           → Mem0 with local Qdrant + Postgres.

All operations are async-friendly wrappers around the sync Mem0 SDK
(run in a thread pool so they don't block the event loop).
"""
from __future__ import annotations

import asyncio
import logging
from functools import lru_cache
from typing import Any

logger = logging.getLogger(__name__)


def _build_client() -> Any:
    """Construct a Mem0 Memory client according to current settings."""
    from app.core.config import get_settings

    s = get_settings()

    if s.mem0_api_key:
        from mem0 import MemoryClient

        return MemoryClient(api_key=s.mem0_api_key)

    # OSS / self-hosted: use local vector store + LLM from our config
    from mem0 import Memory

    config: dict[str, Any] = {
        "llm": {
            "provider": "openai",
            "config": {
                "model": s.llm_model,
                "api_key": s.llm_api_key,
                "openai_base_url": s.llm_base_url or None,
            },
        },
        "embedder": {
            "provider": "openai",
            "config": {
                "model": s.embedding_model,
                "api_key": s.embedding_api_key,
                "openai_base_url": s.embedding_base_url,
            },
        },
    }

    if s.mem0_qdrant_url:
        config["vector_store"] = {
            "provider": "qdrant",
            "config": {"url": s.mem0_qdrant_url, "collection_name": "lms_memories"},
        }

    return Memory.from_config(config)


@lru_cache(maxsize=1)
def _get_client() -> Any:
    return _build_client()


async def add_memory(user_id: str, text: str, metadata: dict | None = None) -> list[dict]:
    """Store a new memory for *user_id*. Returns the created memory objects."""
    client = _get_client()
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(
            None,
            lambda: client.add(text, user_id=user_id, metadata=metadata or {}),
        )
        return result if isinstance(result, list) else result.get("results", [])
    except Exception:
        logger.exception("mem0 add_memory failed for user %s", user_id)
        return []


async def search_memories(user_id: str, query: str, limit: int = 10) -> list[dict]:
    """Retrieve the most relevant memories for *user_id* given *query*."""
    client = _get_client()
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(
            None,
            lambda: client.search(query, user_id=user_id, limit=limit),
        )
        if isinstance(result, list):
            return result
        return result.get("results", [])
    except Exception:
        logger.exception("mem0 search_memories failed for user %s", user_id)
        return []


async def get_all_memories(user_id: str) -> list[dict]:
    """Fetch all stored memories for *user_id*."""
    client = _get_client()
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(
            None,
            lambda: client.get_all(user_id=user_id),
        )
        if isinstance(result, list):
            return result
        return result.get("results", [])
    except Exception:
        logger.exception("mem0 get_all_memories failed for user %s", user_id)
        return []


async def delete_memory(memory_id: str) -> None:
    """Delete a specific memory by ID."""
    client = _get_client()
    loop = asyncio.get_event_loop()
    try:
        await loop.run_in_executor(None, lambda: client.delete(memory_id))
    except Exception:
        logger.exception("mem0 delete_memory %s failed", memory_id)
