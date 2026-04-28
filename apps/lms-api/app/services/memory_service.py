"""CRUD for UserMemory (structured DB layer) and Mem0 sync helpers."""
from __future__ import annotations

import logging
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import MemoryType
from app.models.memory import UserMemory

logger = logging.getLogger(__name__)


async def list_memories(
    db: AsyncSession,
    user_id: UUID,
    *,
    active_only: bool = True,
    limit: int = 50,
) -> list[UserMemory]:
    stmt = select(UserMemory).where(UserMemory.user_id == user_id)
    if active_only:
        stmt = stmt.where(UserMemory.is_active == True)  # noqa: E712
    stmt = stmt.order_by(UserMemory.importance.desc(), UserMemory.created_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def create_memory(
    db: AsyncSession,
    user_id: UUID,
    content: str,
    memory_type: MemoryType = MemoryType.FACT,
    importance: float = 0.5,
    extra: dict | None = None,
) -> UserMemory:
    mem = UserMemory(
        user_id=user_id,
        type=memory_type,
        content=content,
        importance=importance,
        extra=extra,
    )
    db.add(mem)
    await db.commit()
    await db.refresh(mem)
    return mem


async def deactivate_memory(db: AsyncSession, memory_id: UUID, user_id: UUID) -> UserMemory | None:
    mem = await db.get(UserMemory, memory_id)
    if mem is None or mem.user_id != user_id:
        return None
    mem.is_active = False
    await db.commit()
    await db.refresh(mem)
    return mem


async def sync_mem0_to_db(
    db: AsyncSession,
    user_id: UUID,
    mem0_memories: list[dict],
) -> None:
    """Upsert Mem0 cloud memories into the local DB for analytics/backup."""
    for item in mem0_memories:
        content = item.get("memory", "")
        if not content:
            continue
        existing = await db.execute(
            select(UserMemory).where(
                UserMemory.user_id == user_id,
                UserMemory.content == content,
            )
        )
        if existing.scalar_one_or_none() is not None:
            continue
        db.add(
            UserMemory(
                user_id=user_id,
                type=MemoryType.FACT,
                content=content,
                importance=float(item.get("score", 0.5)),
                extra={"mem0_id": item.get("id"), "source": "mem0_sync"},
            )
        )
    await db.commit()
