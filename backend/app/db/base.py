"""Single import point that loads all ORM models into ``Base.metadata``.

Alembic's ``env.py`` imports ``app.db.base`` to populate ``target_metadata``;
this guarantees every table is registered exactly once.
"""
# Re-export Base so Alembic can do ``from app.db.base import Base``.
from app.models import (  # noqa: F401  (intentional side-effect import)
    AgentRun,
    Assignment,
    Base,
    ChatMessage,
    ChatSession,
    Course,
    CourseEnrollment,
    Grade,
    KnowledgeChunk,
    LecturerProfile,
    Lesson,
    MemoryEmbedding,
    Module,
    Notification,
    QuizQuestion,
    RefreshToken,
    StudentProfile,
    Submission,
    User,
    UserMemory,
)
