"""Business logic for the Agent tool endpoints.

Kept separate from the API router so the same logic can be reused by an
internal cron job (e.g. weekly digest worker) and unit-tested without
HTTP overhead.
"""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.assignment import Assignment, Grade, Submission
from app.models.base import SubmissionStatus
from app.models.course import Course, Lesson, Module
from app.models.memory import KnowledgeChunk
from app.models.user import User
from app.schemas.agent_tools import (
    AssignmentForAgent,
    GradeForAgent,
    KnowledgeMatchForAgent,
    KnowledgeSearchResponse,
    LessonAttachmentForAgent,
    LessonForAgent,
)


# ---------------------------------------------------------------------------
# get_my_grades
# ---------------------------------------------------------------------------

async def get_my_grades(
    db: AsyncSession, user: User, course_id: UUID | None = None
) -> list[GradeForAgent]:
    """Return every recorded grade for ``user``, newest first."""
    stmt = (
        select(Grade, Course, Assignment)
        .join(Course, Course.id == Grade.course_id)
        .join(Assignment, Assignment.id == Grade.assignment_id)
        .where(Grade.student_id == user.id)
        .order_by(desc(Grade.recorded_at))
    )
    if course_id is not None:
        stmt = stmt.where(Grade.course_id == course_id)

    rows = (await db.execute(stmt)).all()
    out: list[GradeForAgent] = []
    for grade, course, assignment in rows:
        percent = (grade.score / grade.max_score) * 100 if grade.max_score else 0.0
        out.append(
            GradeForAgent(
                course_id=course.id,
                course_code=course.code,
                course_name=course.name,
                assignment_id=assignment.id,
                assignment_title=assignment.title,
                score=grade.score,
                max_score=grade.max_score,
                weight=grade.weight,
                recorded_at=grade.recorded_at,
                percent=round(percent, 2),
            )
        )
    return out


# ---------------------------------------------------------------------------
# get_my_assignments
# ---------------------------------------------------------------------------

async def get_my_assignments(
    db: AsyncSession,
    user: User,
    *,
    course_id: UUID | None = None,
    only_pending: bool = False,
) -> list[AssignmentForAgent]:
    """Return assignments visible to ``user`` plus this user's submission state.

    ``only_pending=True`` filters to assignments without a graded submission
    (useful when the Agent is asked "what do I still owe?").
    """
    stmt = (
        select(Assignment, Course, Submission)
        .join(Course, Course.id == Assignment.course_id)
        .outerjoin(
            Submission,
            (Submission.assignment_id == Assignment.id)
            & (Submission.student_id == user.id),
        )
        .where(Assignment.is_published.is_(True))
        .order_by(Assignment.due_at.asc().nulls_last(), Assignment.created_at.desc())
    )
    if course_id is not None:
        stmt = stmt.where(Assignment.course_id == course_id)

    rows = (await db.execute(stmt)).all()
    now = datetime.now(timezone.utc)
    out: list[AssignmentForAgent] = []
    for assignment, course, submission in rows:
        is_overdue = bool(assignment.due_at and assignment.due_at < now)
        if only_pending and submission is not None and submission.status == SubmissionStatus.GRADED:
            continue
        out.append(
            AssignmentForAgent(
                id=assignment.id,
                title=assignment.title,
                type=assignment.type.value,
                due_at=assignment.due_at,
                course_id=course.id,
                course_code=course.code,
                course_name=course.name,
                max_score=assignment.max_score,
                weight=assignment.weight,
                submission_status=submission.status.value if submission else None,
                submission_score=submission.score if submission else None,
                is_overdue=is_overdue,
            )
        )
    return out


# ---------------------------------------------------------------------------
# get_lesson_content
# ---------------------------------------------------------------------------

