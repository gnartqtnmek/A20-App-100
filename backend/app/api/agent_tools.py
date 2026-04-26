"""Tool endpoints exposed to the AI Agent service.

Auth: every endpoint requires ``Authorization: Bearer <AGENT_SERVICE_TOKEN>``.
User-scoped endpoints additionally require ``X-User-Id: <uuid>``.

These endpoints are intentionally separate from the user-facing routes
because:
* The Agent caller is not a human end-user; it has its own credential.
* We want a single audit point for every Agent ↔ LMS interaction.
* Schemas are flatter / closer to what an LLM tool-call expects.
"""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.agent_auth import require_agent_caller, require_agent_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.agent_tools import (
    AssignmentForAgent,
    GradeForAgent,
    KnowledgeSearchRequest,
    KnowledgeSearchResponse,
    LessonForAgent,
)
from app.services import agent_tools_service

router = APIRouter(prefix="/agent/tools", tags=["agent-tools"])


@router.get(
    "/grades",
    response_model=list[GradeForAgent],
    summary="get_my_grades — list all graded items for the active user",
)
async def get_my_grades(
    course_id: UUID | None = Query(default=None, description="Filter to a single course"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_agent_user),
) -> list[GradeForAgent]:
    return await agent_tools_service.get_my_grades(db, user, course_id=course_id)


@router.get(
    "/assignments",
    response_model=list[AssignmentForAgent],
    summary="get_my_assignments — list assignments + this user's submission state",
)
async def get_my_assignments(
    course_id: UUID | None = Query(default=None),
    only_pending: bool = Query(
        default=False, description="If true, exclude already-graded items."
    ),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_agent_user),
) -> list[AssignmentForAgent]:
    return await agent_tools_service.get_my_assignments(
        db, user, course_id=course_id, only_pending=only_pending
    )


@router.get(
    "/lessons/{lesson_id}",
    response_model=LessonForAgent,
    summary="get_lesson_content — full markdown + attachments of a lesson",
)
async def get_lesson_content(
    lesson_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_agent_caller),
) -> LessonForAgent:
    lesson = await agent_tools_service.get_lesson_content(db, lesson_id)
    if lesson is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lesson {lesson_id} not found.",
        )
    return lesson


@router.post(
    "/knowledge/search",
    response_model=KnowledgeSearchResponse,
    summary="search_knowledge — semantic search over lesson knowledge_chunks",
)
async def search_knowledge(
    payload: KnowledgeSearchRequest,
    db: AsyncSession = Depends(get_db),
    _: None = Depends(require_agent_caller),
) -> KnowledgeSearchResponse:
    return await agent_tools_service.search_knowledge(
        db,
        query=payload.query,
        embedding=payload.embedding,
        course_id=payload.course_id,
        limit=payload.limit,
    )
