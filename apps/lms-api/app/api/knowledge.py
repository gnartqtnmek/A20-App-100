"""Knowledge base management: ingest lesson content into vector store."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_roles
from app.db.database import get_db
from app.models.base import UserRole
from app.models.user import User
from app.services import course_service, knowledge_service
from app.services.course_service import get_course_or_404

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


class IngestResponse(BaseModel):
    lesson_id: UUID
    chunks_created: int
    message: str


class ChunkRead(BaseModel):
    id: UUID
    lesson_id: UUID
    chunk_index: int
    content: str
    model_name: str


@router.post(
    "/lessons/{lesson_id}/ingest",
    response_model=IngestResponse,
    status_code=status.HTTP_200_OK,
)
async def ingest_lesson(
    lesson_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INSTRUCTOR, UserRole.ADMIN)),
) -> IngestResponse:
    """Re-chunk and re-embed the lesson's markdown content into knowledge_chunks.

    Only the course owner (lecturer) or admin can trigger ingestion.
    Returns the number of chunks created.
    """
    from app.models.course import Lesson, Module

    from sqlalchemy import select

    # Verify ownership: lesson → module → course
    stmt = (
        select(Lesson, Module)
        .join(Module, Module.id == Lesson.module_id)
        .where(Lesson.id == lesson_id)
    )
    row = (await db.execute(stmt)).first()
    if row is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Lesson not found")

    lesson, module = row
    await course_service.ensure_course_owner(db, module.course_id, current_user)

    chunks_created = await knowledge_service.ingest_lesson(db, lesson_id)
    return IngestResponse(
        lesson_id=lesson_id,
        chunks_created=chunks_created,
        message=f"Successfully created {chunks_created} knowledge chunk(s).",
    )


@router.get("/lessons/{lesson_id}/chunks", response_model=list[ChunkRead])
async def list_lesson_chunks(
    lesson_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[ChunkRead]:
    """List knowledge chunks for a lesson (without embedding vectors)."""
    chunks = await knowledge_service.list_chunks(db, lesson_id)
    return [
        ChunkRead(
            id=c.id,
            lesson_id=c.lesson_id,
            chunk_index=c.chunk_index,
            content=c.content,
            model_name=c.model_name,
        )
        for c in chunks
    ]
