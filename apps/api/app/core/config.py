from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Brainio LMS API"
    app_env: str = "development"
    cors_origins: list[str] = ["http://127.0.0.1:3000"]

    database_url: str = "postgresql+asyncpg://postgres:postgres@127.0.0.1:55432/brainio"
    redis_url: str = "redis://127.0.0.1:56379/0"

    jwt_secret: str = "brainio-dev-secret"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_minutes: int = 60 * 24 * 7
    password_min_length: int = 8

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: Any) -> Any:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


settings = Settings()
