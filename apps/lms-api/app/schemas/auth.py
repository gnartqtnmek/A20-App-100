"""Schemas for auth and session APIs."""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from app.models.base import UserRole
from app.schemas.user import LecturerProfileCreate, StudentProfileCreate, UserRead


class RegisterRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    full_name: str = Field(min_length=2, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.STUDENT
    avatar_url: str | None = Field(default=None, max_length=500)
    student_profile: StudentProfileCreate | None = None
    lecturer_profile: LecturerProfileCreate | None = None

    @field_validator("role", mode="before")
    @classmethod
    def _normalize_legacy_role(cls, value: object) -> object:
        if isinstance(value, str) and value.strip().lower() == "lecturer":
            return UserRole.INSTRUCTOR.value
        return value


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPairRead(BaseModel):
    token_type: str = "bearer"
    access_token: str
    refresh_token: str
    access_token_expires_in: int
    refresh_token_expires_in: int


class AuthResponse(BaseModel):
    user: UserRead
    tokens: TokenPairRead
