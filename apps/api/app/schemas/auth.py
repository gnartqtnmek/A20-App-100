from pydantic import BaseModel, field_validator

from app.core.roles import UserRole


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        if "@" not in normalized or "." not in normalized.split("@")[-1]:
            raise ValueError("Invalid email format")
        return normalized


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class AuthUser(BaseModel):
    id: str
    full_name: str
    email: str
    role: UserRole
    is_active: bool


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: AuthUser


class LogoutResponse(BaseModel):
    message: str
