"""HTTP client that calls the LMS backend's /agent/tools/* endpoints."""

from __future__ import annotations

import json
import logging
from typing import Any
from uuid import UUID

import httpx

logger = logging.getLogger(__name__)

_TIMEOUT = httpx.Timeout(30.0)


class LMSService:
    """Thin async wrapper around the LMS /agent/tools/* REST API.

    All calls use:
      Authorization: Bearer <agent_service_token>   — always
      X-User-Id: <user_id>                          — only for user-scoped endpoints
    """

    def __init__(self, base_url: str, agent_service_token: str) -> None:
        self._base_url = base_url.rstrip("/")
        self._token = agent_service_token
        self._client = httpx.AsyncClient(
            base_url=self._base_url,
            timeout=_TIMEOUT,
            headers={"Authorization": f"Bearer {agent_service_token}"},
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    # ------------------------------------------------------------------
    # User-scoped tools (require X-User-Id header)
    # ------------------------------------------------------------------

    async def get_my_grades(
        self,
        user_id: str,
        course_id: str | UUID | None = None,
    ) -> list[dict[str, Any]]:
        params: dict[str, str] = {}
        if course_id:
            params["course_id"] = str(course_id)
        resp = await self._client.get(
            "/agent/tools/grades",
            params=params,
            headers={"X-User-Id": str(user_id)},
        )
        resp.raise_for_status()
        return resp.json()

    async def get_my_assignments(
        self,
        user_id: str,
        course_id: str | UUID | None = None,
        only_pending: bool = False,
    ) -> list[dict[str, Any]]:
        params: dict[str, Any] = {"only_pending": str(only_pending).lower()}
        if course_id:
            params["course_id"] = str(course_id)
        resp = await self._client.get(
            "/agent/tools/assignments",
            params=params,
            headers={"X-User-Id": str(user_id)},
        )
        resp.raise_for_status()
        return resp.json()

    # ------------------------------------------------------------------
    # Service-scoped tools (agent token only, no user context)
    # ------------------------------------------------------------------

    async def get_lesson_content(self, lesson_id: str | UUID) -> dict[str, Any] | None:
        resp = await self._client.get(f"/agent/tools/lessons/{lesson_id}")
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return resp.json()

    async def search_knowledge(
        self,
        query: str,
        course_id: str | UUID | None = None,
        limit: int = 5,
        embedding: list[float] | None = None,
    ) -> dict[str, Any]:
        body: dict[str, Any] = {"query": query, "limit": limit}
        if course_id:
            body["course_id"] = str(course_id)
        if embedding:
            body["embedding"] = embedding
        resp = await self._client.post("/agent/tools/knowledge/search", json=body)
        resp.raise_for_status()
        return resp.json()
