"""Persistent memory and knowledge-base tables.

Owned primarily by the Agent service, but co-located in the LMS database so
that analytics and admin tooling can read them without an extra service.

Vector columns are sized to 1536 dims (OpenAI ``text-embedding-3-small``).
If the team switches to ``bge-m3`` (1024 dims) before Sprint 5, update the
column dimension in a follow-up migration.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SAEnum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, MemoryType, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.course import Lesson
    from app.models.user import User


EMBEDDING_DIM = 1536


class UserMemory(Base, UUIDMixin, TimestampMixin):
    """A discrete fact the Agent has remembered about a user."""

    __tablename__ = "user_memories"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[MemoryType] = mapped_column(
        SAEnum(MemoryType, name="memory_type", native_enum=False, length=32),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    # 0.0 (trivia) → 1.0 (mission-critical for personalisation).
    importance: Mapped[float] = mapped_column(Float, nullable=False, default=0.5)
    # User can hide a memory without deleting it.
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # Optional auto-expiration.
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Free-form metadata (source session, source message, tags...).
    extra: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    user: Mapped["User"] = relationship(back_populates="memories")
    embedding: Mapped["MemoryEmbedding | None"] = relationship(
        back_populates="memory", uselist=False, cascade="all, delete-orphan"
    )


class MemoryEmbedding(Base, TimestampMixin):
    """1:1 with UserMemory; isolated so the vector column is optional.

    Hybrid retrieval (Sprint 5) uses ``ivfflat`` index on ``embedding``.
    """

    __tablename__ = "memory_embeddings"

    memory_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_memories.id", ondelete="CASCADE"),
        primary_key=True,
    )
    embedding: Mapped[list[float]] = mapped_column(Vector(EMBEDDING_DIM), nullable=False)
    model_name: Mapped[str] = mapped_column(String(128), nullable=False)

    memory: Mapped[UserMemory] = relationship(back_populates="embedding")


class KnowledgeChunk(Base, UUIDMixin, TimestampMixin):
    """A chunk of lesson content embedded for RAG retrieval."""

    __tablename__ = "knowledge_chunks"

    lesson_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Stored alongside ``content`` so we can drop and rebuild without keeping
    # the embedder pinned at one version forever.
    model_name: Mapped[str] = mapped_column(String(128), nullable=False)
    embedding: Mapped[list[float]] = mapped_column(Vector(EMBEDDING_DIM), nullable=False)
    extra: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    lesson: Mapped["Lesson"] = relationship(back_populates="knowledge_chunks")


# Indexes for vector similarity (created by Alembic)
Index(
    "ix_knowledge_chunks_embedding_ivfflat",
    KnowledgeChunk.embedding,
    postgresql_using="ivfflat",
    postgresql_with={"lists": 100},
    postgresql_ops={"embedding": "vector_cosine_ops"},
)
Index(
    "ix_memory_embeddings_embedding_ivfflat",
    MemoryEmbedding.embedding,
    postgresql_using="ivfflat",
    postgresql_with={"lists": 100},
    postgresql_ops={"embedding": "vector_cosine_ops"},
)
