"""Quiz question CRUD routes."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_roles
from app.db.database import get_db
from app.models.base import AssignmentType, UserRole
from app.models.user import User
from app.schemas.quiz import (
    QuizQuestionCreate,
    QuizQuestionRead,
    QuizQuestionReadStudent,
    QuizQuestionUpdate,
)
from app.services import assignment_service, course_service, quiz_service

router = APIRouter(prefix="/assignments", tags=["quiz"])


@router.post(
    "/{assignment_id}/questions",
    response_model=QuizQuestionRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_question(
    assignment_id: UUID,
    payload: QuizQuestionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INSTRUCTOR, UserRole.ADMIN)),
) -> QuizQuestionRead:
    assignment = await assignment_service.get_assignment_or_404(db, assignment_id)
    await course_service.ensure_course_owner(db, assignment.course_id, current_user)
    question = await quiz_service.create_question(db, assignment_id, payload)
    return QuizQuestionRead.model_validate(question)


@router.get("/{assignment_id}/questions")
async def list_questions(
    assignment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns full questions (with answers) for lecturers/admins; hides answers for students."""
    questions = await quiz_service.list_questions(db, assignment_id)
    if current_user.role == UserRole.STUDENT:
        return [QuizQuestionReadStudent.model_validate(q) for q in questions]
    return [QuizQuestionRead.model_validate(q) for q in questions]


@router.put("/{assignment_id}/questions/{question_id}", response_model=QuizQuestionRead)
async def update_question(
    assignment_id: UUID,
    question_id: UUID,
    payload: QuizQuestionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INSTRUCTOR, UserRole.ADMIN)),
) -> QuizQuestionRead:
    assignment = await assignment_service.get_assignment_or_404(db, assignment_id)
    await course_service.ensure_course_owner(db, assignment.course_id, current_user)
    question = await quiz_service.update_question(db, question_id, payload)
    return QuizQuestionRead.model_validate(question)


@router.delete(
    "/{assignment_id}/questions/{question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_question(
    assignment_id: UUID,
    question_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.INSTRUCTOR, UserRole.ADMIN)),
) -> None:
    assignment = await assignment_service.get_assignment_or_404(db, assignment_id)
    await course_service.ensure_course_owner(db, assignment.course_id, current_user)
    await quiz_service.delete_question(db, question_id)
