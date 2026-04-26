"""Course, Module, Lesson, Enrollment."""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, EnrollmentStatus, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.assignment import Assignment
    from app.models.user import User
    from app.models.memory import KnowledgeChunk


class Course(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "courses"

    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    syllabus_md: Mapped[str | None] = mapped_column(Text, nullable=True)
    lecturer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    semester: Mapped[str | None] = mapped_column(String(32), nullable=True)
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    invite_code: Mapped[str | None] = mapped_column(
        String(32), unique=True, nullable=True, index=True
    )
    cover_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    lecturer: Mapped["User"] = relationship(
        back_populates="courses_taught", foreign_keys=[lecturer_id]
    )
    modules: Mapped[list["Module"]] = relationship(
        back_populates="course",
        cascade="all, delete-orphan",
        order_by="Module.order_index",
    )
    enrollments: Mapped[list["CourseEnrollment"]] = relationship(
        back_populates="course", cascade="all, delete-orphan"
    )
    assignments: Mapped[list["Assignment"]] = relationship(
        back_populates="course", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Course {self.code} {self.name!r}>"


class Module(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "modules"

    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    course: Mapped[Course] = relationship(back_populates="modules")
    lessons: Mapped[list["Lesson"]] = relationship(
        back_populates="module",
        cascade="all, delete-orphan",
        order_by="Lesson.order_index",
    )


class Lesson(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "lessons"

    module_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("modules.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_md: Mapped[str | None] = mapped_column(Text, nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    attachments: Mapped[list[dict]] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]"
    )
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)

    module: Mapped[Module] = relationship(back_populates="lessons")
    knowledge_chunks: Mapped[list["KnowledgeChunk"]] = relationship(
        back_populates="lesson", cascade="all, delete-orphan"
    )


class CourseEnrollment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "course_enrollments"
    __table_args__ = (
        UniqueConstraint(
            "course_id", "student_id", name="uq_enrollment_course_student"
        ),
    )

    course_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[EnrollmentStatus] = mapped_column(
        SAEnum(EnrollmentStatus, name="enrollment_status", native_enum=False, length=32),
        nullable=False,
        default=EnrollmentStatus.ACTIVE,
    )
    enrolled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    course: Mapped[Course] = relationship(back_populates="enrollments")
    student: Mapped["User"] = relationship(back_populates="enrollments")
