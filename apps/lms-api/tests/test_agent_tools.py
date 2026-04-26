"""Tests for /agent/tools/* endpoints — auth + smoke contracts."""
from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.agent_auth import require_agent_caller, require_agent_user
from app.core.config import get_settings
from app.main import app


# ------------ helpers ------------

def _service_token() -> str:
    return get_settings().agent_service_token


def _override_for_user(user) -> None:
    """Override the agent-auth dependencies to short-circuit DB lookups."""

    async def fake_user_dep():
        return user

    async def fake_caller_dep():
        return None

    app.dependency_overrides[require_agent_user] = fake_user_dep
    app.dependency_overrides[require_agent_caller] = fake_caller_dep


@pytest.fixture(autouse=True)
def _clear_overrides():
    yield
    app.dependency_overrides.clear()


def _sample_user():
    return SimpleNamespace(id=uuid4(), is_active=True, role="student")


# ------------ 1. Auth gating ------------

def test_endpoint_requires_authorization_header() -> None:
    client = TestClient(app)
    r = client.get("/agent/tools/grades", headers={"X-User-Id": str(uuid4())})
    assert r.status_code == 401, r.json()


def test_endpoint_rejects_wrong_token() -> None:
    client = TestClient(app)
    r = client.get(
        "/agent/tools/grades",
        headers={
            "Authorization": "Bearer wrong-token-xxxxxxxxxxxxxx",
            "X-User-Id": str(uuid4()),
        },
    )
    assert r.status_code == 401


def test_endpoint_rejects_user_scoped_without_user_header() -> None:
    """Even with valid token, user-scoped tools demand X-User-Id."""
    client = TestClient(app)
    r = client.get(
        "/agent/tools/grades",
        headers={"Authorization": f"Bearer {_service_token()}"},
    )
    assert r.status_code == 400
    assert "X-User-Id" in r.json()["detail"]


# ------------ 2. get_my_grades ------------

def test_get_my_grades_returns_list(monkeypatch) -> None:
    user = _sample_user()
    cid = uuid4()
    aid = uuid4()

    async def fake_grades(db, user_arg, course_id=None):
        from app.schemas.agent_tools import GradeForAgent
        return [
            GradeForAgent(
                course_id=cid,
                course_code="CS101",
                course_name="Intro to CS",
                assignment_id=aid,
                assignment_title="Midterm",
                score=8.0,
                max_score=10.0,
                weight=1.0,
                recorded_at=datetime.now(timezone.utc),
                percent=80.0,
            )
        ]

    monkeypatch.setattr(
        "app.api.agent_tools.agent_tools_service.get_my_grades", fake_grades
    )
    _override_for_user(user)
    client = TestClient(app)

    r = client.get(
        "/agent/tools/grades",
        headers={
            "Authorization": f"Bearer {_service_token()}",
            "X-User-Id": str(user.id),
        },
    )
    assert r.status_code == 200, r.json()
    body = r.json()
    assert len(body) == 1
    assert body[0]["course_code"] == "CS101"
    assert body[0]["percent"] == 80.0


# ------------ 3. get_my_assignments ------------

def test_get_my_assignments_supports_only_pending(monkeypatch) -> None:
    user = _sample_user()
    captured: dict = {}

    async def fake_assignments(db, user_arg, *, course_id=None, only_pending=False):
        captured["only_pending"] = only_pending
        return []

    monkeypatch.setattr(
        "app.api.agent_tools.agent_tools_service.get_my_assignments", fake_assignments
    )
    _override_for_user(user)
    client = TestClient(app)

    r = client.get(
        "/agent/tools/assignments?only_pending=true",
        headers={
            "Authorization": f"Bearer {_service_token()}",
            "X-User-Id": str(user.id),
        },
    )
    assert r.status_code == 200
    assert captured["only_pending"] is True


# ------------ 4. get_lesson_content ------------

def test_get_lesson_content_404(monkeypatch) -> None:
    async def fake_get_lesson(db, lesson_id):
        return None

    monkeypatch.setattr(
        "app.api.agent_tools.agent_tools_service.get_lesson_content", fake_get_lesson
    )
    # no user dep needed for this endpoint; only require_agent_caller
    async def fake_caller():
        return None
    app.dependency_overrides[require_agent_caller] = fake_caller

    client = TestClient(app)
    r = client.get(
        f"/agent/tools/lessons/{uuid4()}",
        headers={"Authorization": f"Bearer {_service_token()}"},
    )
    assert r.status_code == 404


def test_get_lesson_content_returns_lesson(monkeypatch) -> None:
    lesson_id = uuid4()
    course_id = uuid4()

    async def fake_get_lesson(db, lid):
        from app.schemas.agent_tools import LessonForAgent
        return LessonForAgent(
            id=lid,
            title="OOP Basics",
            content_md="# Chapter 1\n...",
            video_url=None,
            duration_minutes=20,
            module_title="Module 1",
            course_id=course_id,
            course_code="CS101",
            course_name="Intro to CS",
            attachments=[],
        )

    monkeypatch.setattr(
        "app.api.agent_tools.agent_tools_service.get_lesson_content", fake_get_lesson
    )
    async def fake_caller(): return None
    app.dependency_overrides[require_agent_caller] = fake_caller

    client = TestClient(app)
    r = client.get(
        f"/agent/tools/lessons/{lesson_id}",
        headers={"Authorization": f"Bearer {_service_token()}"},
    )
    assert r.status_code == 200, r.json()
    body = r.json()
    assert body["title"] == "OOP Basics"
    assert body["course_code"] == "CS101"


# ------------ 5. search_knowledge ------------

def test_search_knowledge_uses_text_fallback_without_embedding(monkeypatch) -> None:
    captured: dict = {}

    async def fake_search(db, *, query, embedding, course_id, limit):
        captured.update({
            "query": query, "embedding": embedding,
            "course_id": course_id, "limit": limit,
        })
        from app.schemas.agent_tools import KnowledgeSearchResponse
        return KnowledgeSearchResponse(matches=[], used_vector_search=False, note="text search")

    monkeypatch.setattr(
        "app.api.agent_tools.agent_tools_service.search_knowledge", fake_search
    )
    async def fake_caller(): return None
    app.dependency_overrides[require_agent_caller] = fake_caller

    client = TestClient(app)
    r = client.post(
        "/agent/tools/knowledge/search",
        headers={"Authorization": f"Bearer {_service_token()}"},
        json={"query": "what is encapsulation", "limit": 3},
    )
    assert r.status_code == 200, r.json()
    body = r.json()
    assert body["used_vector_search"] is False
    assert captured["query"] == "what is encapsulation"
    assert captured["embedding"] is None
    assert captured["limit"] == 3
