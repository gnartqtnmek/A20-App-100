from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import require_current_user
from app.core.roles import UserRole
from app.models import User
from app.schemas.modules import RoleModuleResponse
from app.services.role_catalog import ROLE_NAVIGATION, parse_role

router = APIRouter(prefix="/modules", tags=["Modules"])


@router.get("/{role}", response_model=RoleModuleResponse)
async def get_modules_by_role(role: str, current_user: User = Depends(require_current_user)) -> RoleModuleResponse:
    try:
        parsed_role = parse_role(role)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    if current_user.role != UserRole.ADMIN.value and current_user.role != parsed_role.value:
        raise HTTPException(status_code=403, detail="Not allowed to access modules for this role")
    return RoleModuleResponse(role=parsed_role, modules=ROLE_NAVIGATION[parsed_role])
