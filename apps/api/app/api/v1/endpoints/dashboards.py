from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import require_current_user
from app.core.roles import UserRole
from app.models import User
from app.schemas.dashboard import DashboardSummaryResponse
from app.services.dashboard_service import get_dashboard_summary
from app.services.role_catalog import parse_role

router = APIRouter(prefix="/dashboards", tags=["Dashboards"])


@router.get("/{role}", response_model=DashboardSummaryResponse)
async def get_dashboard_by_role(role: str, current_user: User = Depends(require_current_user)) -> DashboardSummaryResponse:
    try:
        parsed_role = parse_role(role)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    if current_user.role != UserRole.ADMIN.value and current_user.role != parsed_role.value:
        raise HTTPException(status_code=403, detail="Not allowed to access this dashboard")
    return get_dashboard_summary(parsed_role)
