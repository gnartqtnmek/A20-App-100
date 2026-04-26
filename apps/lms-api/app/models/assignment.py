"""Assignment, Submission, QuizQuestion, Grade."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import (
    AssignmentType,
    Base,
    QuizQuestionType,
    SubmissionStatus,
    TimestampMixin,
    UUIDMixin,
)

if TYPE_CHECKING:
    from app.models.course import Course
    from app.models.user import User


class Assignment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "assignments"

    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    type: Mapped[AssignmentType] = mapped_column(
        SAEnum(AssignmentType, name="assignment_type", native_enum=False, length=32),
        nullable=False,
    )
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    max_score: Mapped[float] = mapped_column(Float, nullable=False, default=10.0)
    weight: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    rubric: Mapped[list[dict] | None] = mapped_column(JSONB, nullable=True)
    attachments: Mapped[list[dict]] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]"
    )
    time_limit_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    allow_late: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    course: Mapped["Course"] = relationship(back_populates="assignments")
    submissions: Mapped[list["Submission"]] = relationship(
        back_populates="assignment", cascade="all, delete-orphan"
    )
    quiz_questions: Mapped[list["QuizQuestion"]] = relationship(
        back_populates="assignment",
        cascade="all, delete-orphan",
        order_by="QuizQuestion.order_index",
    )
    grades: Mapped[list["Grade"]] = relationship(
        back_populates="assignment", cascade="all, delete-orphan"
    )


class QuizQuestion(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "quiz_questions"

    assignment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assignments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[QuizQuestionType] = mapped_column(
        SAEnum(QuizQuestionType, name="quiz_question_type", native_enum=False, length=32),
        nullable=False,
    )
    options: Mapped[list[dict]] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]"
    )
    correct_answer: Mapped[dict] = mapped_column(JSONB, nullable=False)
    points: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    assignment: Mapped[Assignment] = relationship(back_populates="quiz_questions")


class Submission(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "submissions"
    __table_args__ = (
        UniqueConstraint(
            "assignment_id", "student_id", name="uq_submission_assignment_student"
        ),
    )

    assignment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assignments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    quiz_answers: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    status: Mapped[SubmissionStatus] = mapped_column(
        SAEnum(SubmissionStatus, name="submission_status", native_enum=False, length=32),
        nullable=False,
        default=SubmissionStatus.DRAFT,
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    graded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    graded_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    assignment: Mapped[Assignment] = relationship(back_populates="submissions")
    student: Mapped["User"] = relationship(
        back_populates="submissions", foreign_keys=[student_id]
    )


class Grade(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "grades"

    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assignment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("assignments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    score: Mapped[float] = mapped_column(Float, nullable=False)
    max_score: Mapped[float] = mapped_column(Float, nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    student: Mapped["User"] = relationship(back_populates="grades")
    assignment: Mapped[Assignment] = relationship(back_populates="grades")
