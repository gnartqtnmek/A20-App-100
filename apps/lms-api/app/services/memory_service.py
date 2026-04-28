"""CRUD for Memory (ERD-compatible) and Mem0 sync helpers."""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import MemoryType
from app.models.memory import Memory


async def list_memories(
    db: AsyncSession,
    user_id: UUID,
    *,
    active_only: bool = True,
    limit: int = 50,
) -> list[Memory]:
    stmt = select(Memory).where(Memory.user_id == user_id)
    if active_only:
        now = datetime.now(timezone.utc)
        stmt = stmt.where(or_(Memory.expires_at.is_(None), Memory.expires_at > now))
    stmt = stmt.order_by(Memory.updated_at.desc()).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def create_memory(
    db: AsyncSession,
    user_id: UUID,
    content: str,
    memory_type: MemoryType = MemoryType.OTHER,
    relevance_score: float | None = None,
    *,
    mem0_memory_id: str | None = None,
    course_id: UUID | None = None,
    topic: str | None = None,
    source: str = "manual",
    expires_at: datetime | None = None,
) -> Memory:
    mem = Memory(
        user_id=user_id,
        mem0_memory_id=mem0_memory_id,
        memory_type=memory_type,
        content=content,
        course_id=course_id,
        topic=topic,
        source=source,
        relevance_score=relevance_score,
        expires_at=expires_at,
    )
    db.add(mem)
    await db.commit()
    await db.refresh(mem)
    return mem


async def deactivate_memory(db: AsyncSession, memory_id: UUID, user_id: UUID) -> Memory | None:
    mem = await db.get(Memory, memory_id)
    if mem is None or mem.user_id != user_id:
        return None
    mem.expires_at = datetime.now(timezone.utc)
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

        mem0_id = item.get("id")
        if mem0_id:
            existing = await db.execute(
                select(Memory).where(
                    Memory.user_id == user_id,
                    Memory.mem0_memory_id == str(mem0_id),
                )
            )
            row = existing.scalar_one_or_none()
            if row is not None:
                row.content = content
                row.relevance_score = float(item.get("score", 0.5))
                row.source = "mem0"
                continue

        existing_by_content = await db.execute(
            select(Memory).where(
                Memory.user_id == user_id,
                Memory.content == content,
            )
        )
        if existing_by_content.scalar_one_or_none() is not None:
            continue

        db.add(
            Memory(
                user_id=user_id,
                mem0_memory_id=str(mem0_id) if mem0_id else None,
                memory_type=MemoryType.OTHER,
                content=content,
                source="mem0",
                relevance_score=float(item.get("score", 0.5)),
            )
        )
    await db.commit()
