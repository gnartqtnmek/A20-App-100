"""Assignment and submission API routes."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_roles
from app.db.database import get_db
from app.models.base import UserRole
from app.models.user import User
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentRead,
    SubmissionCreate,
    SubmissionRead,
)
from app.services import assignment_service, course_service

router = APIRouter(prefix="/assignments", tags=["assignments"])


@router.post("", response_model=AssignmentRead, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    payload: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.LECTURER, UserRole.ADMIN)),
) -> AssignmentRead:
    await course_service.ensure_course_owner(db, payload.course_id, current_user)
    assignment = await assignment_service.create_assignment(db, payload)
    return AssignmentRead.model_validate(assignment)


@router.get("/course/{course_id}", response_model=list[AssignmentRead])
async def list_assignments_by_course(
    course_id: UUID,
    published_only: bool | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[AssignmentRead]:
    assignments = await assignment_service.list_assignments_by_course(db, course_id, published_only)
    return [AssignmentRead.model_validate(item) for item in assignments]


@router.get("/{assignment_id}", response_model=AssignmentRead)
async def get_assignment(
    assignment_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> AssignmentRead:
    assignment = await assignment_service.get_assignment_or_404(db, assignment_id)
    return AssignmentRead.model_validate(assignment)


@router.post(
    "/{assignment_id}/submissions",
    response_model=SubmissionRead,
    status_code=status.HTTP_201_CREATED,
)
async def submit_assignment(
    assignment_id: UUID,
    payload: SubmissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
) -> SubmissionRead:
    payload.student_id = current_user.id
    submission = await assignment_service.submit_assignment(db, assignment_id, payload)
    return SubmissionRead.model_validate(submission)


@router.get("/{assignment_id}/submissions", response_model=list[SubmissionRead])
async def list_submissions(
    assignment_id: UUID,
    student_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SubmissionRead]:
    if current_user.role == UserRole.STUDENT:
        student_id = current_user.id
    else:
        assignment = await assignment_service.get_assignment_or_404(db, assignment_id)
        await course_service.ensure_course_owner(db, assignment.course_id, current_user)
    submissions = await assignment_service.list_submissions(db, assignment_id, student_id)
    return [SubmissionRead.model_validate(item) for item in submissions]
