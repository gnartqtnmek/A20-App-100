from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_current_user
from app.db.session import get_db
from app.models import User
from app.schemas.user import UserOut, UserProfileUpdate
from app.services.user_service import map_user_out, update_profile

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("", response_model=UserOut)
async def get_my_profile(current_user: User = Depends(require_current_user)) -> UserOut:
    return map_user_out(current_user)


@router.put("", response_model=UserOut)
async def update_my_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    return await update_profile(current_user, payload, db)
