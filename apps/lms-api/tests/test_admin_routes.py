"""Tests for admin API routes."""
from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.deps import get_current_user
from app.main import app
from app.models.base import UserRole


def _override_admin_user():
    async def dependency():
        return SimpleNamespace(id=uuid4(), role=UserRole.ADMIN, is_active=True)

    return dependency


def _client_as_admin() -> TestClient:
    app.dependency_overrides[get_current_user] = _override_admin_user()
    return TestClient(app)


def test_admin_dashboard_route(monkeypatch) -> None:
    async def fake_get_dashboard_stats(db):
        return {
            "users": {"total": 10, "students": 7, "instructors": 2, "admins": 1, "active": 9},
            "courses": {"total": 5, "open": 4, "archived": 1},
            "activity": {"messages_today": 12, "submissions_today": 6, "active_users_today": 8},
            "ai_costs": {"this_month_usd": 2.5, "this_week_usd": 1.1, "today_usd": 0.2},
        }

    monkeypatch.setattr("app.api.admin.admin_service.get_dashboard_stats", fake_get_dashboard_stats)

    client = _client_as_admin()
    response = client.get("/admin/dashboard")

    assert response.status_code == 200
    assert response.json()["users"]["total"] == 10
    assert response.json()["activity"]["messages_today"] == 12
    app.dependency_overrides.clear()


def test_admin_users_list_route(monkeypatch) -> None:
    now = datetime.now(timezone.utc)

    async def fake_list_admin_users(db, role=None, is_active=None, search=None, page=1, limit=20):
        return (
            1,
            [
                {
                    "id": uuid4(),
                    "email": "student@example.com",
                    "full_name": "Student A",
                    "role": UserRole.STUDENT,
                    "is_active": True,
                    "created_at": now,
                    "last_login_at": now,
                    "student_id": "S001",
                    "enrolled_courses_count": 3,
                }
            ],
        )

    monkeypatch.setattr("app.api.admin.admin_service.list_admin_users", fake_list_admin_users)

    client = _client_as_admin()
    response = client.get("/admin/users?role=student&page=1&limit=20")

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["student_id"] == "S001"
    app.dependency_overrides.clear()


def test_admin_create_user_route(monkeypatch) -> None:
    now = datetime.now(timezone.utc)
    user_id = uuid4()

    async def fake_create_user(db, payload):
        return SimpleNamespace(
            id=user_id,
            email=payload.email,
            full_name=payload.full_name,
            role=payload.role,
            avatar_url=None,
            is_active=True,
            is_email_verified=False,
            created_at=now,
            updated_at=now,
            student_profile=None,
            lecturer_profile=None,
        )

    monkeypatch.setattr("app.api.admin.user_service.create_user", fake_create_user)

    client = _client_as_admin()
    response = client.post(
        "/admin/users",
        json={
            "email": "new.user@example.com",
            "full_name": "New User",
            "password": "StrongPass123",
            "role": "admin",
        },
    )

    assert response.status_code == 201
    assert response.json()["user"]["id"] == str(user_id)
    assert response.json()["user"]["role"] == "admin"
    app.dependency_overrides.clear()
