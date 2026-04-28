"""Business logic for quiz question management."""
from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assignment import Assignment, QuizQuestion
from app.models.base import AssignmentType
from app.schemas.quiz import QuizQuestionCreate, QuizQuestionUpdate


async def _get_quiz_assignment_or_404(db: AsyncSession, assignment_id: UUID) -> Assignment:
    assignment = await db.get(Assignment, assignment_id)
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    if assignment.type != AssignmentType.QUIZ:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment is not a quiz",
        )
    return assignment


async def get_question_or_404(db: AsyncSession, question_id: UUID) -> QuizQuestion:
    question = await db.get(QuizQuestion, question_id)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return question


async def create_question(
    db: AsyncSession,
    assignment_id: UUID,
    payload: QuizQuestionCreate,
) -> QuizQuestion:
    await _get_quiz_assignment_or_404(db, assignment_id)
    question = QuizQuestion(
        assignment_id=assignment_id,
        question=payload.question.strip(),
        type=payload.type,
        options=payload.options,
        correct_answer=payload.correct_answer,
        points=payload.points,
        explanation=payload.explanation,
        order_index=payload.order_index,
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)
    return question


async def list_questions(db: AsyncSession, assignment_id: UUID) -> list[QuizQuestion]:
    await _get_quiz_assignment_or_404(db, assignment_id)
    stmt = (
        select(QuizQuestion)
        .where(QuizQuestion.assignment_id == assignment_id)
        .order_by(QuizQuestion.order_index.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def update_question(
    db: AsyncSession,
    question_id: UUID,
    payload: QuizQuestionUpdate,
) -> QuizQuestion:
    question = await get_question_or_404(db, question_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(question, field, value)
    await db.commit()
    await db.refresh(question)
    return question


async def delete_question(db: AsyncSession, question_id: UUID) -> None:
    question = await get_question_or_404(db, question_id)
    await db.delete(question)
    await db.commit()
