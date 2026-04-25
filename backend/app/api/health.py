"""Liveness and readiness endpoints.

* ``/healthz`` — process is alive. Used by Railway / Kubernetes liveness probe.
* ``/readyz``  — process can serve traffic (DB + Redis reachable).
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/healthz", status_code=status.HTTP_200_OK)
def healthz() -> dict[str, str]:
    """Always returns 200 if the process is up."""
    return {"status": "ok"}


@router.get("/readyz")
async def readyz(db: AsyncSession = Depends(get_db)) -> JSONResponse:
    """Check downstream dependencies — DB ping and (later) Redis ping."""
    checks: dict[str, str] = {}

    # ---- Database ----
    try:
        result = await db.execute(text("SELECT 1"))
        result.scalar_one()
        checks["database"] = "ok"
    except Exception as exc:  # broad on purpose — anything that breaks ping
        logger.warning("readyz: database ping failed: %s", exc)
        checks["database"] = "down"

    # ---- pgvector extension ----
    try:
        ext = await db.execute(
            text("SELECT 1 FROM pg_extension WHERE extname = 'vector' LIMIT 1")
        )
        checks["pgvector"] = "ok" if ext.scalar() == 1 else "missing"
    except Exception as exc:
        logger.warning("readyz: pgvector check failed: %s", exc)
        checks["pgvector"] = "unknown"

    # ---- Redis ----
    # Sprint 1 wires this. Stub for now so the response shape is final.
    checks["redis"] = "not_configured"

    all_ok = checks["database"] == "ok"
    return JSONResponse(
        status_code=status.HTTP_200_OK if all_ok else status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"status": "ready" if all_ok else "not_ready", "checks": checks},
    )
