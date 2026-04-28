"""Centralised settings using pydantic-settings.

All env vars live here. Anything reading ``os.getenv`` directly outside
this module is a code smell — funnel it through ``get_settings()``.
"""
from functools import lru_cache
from typing import List

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---- App ----
    app_name: str = "LMS Backend"
    app_version: str = "0.1.0"
    environment: str = Field(
        "development", description="development | staging | production"
    )
    debug: bool = True

    # ---- CORS ----
    cors_origins_raw: str = Field("http://localhost:3000", alias="CORS_ORIGINS")

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.cors_origins_raw.split(",") if o.strip()]

    # ---- Database ----
    database_url: str = Field(
        "postgresql+psycopg://lms:lms@localhost:5432/lms",
        alias="DATABASE_URL",
    )

    # ---- Redis ----
    redis_url: str = Field("redis://localhost:6379/0", alias="REDIS_URL")

    # ---- Object storage ----
    s3_endpoint: str = Field("http://localhost:9000", alias="S3_ENDPOINT")
    s3_access_key: str = Field("minio", alias="S3_ACCESS_KEY")
    s3_secret_key: str = Field("minio12345", alias="S3_SECRET_KEY")
    s3_bucket: str = Field("lms-uploads", alias="S3_BUCKET")

    # ---- Auth (user JWT) ----
    jwt_secret: str = Field("change-me-in-production", alias="JWT_SECRET")
    jwt_algorithm: str = "HS256"
    jwt_issuer: str = Field("lms-backend", alias="JWT_ISSUER")
    jwt_audience: str = Field("lms-clients", alias="JWT_AUDIENCE")
    access_token_minutes: int = 15
    refresh_token_days: int = 7

    # ---- Agent service ----
    agent_service_url: str = Field("http://localhost:8001", alias="AGENT_SERVICE_URL")
    # Shared secret used by the Agent service when calling /agent/tools/*.
    # In development we accept the placeholder value; production MUST set a
    # real >=32-byte token (e.g. ``openssl rand -hex 32``).
    agent_service_token: str = Field(
        "dev-agent-token-please-change",
        alias="AGENT_SERVICE_TOKEN",
        min_length=8,
    )

    # ---- Embeddings (for knowledge chunk ingestion) ----
    embedding_base_url: str = Field("https://api.openai.com/v1", alias="EMBEDDING_BASE_URL")
    embedding_api_key: str = Field("", alias="EMBEDDING_API_KEY")
    embedding_model: str = Field("text-embedding-3-small", alias="EMBEDDING_MODEL")

    # ---- LLM (chat / agent) ----
    llm_provider: str = Field("openai", alias="LLM_PROVIDER")  # openai | anthropic | ollama
    llm_api_key: str = Field("", alias="LLM_API_KEY")
    llm_base_url: str = Field("https://api.openai.com/v1", alias="LLM_BASE_URL")
    llm_model: str = Field("gpt-4o-mini", alias="LLM_MODEL")
    llm_temperature: float = Field(0.7, alias="LLM_TEMPERATURE")
    llm_max_tokens: int = Field(2048, alias="LLM_MAX_TOKENS")

    # ---- Mem0 (long-term memory) ----
    mem0_api_key: str = Field("", alias="MEM0_API_KEY")
    # Set to empty string to use the self-hosted OSS version via local DB.
    mem0_org_id: str = Field("", alias="MEM0_ORG_ID")
    mem0_project_id: str = Field("lms-chatbot", alias="MEM0_PROJECT_ID")
    # Qdrant endpoint for self-hosted Mem0 (leave blank to use Mem0 cloud).
    mem0_qdrant_url: str = Field("", alias="MEM0_QDRANT_URL")

    # ---- Chat ----
    chat_history_window: int = Field(20, alias="CHAT_HISTORY_WINDOW")
    chat_rag_top_k: int = Field(5, alias="CHAT_RAG_TOP_K")

    @field_validator("debug", mode="before")
    @classmethod
    def _coerce_debug(cls, value):
        if isinstance(value, bool) or value is None:
            return value
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on", "debug", "development"}:
                return True
            if normalized in {"0", "false", "no", "off", "release", "production"}:
                return False
        return value

    @model_validator(mode="after")
    def _validate_production_secrets(self) -> "Settings":
        if self.environment != "production":
            return self
        errors: list[str] = []
        if self.jwt_secret in ("change-me-in-production", ""):
            errors.append("JWT_SECRET must be set to a secure value (generate: openssl rand -hex 32)")
        elif len(self.jwt_secret) < 32:
            errors.append("JWT_SECRET must be at least 32 characters")
        if self.agent_service_token == "dev-agent-token-please-change":
            errors.append("AGENT_SERVICE_TOKEN must be set to a secure value (generate: openssl rand -hex 32)")
        elif len(self.agent_service_token) < 32:
            errors.append("AGENT_SERVICE_TOKEN must be at least 32 characters")
        if errors:
            raise ValueError("Production secrets not configured:\n  " + "\n  ".join(errors))
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
