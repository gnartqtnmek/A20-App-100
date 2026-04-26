"""Centralised settings using pydantic-settings.

All env vars live here. Anything reading ``os.getenv`` directly outside
this module is a code smell — funnel it through ``get_settings()``.
"""
from functools import lru_cache
from typing import List

from pydantic import Field
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


@lru_cache
def get_settings() -> Settings:
    return Settings()
