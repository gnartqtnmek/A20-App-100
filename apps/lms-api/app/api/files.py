"""File upload endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile, status
from pydantic import BaseModel

from app.core.deps import get_current_user
from app.models.user import User
from app.services.file_service import (
    store_assignment_file,
    store_avatar,
    store_lesson_attachment,
    validate_upload,
)

router = APIRouter(prefix="/files", tags=["files"])


class UploadResult(BaseModel):
    object_key: str
    url: str
    filename: str
    content_type: str
    size: int


@router.post(
    "/assignments",
    response_model=UploadResult,
    status_code=status.HTTP_201_CREATED,
    summary="Upload assignment submission file",
)
async def upload_assignment_file(
    file: UploadFile = File(...),
    _: User = Depends(get_current_user),
) -> UploadResult:
    content = await file.read()
    validate_upload(file.filename or "file", len(content), file.content_type or "")
    import io

    key, url = await store_assignment_file(io.BytesIO(content), file.filename or "upload")
    return UploadResult(
        object_key=key,
        url=url,
        filename=file.filename or "upload",
        content_type=file.content_type or "",
        size=len(content),
    )


@router.post(
    "/avatars",
    response_model=UploadResult,
    status_code=status.HTTP_201_CREATED,
    summary="Upload user avatar",
)
async def upload_avatar(
    file: UploadFile = File(...),
    _: User = Depends(get_current_user),
) -> UploadResult:
    content = await file.read()
    validate_upload(file.filename or "avatar", len(content), file.content_type or "")
    import io

    key, url = await store_avatar(io.BytesIO(content), file.filename or "avatar")
    return UploadResult(
        object_key=key,
        url=url,
        filename=file.filename or "avatar",
        content_type=file.content_type or "",
        size=len(content),
    )


@router.post(
    "/lessons",
    response_model=UploadResult,
    status_code=status.HTTP_201_CREATED,
    summary="Upload lesson attachment (lecturer only)",
)
async def upload_lesson_attachment(
    file: UploadFile = File(...),
    _: User = Depends(get_current_user),
) -> UploadResult:
    content = await file.read()
    validate_upload(file.filename or "file", len(content), file.content_type or "")
    import io

    key, url = await store_lesson_attachment(io.BytesIO(content), file.filename or "file")
    return UploadResult(
        object_key=key,
        url=url,
        filename=file.filename or "file",
        content_type=file.content_type or "",
        size=len(content),
    )
