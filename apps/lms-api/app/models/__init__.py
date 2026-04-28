"""ORM models — re-exported for convenience.

Importing this package side-effect-loads every model module, ensuring
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
from app.models.memory import EMBEDDING_DIM, KnowledgeChunk, Memory, MemoryEmbedding, UserMemory
from app.models.notification import Notification
from app.models.user import LecturerProfile, RefreshToken, StudentProfile, User

__all__ = [
    "Base",
    "UUIDMixin",
    "TimestampMixin",
    "UserRole",
    "EnrollmentStatus",
    "AssignmentType",
    "SubmissionStatus",
    "QuizQuestionType",
    "NotificationType",
    "ChatMessageRole",
    "MemoryType",
    "User",
    "StudentProfile",
    "LecturerProfile",
    "RefreshToken",
    "Course",
    "Module",
    "Lesson",
    "CourseEnrollment",
    "Assignment",
    "QuizQuestion",
    "Submission",
    "Grade",
    "Notification",
    "ChatSession",
    "ChatMessage",
    "AgentRun",
    "Memory",
    "UserMemory",
    "MemoryEmbedding",
    "KnowledgeChunk",
    "EMBEDDING_DIM",
]
