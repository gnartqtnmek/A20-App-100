"""Service-to-service authentication for the Agent → LMS calls.

The Agent service does NOT use a per-user JWT when calling
``/agent/tools/*``. Instead it presents:

* ``Authorization: Bearer <AGENT_SERVICE_TOKEN>`` — a shared static secret
  proving the caller is the Agent service itself.
* ``X-User-Id: <uuid>`` — the LMS user the Agent is currently helping. All
  data is scoped to this user (e.g. ``get_my_grades`` only returns this
  user's grades).

Two FastAPI dependencies are exposed:

* ``require_agent_caller`` — verifies the bearer token. Use on endpoints
  that don't need a user context (e.g. ``search_knowledge``).
* ``require_agent_user``   — verifies the bearer + resolves the user from
  ``X-User-Id``. Use on user-scoped tools.
"""
from __future__ import annotations

import hmac
from uuid import UUID

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.database import get_db
from app.models.user import User


def _verify_token(authorization: str | None) -> None:
    """Constant-time check that the Authorization header carries our token."""
    settings = get_settings()
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ", 1)[1].strip()
    expected = settings.agent_service_token
    if not hmac.compare_digest(token, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid agent service token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def require_agent_caller(
    authorization: str | None = Header(default=None),
) -> None:
    """Yield only if the request carries a valid agent service token."""
    _verify_token(authorization)


async def require_agent_user(
    authorization: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Verify service token + load the user named in ``X-User-Id``."""
    _verify_token(authorization)

    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-User-Id header is required for this tool.",
        )
    try:
        user_uuid = UUID(x_user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-User-Id must be a valid UUID.",
        ) from exc

    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_uuid} not found.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive.",
        )
    return user
