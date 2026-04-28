"""Align courses/memories schema with ERD contract.

Revision ID: 0003
Revises: 0002
Create Date: 2026-04-28 17:30:00
"""
from __future__ import annotations

from typing import Sequence

from alembic import op

revision: str = "0003"
down_revision: str | Sequence[str] | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ---- courses.lecturer_id -> courses.instructor_id (safe rename) ----
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'courses' AND column_name = 'lecturer_id'
            ) AND NOT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'courses' AND column_name = 'instructor_id'
            ) THEN
                ALTER TABLE courses RENAME COLUMN lecturer_id TO instructor_id;
            END IF;
        END$$;
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'ix_courses_lecturer_id'
            ) THEN
                ALTER INDEX ix_courses_lecturer_id RENAME TO ix_courses_instructor_id;
            END IF;
        END$$;
        """
    )
    op.execute("DROP VIEW IF EXISTS courses_legacy")
    op.execute(
        """
        CREATE VIEW courses_legacy AS
        SELECT
            id,
            code,
            name,
            description,
            syllabus_md,
            instructor_id AS lecturer_id,
            semester,
            is_published,
            invite_code,
            cover_image_url,
            created_at,
            updated_at
        FROM courses
        """
    )

    # ---- introduce ERD-compatible memories table ----
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS memories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            mem0_memory_id VARCHAR(255) UNIQUE,
            memory_type VARCHAR(32) NOT NULL
                CHECK (memory_type IN ('weakness','preference','question','progress','achievement','other')),
            content TEXT NOT NULL,
            course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
            topic VARCHAR(100),
            source VARCHAR(20) NOT NULL DEFAULT 'mem0',
            relevance_score FLOAT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMPTZ
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_memories_user_id ON memories (user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_memories_memory_type ON memories (memory_type)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_memories_course_id ON memories (course_id)")

    # Copy legacy data if present and memories is empty.
    op.execute(
        """
        INSERT INTO memories (
            id,
            user_id,
            mem0_memory_id,
            memory_type,
            content,
            topic,
            source,
            relevance_score,
            created_at,
            updated_at,
            expires_at
        )
        SELECT
            um.id,
            um.user_id,
            um.extra ->> 'mem0_id' AS mem0_memory_id,
            CASE um.type::text
                WHEN 'weakness' THEN 'weakness'
                WHEN 'preference' THEN 'preference'
                WHEN 'achievement' THEN 'achievement'
                WHEN 'profile' THEN 'progress'
                WHEN 'fact' THEN 'other'
                ELSE 'other'
            END AS memory_type,
            um.content,
            um.extra ->> 'topic' AS topic,
            COALESCE(um.extra ->> 'source', 'manual') AS source,
            um.importance AS relevance_score,
            um.created_at,
            um.updated_at,
            um.expires_at
        FROM user_memories um
        WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_memories')
          AND NOT EXISTS (SELECT 1 FROM memories LIMIT 1)
        ON CONFLICT (id) DO NOTHING
        """
    )

    # Rebind memory_embeddings FK to new memories table.
    op.execute(
        """
        DO $$
        DECLARE
            fk_name TEXT;
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memory_embeddings') THEN
                SELECT conname INTO fk_name
                FROM pg_constraint
                WHERE conrelid = 'memory_embeddings'::regclass
                  AND contype = 'f'
                LIMIT 1;

                IF fk_name IS NOT NULL THEN
                    EXECUTE format('ALTER TABLE memory_embeddings DROP CONSTRAINT %I', fk_name);
                END IF;

                ALTER TABLE memory_embeddings
                    ADD CONSTRAINT fk_memory_embeddings_memory_id_memories
                    FOREIGN KEY (memory_id) REFERENCES memories(id) ON DELETE CASCADE;
            END IF;
        END$$;
        """
    )


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS courses_legacy")
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'courses' AND column_name = 'instructor_id'
            ) AND NOT EXISTS (
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'courses' AND column_name = 'lecturer_id'
            ) THEN
                ALTER TABLE courses RENAME COLUMN instructor_id TO lecturer_id;
            END IF;
        END$$;
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_class WHERE relkind = 'i' AND relname = 'ix_courses_instructor_id'
            ) THEN
                ALTER INDEX ix_courses_instructor_id RENAME TO ix_courses_lecturer_id;
            END IF;
        END$$;
        """
    )
