from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_current_user
from app.core.roles import UserRole
from app.db.session import get_db
from app.models import User
from app.schemas.sprint67 import RoleReportItem, RoleReportOut
from app.services.sprint67_service import build_role_report

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/{role}", response_model=RoleReportOut)
async def get_role_report(
    role: str,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> RoleReportOut:
    normalized = role.strip().lower()
    if normalized not in {item.value for item in UserRole}:
        raise HTTPException(status_code=404, detail="Unsupported role report")
    if current_user.role != UserRole.ADMIN.value and current_user.role != normalized:
        raise HTTPException(status_code=403, detail="Not allowed to access this report")
    items = await build_role_report(normalized, current_user, db)
    return RoleReportOut(
        role=normalized,
        title=f"{normalized.replace('_', ' ').title()} Report",
        generated_at=datetime.utcnow(),
        items=[RoleReportItem(key=item["key"], value=item["value"]) for item in items],
    )