async def get_lesson_content(db: AsyncSession, lesson_id: UUID) -> LessonForAgent | None:
    stmt = (
        select(Lesson, Module, Course)
        .join(Module, Module.id == Lesson.module_id)
        .join(Course, Course.id == Module.course_id)
        .where(Lesson.id == lesson_id)
    )
    row = (await db.execute(stmt)).first()
    if row is None:
        return None
    lesson, module, course = row
    attachments = [
        LessonAttachmentForAgent(
            name=item.get("name", "attachment"),
            url=item.get("url", ""),
            mime=item.get("mime"),
            size=item.get("size"),
        )
        for item in (lesson.attachments or [])
        if isinstance(item, dict)
    ]
    return LessonForAgent(
        id=lesson.id,
        title=lesson.title,
        content_md=lesson.content_md,
        video_url=lesson.video_url,
        duration_minutes=lesson.duration_minutes,
        module_title=module.title,
        course_id=course.id,
        course_code=course.code,
        course_name=course.name,
        attachments=attachments,
    )


# ---------------------------------------------------------------------------
# search_knowledge
# ---------------------------------------------------------------------------

EMBEDDING_DIM = 1536


async def search_knowledge(
    db: AsyncSession,
    *,
    query: str,
    embedding: list[float] | None,
    course_id: UUID | None,
    limit: int,
) -> KnowledgeSearchResponse:
    """Hybrid semantic + text search over ``knowledge_chunks``.

    Strategy:
      * If an ``embedding`` of the right dimension is supplied, do
        cosine-distance vector search via the ivfflat index.
      * Otherwise fall back to trigram similarity on ``content`` so the
        endpoint still works during early development before the Agent
        wires its embedding pipeline.
    """
    used_vector = bool(embedding) and len(embedding or []) == EMBEDDING_DIM
    note: str | None = None
    matches: list[KnowledgeMatchForAgent] = []

    if used_vector:
        distance = KnowledgeChunk.embedding.cosine_distance(embedding)
        stmt = (
            select(
                KnowledgeChunk,
                Lesson,
                Module,
                Course,
                distance.label("distance"),
            )
            .join(Lesson, Lesson.id == KnowledgeChunk.lesson_id)
            .join(Module, Module.id == Lesson.module_id)
            .join(Course, Course.id == Module.course_id)
            .order_by(distance.asc())
            .limit(limit)
        )
        if course_id is not None:
            stmt = stmt.where(Course.id == course_id)

        rows = (await db.execute(stmt)).all()
        for chunk, lesson, _module, course, dist in rows:
            similarity = max(0.0, 1.0 - float(dist)) if dist is not None else None
            matches.append(
                KnowledgeMatchForAgent(
                    chunk_id=chunk.id,
                    lesson_id=lesson.id,
                    lesson_title=lesson.title,
                    course_id=course.id,
                    course_code=course.code,
                    course_name=course.name,
                    chunk_index=chunk.chunk_index,
                    content=chunk.content,
                    similarity=round(similarity, 4) if similarity is not None else None,
                )
            )
    else:
        # Fallback: simple ``ILIKE`` on the query. Good enough for Sprint 1.
        # When pg_trgm is desired we'd use ``content % :q`` instead.
        like = f"%{query}%"
        stmt = (
            select(KnowledgeChunk, Lesson, Course)
            .join(Lesson, Lesson.id == KnowledgeChunk.lesson_id)
            .join(Module, Module.id == Lesson.module_id)
            .join(Course, Course.id == Module.course_id)
            .where(KnowledgeChunk.content.ilike(like))
            .order_by(KnowledgeChunk.chunk_index.asc())
            .limit(limit)
        )
        if course_id is not None:
            stmt = stmt.where(Course.id == course_id)

        rows = (await db.execute(stmt)).all()
        for chunk, lesson, course in rows:
            matches.append(
                KnowledgeMatchForAgent(
                    chunk_id=chunk.id,
                    lesson_id=lesson.id,
                    lesson_title=lesson.title,
                    course_id=course.id,
                    course_code=course.code,
                    course_name=course.name,
                    chunk_index=chunk.chunk_index,
                    content=chunk.content,
                    similarity=None,
                )
            )
        note = (
            "Embedding not provided or wrong dimension; fell back to ILIKE "
            f"text search (limit={limit}). Pass a {EMBEDDING_DIM}-dim "
            "embedding for semantic search."
        )

    return KnowledgeSearchResponse(
        matches=matches,
        used_vector_search=used_vector,
        note=note,
    )
