from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_current_user, require_roles
from app.core.roles import UserRole
from app.db.session import get_db
from app.models import User
from app.schemas.sprint67 import AnnouncementCreate, NotificationCreate
from app.services.sprint67_service import (
    create_announcement,
    create_notification,
    list_announcements,
    list_audit_logs,
    list_notifications,
    list_uploaded_files,
    mark_notification_read,
    upload_file,
)

router = APIRouter(tags=["Platform"])


@router.post("/notifications", dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.LECTURER, UserRole.ACADEMIC_STAFF, UserRole.ADVISOR))])
async def post_notification(
    payload: NotificationCreate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await create_notification(payload, current_user.id, db)}


@router.get("/notifications")
async def get_notifications(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    items, meta = await list_notifications(current_user.id, page, limit, db)
    return {"items": items, "meta": meta}


@router.patch("/notifications/{notification_id}/read")
async def patch_notification_read(
    notification_id: str,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await mark_notification_read(notification_id, current_user.id, db)}


@router.post("/announcements", dependencies=[Depends(require_roles(UserRole.ADMIN, UserRole.ACADEMIC_STAFF, UserRole.LECTURER))])
async def post_announcement(
    payload: AnnouncementCreate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await create_announcement(payload, current_user.id, db)}


@router.get("/announcements")
async def get_announcements(
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"items": await list_announcements(current_user.role, db)}


@router.get("/admin/audit-logs", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def get_audit_logs(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    action: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    items, meta = await list_audit_logs(page, limit, action, db)
    return {"items": items, "meta": meta}


@router.post("/files/upload")
async def post_upload_file(
    module: str = Form(default="general"),
    file: UploadFile = File(...),
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await upload_file(current_user.id, module, file, db)}


@router.get("/files")
async def get_uploaded_files(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    items, meta = await list_uploaded_files(current_user.id, page, limit, db)
    return {"items": items, "meta": meta}
