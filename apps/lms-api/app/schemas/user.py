"""Schemas for user management APIs."""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.base import UserRole


class StudentProfileCreate(BaseModel):
    student_code: str = Field(min_length=3, max_length=64)
    major: str | None = Field(default=None, max_length=255)
    year: int | None = Field(default=None, ge=1, le=8)
    preferences: dict = Field(default_factory=dict)


class LecturerProfileCreate(BaseModel):
    employee_code: str = Field(min_length=3, max_length=64)
    department: str | None = Field(default=None, max_length=255)
    title: str | None = Field(default=None, max_length=255)


class UserCreate(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    full_name: str = Field(min_length=2, max_length=255)
    role: UserRole = UserRole.STUDENT
    password: str | None = Field(default=None, min_length=8, max_length=128)
    avatar_url: str | None = Field(default=None, max_length=500)
    student_profile: StudentProfileCreate | None = None
    lecturer_profile: LecturerProfileCreate | None = None

    @field_validator("role", mode="before")
    @classmethod
    def _normalize_legacy_role(cls, value: object) -> object:
        if isinstance(value, str) and value.strip().lower() == "lecturer":
            return UserRole.INSTRUCTOR.value
        return value


class StudentProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    student_code: str
    major: str | None
    year: int | None
    preferences: dict


class LecturerProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    employee_code: str
    department: str | None
    title: str | None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    full_name: str
    role: UserRole
    avatar_url: str | None
    is_active: bool
    is_email_verified: bool
    created_at: datetime
    updated_at: datetime
    student_profile: StudentProfileRead | None
    lecturer_profile: LecturerProfileRead | None
