"""ORM models — re-exported for convenience.

Importing this package side-effect-loads every model module, ensuring that
``Base.metadata`` knows about every table before Alembic generates its
migration plan.
"""
from app.models.assignment import Assignment, Grade, QuizQuestion, Submission
from app.models.base import (
    AssignmentType,
    Base,
    ChatMessageRole,
    EnrollmentStatus,
    MemoryType,
    NotificationType,
    QuizQuestionType,
    SubmissionStatus,
    TimestampMixin,
    UUIDMixin,
    UserRole,
)
from app.models.chat import AgentRun, ChatMessage, ChatSession
from app.models.course import Course, CourseEnrollment, Lesson, Module
from app.models.memory import EMBEDDING_DIM, KnowledgeChunk, MemoryEmbedding, UserMemory
from app.models.notification import Notification
from app.models.user import LecturerProfile, RefreshToken, StudentProfile, User

__all__ = [
    # Base
    "Base",
    "UUIDMixin",
    "TimestampMixin",
    # Enums
    "UserRole",
    "EnrollmentStatus",
    "AssignmentType",
    "SubmissionStatus",
    "QuizQuestionType",
    "NotificationType",
    "ChatMessageRole",
    "MemoryType",
    # Identity
    "User",
    "StudentProfile",
    "LecturerProfile",
    "RefreshToken",
    # LMS
    "Course",
    "Module",
    "Lesson",
    "CourseEnrollment",
    "Assignment",
    "QuizQuestion",
    "Submission",
    "Grade",
    "Notification",
    # Chat / Memory
    "ChatSession",
    "ChatMessage",
    "AgentRun",
    "UserMemory",
    "MemoryEmbedding",
    "KnowledgeChunk",
    "EMBEDDING_DIM",
]
