"""Application settings loaded from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


def _get_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None or value == "":
        return default
    return int(value)


@dataclass(frozen=True)
class Settings:
    app_name: str
    api_host: str
    api_port: int
    log_level: str
    database_url: str
    llm_provider: str
    anthropic_api_key: str
    openai_api_key: str
    openai_base_url: str
    default_model: str
    default_max_tokens: int
    max_agent_steps: int
    embedding_provider: str
    embedding_model: str
    embedding_base_url: str
    embedding_dimensions: int
    short_term_max_turns: int
    short_term_recent_turns: int
    short_term_max_input_tokens: int
    lms_api_url: str
    agent_service_token: str
    jwt_secret: str
    jwt_algorithm: str
    jwt_issuer: str
    jwt_audience: str


_INSECURE_TOKEN = "dev-agent-token-please-change"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    s = Settings(
        app_name=os.getenv("APP_NAME", "A20 LMS Agent"),
        api_host=os.getenv("API_HOST", "0.0.0.0"),
        api_port=_get_int("API_PORT", 8001),
        log_level=os.getenv("LOG_LEVEL", "INFO"),
        database_url=os.getenv("DATABASE_URL", ""),
        llm_provider=os.getenv("LLM_PROVIDER", "openai_compatible"),
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY", ""),
        openai_api_key=os.getenv("OPENAI_API_KEY", ""),
        openai_base_url=os.getenv("OPENAI_BASE_URL", ""),
        default_model=os.getenv("DEFAULT_MODEL", "gpt-4o-mini"),
        default_max_tokens=_get_int("DEFAULT_MAX_TOKENS", 4096),
        max_agent_steps=_get_int("MAX_AGENT_STEPS", 8),
        embedding_provider=os.getenv("EMBEDDING_PROVIDER", "openai_compatible"),
        embedding_model=os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"),
        embedding_base_url=os.getenv("EMBEDDING_BASE_URL", ""),
        embedding_dimensions=_get_int("EMBEDDING_DIMENSIONS", 1536),
        short_term_max_turns=_get_int("SHORT_TERM_MAX_TURNS", 10),
        short_term_recent_turns=_get_int("SHORT_TERM_RECENT_TURNS", 8),
        short_term_max_input_tokens=_get_int("SHORT_TERM_MAX_INPUT_TOKENS", 12000),
        lms_api_url=os.getenv("LMS_API_URL", "http://localhost:8000"),
        agent_service_token=os.getenv("AGENT_SERVICE_TOKEN", _INSECURE_TOKEN),
        jwt_secret=os.getenv("JWT_SECRET", "change-me-in-production"),
        jwt_algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
        jwt_issuer=os.getenv("JWT_ISSUER", "lms-backend"),
        jwt_audience=os.getenv("JWT_AUDIENCE", "lms-clients"),
    )
    if os.getenv("ENVIRONMENT", "development") == "production":
        if s.agent_service_token == _INSECURE_TOKEN:
            raise RuntimeError(
                "AGENT_SERVICE_TOKEN must be changed from the default in production. "
                "Generate one with: openssl rand -hex 32"
            )
        if len(s.agent_service_token) < 32:
            raise RuntimeError("AGENT_SERVICE_TOKEN must be at least 32 characters in production.")
    return s


settings = get_settings()
