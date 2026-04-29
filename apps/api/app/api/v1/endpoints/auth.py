from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.auth import AuthUser, LoginRequest, LogoutResponse, RefreshTokenRequest, TokenResponse
from app.services.auth_service import login_user, map_user_to_auth_user, refresh_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    return await login_user(payload, db)


@router.get("/me", response_model=AuthUser)
async def me(current_user: User = Depends(require_current_user)) -> AuthUser:
    return map_user_to_auth_user(current_user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshTokenRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    return await refresh_access_token(payload.refresh_token, db)


@router.post("/logout", response_model=LogoutResponse)
async def logout(_: User = Depends(require_current_user)) -> LogoutResponse:
    return LogoutResponse(message="Logged out")
