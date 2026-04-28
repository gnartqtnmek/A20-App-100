"""Schemas for quiz question CRUD."""
from __future__ import annotations

from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.base import QuizQuestionType


class QuizQuestionCreate(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    type: QuizQuestionType
    options: list[dict] = Field(
        default_factory=list,
        description="List of {label, value} objects. Required for single_choice/multi_choice.",
    )
    correct_answer: dict = Field(
        description=(
            "For single_choice: {value: 'A'}. "
            "For multi_choice: {values: ['A','C']}. "
            "For true_false: {value: true}."
        )
    )
    points: float = Field(default=1.0, gt=0)
    explanation: str | None = None
    order_index: int = Field(default=0, ge=0)


class QuizQuestionUpdate(BaseModel):
    question: str | None = Field(default=None, min_length=1, max_length=2000)
    type: QuizQuestionType | None = None
    options: list[dict] | None = None
    correct_answer: dict | None = None
    points: float | None = Field(default=None, gt=0)
    explanation: str | None = None
    order_index: int | None = Field(default=None, ge=0)


class QuizQuestionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    assignment_id: UUID
    question: str
    type: QuizQuestionType
    options: list[dict]
    correct_answer: dict
    points: float
    explanation: str | None
    order_index: int
    created_at: datetime
    updated_at: datetime


class QuizQuestionReadStudent(BaseModel):
    """Quiz question without correct_answer — sent to students during attempt."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    assignment_id: UUID
    question: str
    type: QuizQuestionType
    options: list[dict]
    points: float
    order_index: int
