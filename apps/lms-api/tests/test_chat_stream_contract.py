from __future__ import annotations

from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.deps import get_current_user
from app.main import app
from app.models.base import UserRole


def _override_user():
    async def dependency():
        return SimpleNamespace(id=uuid4(), role=UserRole.STUDENT, is_active=True)

    return dependency


def test_chat_stream_sse_contract(monkeypatch) -> None:
    async def fake_stream_chat(db, user_id, access_token, session_id, user_message, course_id=None):
        yield {"type": "token", "content": "Xin"}
        yield {"type": "token", "content": " chao"}
        yield {
            "type": "tool_call_start",
            "tool_name": "get_my_grades",
            "display_message": "Dang tra cuu diem so...",
        }
        yield {"type": "tool_call_end", "tool_name": "get_my_grades"}
        yield {"type": "done", "message_id": "m-1"}

    monkeypatch.setattr("app.api.chat.chat_service.stream_chat", fake_stream_chat)
    monkeypatch.setattr("app.api.chat.create_access_token", lambda user_id, role: "mock-token")

    app.dependency_overrides[get_current_user] = _override_user()
    client = TestClient(app)

    response = client.post(
        f"/chat/sessions/{uuid4()}/messages/stream",
        json={"content": "hello"},
    )

    assert response.status_code == 200
    payload = response.text
    assert '"type": "token"' in payload
    assert '"type": "tool_call_start"' in payload
    assert '"type": "tool_call_end"' in payload
    assert '"type": "done"' in payload
    assert "data: [DONE]" in payload

    app.dependency_overrides.clear()
