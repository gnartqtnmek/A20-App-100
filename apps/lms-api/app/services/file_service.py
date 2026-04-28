"""File upload service — delegates to S3/MinIO via infra/storage."""
from __future__ import annotations

import logging
from typing import BinaryIO

from app.infra.storage import delete_file, upload_file

logger = logging.getLogger(__name__)

_ALLOWED_MIME_PREFIXES = (
    "image/",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats",
    "text/plain",
    "text/csv",
    "application/zip",
)

_MAX_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB


def validate_upload(filename: str, size: int, content_type: str) -> None:
    if size > _MAX_SIZE_BYTES:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {_MAX_SIZE_BYTES // 1_048_576} MB.",
        )
    allowed = any(content_type.startswith(p) for p in _ALLOWED_MIME_PREFIXES)
    if not allowed:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type '{content_type}' is not allowed.",
        )


async def store_assignment_file(file_obj: BinaryIO, original_filename: str) -> tuple[str, str]:
    """Upload an assignment submission file. Returns (object_key, url)."""
    return await upload_file(file_obj, original_filename, folder="assignments")


async def store_avatar(file_obj: BinaryIO, original_filename: str) -> tuple[str, str]:
    return await upload_file(file_obj, original_filename, folder="avatars")


async def store_lesson_attachment(file_obj: BinaryIO, original_filename: str) -> tuple[str, str]:
    return await upload_file(file_obj, original_filename, folder="lessons")


async def remove_file(object_key: str) -> None:
    try:
        await delete_file(object_key)
    except Exception:
        logger.warning("Failed to delete file %s", object_key, exc_info=True)
