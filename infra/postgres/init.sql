-- Init script applied on first container start.
-- Enables pgvector for embedding columns (memory_embeddings, knowledge_chunks).

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;        -- fuzzy text search
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";    -- uuid_generate_v4()

-- Default search path stays public; Alembic migrations will create tables
-- when Sprint 1 lands.

-- Sanity check that pgvector is available
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        RAISE EXCEPTION 'pgvector extension failed to load';
    END IF;
END $$;
