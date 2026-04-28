"""Async S3 / MinIO object-storage client.

Thin async wrappers around boto3 (sync). All calls run in a thread pool.
"""
from __future__ import annotations

import asyncio
import logging
import mimetypes
import uuid
from functools import lru_cache
from pathlib import PurePosixPath
from typing import BinaryIO

import boto3
from botocore.client import Config

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _s3_client():
    from app.core.config import get_settings

    s = get_settings()
    return boto3.client(
        "s3",
        endpoint_url=s.s3_endpoint,
        aws_access_key_id=s.s3_access_key,
        aws_secret_access_key=s.s3_secret_key,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


def _ensure_bucket(bucket: str) -> None:
    client = _s3_client()
    try:
        client.head_bucket(Bucket=bucket)
    except client.exceptions.ClientError:
        client.create_bucket(Bucket=bucket)
        client.put_bucket_policy(
            Bucket=bucket,
            Policy=f'{{"Version":"2012-10-17","Statement":[{{"Effect":"Allow","Principal":"*","Action":"s3:GetObject","Resource":"arn:aws:s3:::{bucket}/*"}}]}}',
        )


async def upload_file(
    file_obj: BinaryIO,
    original_filename: str,
    *,
    folder: str = "uploads",
) -> tuple[str, str]:
    """Upload *file_obj* and return ``(object_key, public_url)``."""
    from app.core.config import get_settings

    s = get_settings()
    loop = asyncio.get_event_loop()

    ext = PurePosixPath(original_filename).suffix
    key = f"{folder}/{uuid.uuid4().hex}{ext}"
    content_type = mimetypes.guess_type(original_filename)[0] or "application/octet-stream"

    def _upload():
        _ensure_bucket(s.s3_bucket)
        _s3_client().upload_fileobj(
            file_obj,
            s.s3_bucket,
            key,
            ExtraArgs={"ContentType": content_type},
        )

    await loop.run_in_executor(None, _upload)

    public_url = f"{s.s3_endpoint.rstrip('/')}/{s.s3_bucket}/{key}"
    return key, public_url


async def delete_file(object_key: str) -> None:
    from app.core.config import get_settings

    s = get_settings()
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: _s3_client().delete_object(Bucket=s.s3_bucket, Key=object_key),
    )
