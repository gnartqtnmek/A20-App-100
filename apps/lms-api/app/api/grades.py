"""Gradebook APIs."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_roles
from app.db.database import get_db
from app.models.base import UserRole
from app.models.user import User
from app.schemas.assignment import GradeCreate, GradeRead
from app.services import assignment_service, course_service

router = APIRouter(prefix="/grades", tags=["grades"])


@router.post(
    "/submissions/{submission_id}",
    response_model=GradeRead,
    status_code=status.HTTP_201_CREATED,
)
async def grade_submission(
    submission_id: UUID,
    payload: GradeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.LECTURER, UserRole.ADMIN)),
) -> GradeRead:
    submission = await assignment_service.get_submission_or_404(db, submission_id)
    assignment = await assignment_service.get_assignment_or_404(db, submission.assignment_id)
    await course_service.ensure_course_owner(db, assignment.course_id, current_user)
    grade = await assignment_service.grade_submission(db, submission_id, payload, current_user.id)
    return GradeRead.model_validate(grade)


@router.get("/courses/{course_id}", response_model=list[GradeRead])
async def list_course_grades(
    course_id: UUID,
    student_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[GradeRead]:
    if current_user.role == UserRole.STUDENT:
        student_id = current_user.id
    else:
        await course_service.ensure_course_owner(db, course_id, current_user)

    grades = await assignment_service.list_grades_by_course(db, course_id, student_id)
    return [GradeRead.model_validate(item) for item in grades]
