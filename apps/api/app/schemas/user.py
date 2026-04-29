from pydantic import BaseModel, Field, field_validator

from app.core.roles import UserRole


class UserBase(BaseModel):
    email: str
    full_name: str = Field(min_length=2, max_length=120)
    role: UserRole
    department_id: str | None = None
    program_id: str | None = None
    is_active: bool = True

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or "." not in normalized.split("@")[-1]:
            raise ValueError("Invalid email format")
        return normalized


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    role: UserRole | None = None
    department_id: str | None = None
    program_id: str | None = None
    is_active: bool | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=120)


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    department_id: str | None = None
    program_id: str | None = None
    is_active: bool


class UserListResponse(BaseModel):
    items: list[UserOut]
    total: int
    page: int
    limit: int
