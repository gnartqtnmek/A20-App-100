from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles
from app.core.roles import UserRole
from app.db.session import get_db
from app.schemas.common import MessageResponse
from app.schemas.user import UserCreate, UserListResponse, UserOut, UserUpdate
from app.services.user_service import create_user, delete_user, get_user_by_id, list_users, map_user_out, update_user

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=UserListResponse, dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def get_users(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> UserListResponse:
    items, total = await list_users(page=page, limit=limit, db=db)
    return UserListResponse(items=items, total=total, page=page, limit=limit)


@router.post(
    "",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
async def create_user_endpoint(payload: UserCreate, db: AsyncSession = Depends(get_db)) -> UserOut:
    return await create_user(payload, db)


@router.get("/{user_id}", response_model=UserOut, dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def get_user_endpoint(user_id: str, db: AsyncSession = Depends(get_db)) -> UserOut:
    user = await get_user_by_id(user_id, db)
    return map_user_out(user)


@router.put("/{user_id}", response_model=UserOut, dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def update_user_endpoint(user_id: str, payload: UserUpdate, db: AsyncSession = Depends(get_db)) -> UserOut:
    return await update_user(user_id, payload, db)


@router.delete("/{user_id}", response_model=MessageResponse, dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def delete_user_endpoint(user_id: str, db: AsyncSession = Depends(get_db)) -> MessageResponse:
    await delete_user(user_id, db)
    return MessageResponse(message="User deleted")
