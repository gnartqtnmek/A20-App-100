CREATE EXTENSION IF NOT EXISTS vector;

DO $$
BEGIN
    CREATE TYPE embedding_job_status AS ENUM ('pending', 'done', 'failed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS user_personalization (
    user_id        VARCHAR(255) PRIMARY KEY,
    data           JSONB NOT NULL DEFAULT '{}',
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memories (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL,
    mem0_memory_id   VARCHAR(255) UNIQUE,
    memory_type      VARCHAR(30) NOT NULL
        CHECK (memory_type IN ('weakness','preference','question','progress','achievement','other')),
    content          TEXT NOT NULL,
    course_id        UUID NULL,
    topic            VARCHAR(100) NULL,
    source           VARCHAR(20) NOT NULL DEFAULT 'mem0',
    relevance_score  DOUBLE PRECISION NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at       TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_memories_user_type
    ON memories (user_id, memory_type);

CREATE INDEX IF NOT EXISTS idx_memories_user_course
    ON memories (user_id, course_id)
    WHERE course_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_memories_user_type_topic
    ON memories (user_id, memory_type, topic);

CREATE TABLE IF NOT EXISTS conversations (
    id             UUID PRIMARY KEY,
    user_id        TEXT NOT NULL,
    title          TEXT,
    messages       JSONB NOT NULL DEFAULT '[]',
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
    ON conversations (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS conversation_summaries (
    id             BIGSERIAL PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id        TEXT NOT NULL,
    summary        TEXT NOT NULL,
    last_message_id BIGINT NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_summaries_user
    ON conversation_summaries (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS memory_summaries (
    id             BIGSERIAL PRIMARY KEY,
    user_id        TEXT NOT NULL UNIQUE,
    summary        TEXT NOT NULL,
    conversation_ids_hash TEXT NOT NULL DEFAULT '',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_embeddings (
    id             BIGSERIAL PRIMARY KEY,
    chunk_id       UUID NOT NULL,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    turn_index     INT NOT NULL,
    message_ids    BIGINT[] NOT NULL,
    chunk_text     TEXT NOT NULL,
    embedding      VECTOR(1536),
    user_id        TEXT NOT NULL,
    chunk_seq      INT NOT NULL DEFAULT 1,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (chunk_id)
);

CREATE INDEX IF NOT EXISTS idx_message_embeddings_user
    ON message_embeddings (user_id, conversation_id, turn_index);

CREATE TABLE IF NOT EXISTS embedding_jobs (
    id             BIGSERIAL PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    turn_index     INT NOT NULL,
    status         embedding_job_status NOT NULL DEFAULT 'pending',
    error          TEXT,
    retry_count    INT NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (conversation_id, turn_index)
);
