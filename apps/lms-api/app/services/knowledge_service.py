"""Knowledge chunk ingestion: split lesson content → embed → store in knowledge_chunks."""
from __future__ import annotations

import logging
import re
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.infra.embeddings import embed_texts
from app.models.course import Lesson
from app.models.memory import KnowledgeChunk

logger = logging.getLogger(__name__)

_MIN_CHUNK_CHARS = 80
_MAX_CHUNK_CHARS = 800


def _chunk_markdown(text: str) -> list[str]:
    """Split markdown text into semantically meaningful chunks.

    Strategy:
    1. Split on double newlines (paragraph boundaries).
    2. Sub-split paragraphs that exceed _MAX_CHUNK_CHARS at sentence boundaries.
    3. Merge consecutive chunks below _MIN_CHUNK_CHARS into the next chunk.
    """
    paragraphs = re.split(r"\n\n+", text.strip())
    raw: list[str] = []
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        if len(para) <= _MAX_CHUNK_CHARS:
            raw.append(para)
        else:
            # Sub-split by sentence-ending punctuation
            sentences = re.split(r"(?<=[.!?。])\s+", para)
            current = ""
            for sentence in sentences:
                if len(current) + len(sentence) + 1 <= _MAX_CHUNK_CHARS:
                    current = (current + " " + sentence).strip() if current else sentence
                else:
                    if current:
                        raw.append(current)
                    current = sentence
            if current:
                raw.append(current)

    # Merge tiny chunks forward
    merged: list[str] = []
    for chunk in raw:
        if merged and len(merged[-1]) < _MIN_CHUNK_CHARS:
            merged[-1] = merged[-1] + "\n\n" + chunk
        else:
            merged.append(chunk)
    return [c for c in merged if c.strip()]


async def ingest_lesson(db: AsyncSession, lesson_id: UUID) -> int:
    """Re-chunk and re-embed a lesson's content.

    Deletes any existing chunks for the lesson before inserting new ones.
    Returns the number of chunks created.
    """
    settings = get_settings()

    if not settings.embedding_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Embedding API key not configured (EMBEDDING_API_KEY)",
        )

    lesson = await db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")

    content = (lesson.content_md or "").strip()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lesson has no content to ingest",
        )

    chunks = _chunk_markdown(content)
    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not split lesson into chunks",
        )

    # Generate embeddings
    try:
        embeddings = await embed_texts(
            chunks,
            base_url=settings.embedding_base_url,
            api_key=settings.embedding_api_key,
            model=settings.embedding_model,
        )
    except Exception as exc:
        logger.error("Embedding API error for lesson %s: %s", lesson_id, exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Embedding API error: {exc}",
        ) from exc

    # Delete old chunks then insert new ones
    await db.execute(delete(KnowledgeChunk).where(KnowledgeChunk.lesson_id == lesson_id))

    for idx, (text, vec) in enumerate(zip(chunks, embeddings)):
        db.add(KnowledgeChunk(
            lesson_id=lesson_id,
            content=text,
            chunk_index=idx,
            model_name=settings.embedding_model,
            embedding=vec,
        ))

    await db.commit()
    logger.info("Ingested lesson %s → %d chunks", lesson_id, len(chunks))
    return len(chunks)


async def list_chunks(db: AsyncSession, lesson_id: UUID) -> list[KnowledgeChunk]:
    stmt = (
        select(KnowledgeChunk)
        .where(KnowledgeChunk.lesson_id == lesson_id)
        .order_by(KnowledgeChunk.chunk_index.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
