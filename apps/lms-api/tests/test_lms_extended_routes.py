"""Smoke tests for newly added curriculum, gradebook, and notification routes."""
from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.deps import get_current_user
from app.main import app
from app.models.base import NotificationType, UserRole


def _override_user(role: UserRole):
    async def dependency():
        return SimpleNamespace(id=uuid4(), role=role, is_active=True)

    return dependency


def _client_with_role(role: UserRole) -> TestClient:
    app.dependency_overrides[get_current_user] = _override_user(role)
    return TestClient(app)


def test_create_module_route(monkeypatch) -> None:
    now = datetime.now(timezone.utc)
    course_id = uuid4()

    async def fake_ensure_course_owner(db, input_course_id, actor):
        return SimpleNamespace(id=input_course_id)

    async def fake_create_module(db, input_course_id, payload):
        return SimpleNamespace(
            id=uuid4(),
            course_id=input_course_id,
            title=payload.title,
            description=payload.description,
            order_index=payload.order_index,
            created_at=now,
            updated_at=now,
        )

    monkeypatch.setattr("app.api.curriculum.course_service.ensure_course_owner", fake_ensure_course_owner)
    monkeypatch.setattr("app.api.curriculum.course_service.create_module", fake_create_module)

    client = _client_with_role(UserRole.INSTRUCTOR)
    response = client.post(
        f"/curriculum/courses/{course_id}/modules",
        json={"title": "Week 1", "description": "Intro", "order_index": 0},
    )

    assert response.status_code == 201
    assert response.json()["course_id"] == str(course_id)
    app.dependency_overrides.clear()


def test_grade_submission_route(monkeypatch) -> None:
    now = datetime.now(timezone.utc)
    submission_id = uuid4()
    assignment_id = uuid4()
    course_id = uuid4()

    async def fake_get_submission_or_404(db, input_submission_id):
        return SimpleNamespace(id=input_submission_id, assignment_id=assignment_id)

    async def fake_get_assignment_or_404(db, input_assignment_id):
        return SimpleNamespace(id=input_assignment_id, course_id=course_id)

    async def fake_ensure_course_owner(db, input_course_id, actor):
        return SimpleNamespace(id=input_course_id)

    async def fake_grade_submission(db, input_submission_id, payload, grader_id):
        return SimpleNamespace(
            id=uuid4(),
            student_id=uuid4(),
            course_id=course_id,
            assignment_id=assignment_id,
            score=payload.score,
            max_score=10.0,
            weight=1.0,
            recorded_at=now,
            created_at=now,
            updated_at=now,
        )

    monkeypatch.setattr(
        "app.api.grades.assignment_service.get_submission_or_404",
        fake_get_submission_or_404,
    )
    monkeypatch.setattr(
        "app.api.grades.assignment_service.get_assignment_or_404",
        fake_get_assignment_or_404,
    )
    monkeypatch.setattr("app.api.grades.course_service.ensure_course_owner", fake_ensure_course_owner)
    monkeypatch.setattr("app.api.grades.assignment_service.grade_submission", fake_grade_submission)

    client = _client_with_role(UserRole.INSTRUCTOR)
    response = client.post(
        f"/grades/submissions/{submission_id}",
        json={"score": 8.5, "feedback": "Good"},
    )

    assert response.status_code == 201
    assert response.json()["course_id"] == str(course_id)
    app.dependency_overrides.clear()


def test_list_my_notifications_route(monkeypatch) -> None:
    now = datetime.now(timezone.utc)

    async def fake_list_notifications_for_user(db, user_id, unread_only=False):
        return [
            SimpleNamespace(
                id=uuid4(),
                user_id=user_id,
                type=NotificationType.SYSTEM,
                title="System",
                body="Welcome",
                link=None,
                metadata_=None,
                is_read=False,
                read_at=None,
                email_sent_at=None,
                created_at=now,
                updated_at=now,
            )
        ]

    monkeypatch.setattr(
        "app.api.notifications.notification_service.list_notifications_for_user",
        fake_list_notifications_for_user,
    )

    client = _client_with_role(UserRole.STUDENT)
    response = client.get("/notifications/me")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["title"] == "System"
    app.dependency_overrides.clear()
