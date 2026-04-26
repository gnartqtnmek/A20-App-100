"""Smoke tests for LMS API routes with service stubs.

These tests validate route wiring and response contracts without requiring a
live database.
"""
from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.deps import get_current_user
from app.models.base import EnrollmentStatus, SubmissionStatus, UserRole
from app.main import app


def _override_user(role: UserRole):
    async def dependency():
        return SimpleNamespace(id=uuid4(), role=role, is_active=True)

    return dependency


def _client_with_role(role: UserRole) -> TestClient:
    app.dependency_overrides[get_current_user] = _override_user(role)
    return TestClient(app)


def test_create_user_route_returns_user(monkeypatch) -> None:
    now = datetime.now(timezone.utc)

    async def fake_create_user(db, payload):
        return SimpleNamespace(
            id=uuid4(),
            email=payload.email,
            full_name=payload.full_name,
            role=payload.role,
            avatar_url=payload.avatar_url,
            is_active=True,
            is_email_verified=False,
            created_at=now,
            updated_at=now,
            student_profile=None,
            lecturer_profile=None,
        )

    monkeypatch.setattr("app.api.users.user_service.create_user", fake_create_user)

    client = _client_with_role(UserRole.ADMIN)
    response = client.post(
        "/users",
        json={
            "email": "student1@university.edu",
            "full_name": "Student One",
            "role": "student",
            "password": "strong-pass-123",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "student1@university.edu"
    assert body["role"] == UserRole.STUDENT.value
    app.dependency_overrides.clear()


def test_enroll_student_route_returns_enrollment(monkeypatch) -> None:
    now = datetime.now(timezone.utc)
    course_id = uuid4()
    student_id = uuid4()

    async def fake_enroll_student(db, input_course_id, payload):
        return SimpleNamespace(
            id=uuid4(),
            course_id=input_course_id,
            student_id=payload.student_id,
            status=EnrollmentStatus.ACTIVE,
            enrolled_at=now,
            created_at=now,
            updated_at=now,
        )

    async def fake_ensure_course_owner(db, input_course_id, actor):
        return SimpleNamespace(id=input_course_id)

    monkeypatch.setattr("app.api.courses.course_service.enroll_student", fake_enroll_student)
    monkeypatch.setattr(
        "app.api.courses.course_service.ensure_course_owner",
        fake_ensure_course_owner,
    )

    client = _client_with_role(UserRole.LECTURER)
    response = client.post(
        f"/courses/{course_id}/enrollments",
        json={"student_id": str(student_id), "status": "active"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["course_id"] == str(course_id)
    assert body["student_id"] == str(student_id)
    assert body["status"] == EnrollmentStatus.ACTIVE.value
    app.dependency_overrides.clear()


def test_submit_assignment_route_returns_submission(monkeypatch) -> None:
    now = datetime.now(timezone.utc)
    assignment_id = uuid4()
    student_id = uuid4()

    async def fake_submit_assignment(db, input_assignment_id, payload):
        return SimpleNamespace(
            id=uuid4(),
            assignment_id=input_assignment_id,
            student_id=payload.student_id,
            content=payload.content,
            file_url=None,
            file_name=None,
            quiz_answers=None,
            status=SubmissionStatus.SUBMITTED,
            submitted_at=now,
            score=None,
            feedback=None,
            graded_at=None,
            graded_by=None,
            attempt_count=1,
            created_at=now,
            updated_at=now,
        )

    monkeypatch.setattr(
        "app.api.assignments.assignment_service.submit_assignment", fake_submit_assignment
    )

    client = _client_with_role(UserRole.STUDENT)
    response = client.post(
        f"/assignments/{assignment_id}/submissions",
        json={"student_id": str(student_id), "content": "My essay answer"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["assignment_id"] == str(assignment_id)
    assert body["student_id"]
    assert body["status"] == SubmissionStatus.SUBMITTED.value
    app.dependency_overrides.clear()
