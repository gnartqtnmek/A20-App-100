from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.api.auth import AuthUser, get_current_user
from src.api.routes import conversations as conversations_routes
from src.api.routes import memories as memories_routes


@dataclass
class _FinalResult:
    run_id: str
    generated_messages: list
    assistant_message: str
    tool_trace_summary: list[str]


class _FakeConversationService:
    def __init__(self) -> None:
        self._now = datetime.now(timezone.utc)

    async def create_conversation(self, user_id: str, title: str | None = None):
        return {
            "id": "conv-1",
            "user_id": user_id,
            "title": title,
            "is_active": True,
            "created_at": self._now,
            "updated_at": self._now,
            "messages": [],
        }

    async def get_or_create_conversation(self, conversation_id: str, user_id: str, title: str | None = None):
        return await self.create_conversation(user_id=user_id, title=title)

    async def list_conversations(self, user_id: str):
        return [await self.create_conversation(user_id=user_id, title="legacy")]

    async def list_conversations_paginated(self, user_id: str, page: int = 1, limit: int = 20):
        return 1, [await self.create_conversation(user_id=user_id, title="Data Structures")]

    async def get_conversation_detail(self, conversation_id: str, user_id: str):
        return {
            "id": conversation_id,
            "user_id": user_id,
            "title": "Data Structures",
            "is_active": True,
            "created_at": self._now,
            "updated_at": self._now,
            "last_message_at": self._now,
            "message_count": 2,
            "messages": [],
            "course_id": None,
        }

    async def soft_delete_conversation(self, conversation_id: str, user_id: str):
        return conversation_id == "conv-1"

    async def list_messages(self, conversation_id: str, user_id: str, limit: int = 100, offset: int = 0):
        return [{"role": "user", "content": "Hello"}]

    async def list_messages_paginated(self, conversation_id: str, user_id: str, page: int = 1, limit: int = 50):
        conv = await self.get_conversation_detail(conversation_id=conversation_id, user_id=user_id)
        messages = [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there"},
        ]
        return conv, len(messages), messages

    async def create_user_turn(self, conversation_id: str, user_id: str, content: str, metadata=None):
        return 1

    async def persist_agent_messages(
        self,
        conversation_id: str,
        turn_index: int,
        generated_messages: list,
        *,
        run_id: str,
        model_provider: str,
        model_name: str,
    ):
        return None


class _FakeMemoryService:
    async def list_memories(self, user_id: str, page: int = 1, limit: int = 20, memory_type: str | None = None):
        now = datetime.now(timezone.utc)
        return 1, [
            {
                "id": "pref-python",
                "mem0_memory_id": None,
                "memory_type": "preference",
                "content": "Thich hoc bang vi du Python",
                "topic": "learning_style",
                "course_id": None,
                "source": "manual",
                "relevance_score": None,
                "created_at": now,
                "updated_at": now,
                "expires_at": None,
            }
        ], {"preference": 1}

    async def delete_memory(self, user_id: str, memory_id: str):
        return memory_id == "pref-python"

    async def delete_all_memories(self, user_id: str):
        return 1


class _FakeAgentRuntime:
    async def invoke(self, **kwargs):
        return _FinalResult(
            run_id="run-1",
            generated_messages=[],
            assistant_message="OK",
            tool_trace_summary=[],
        )

    async def stream(self, **kwargs):
        yield {"type": "chunk", "text": "Xin"}
        yield {"type": "chunk", "text": " chao"}
        yield {"type": "tool_call", "name": "get_my_grades", "args": {}}
        yield {"type": "tool_result", "name": "get_my_grades", "content": "Found 2 grades"}
        yield {
            "type": "final",
            "result": _FinalResult(
                run_id="run-1",
                generated_messages=[],
                assistant_message="Xin chao",
                tool_trace_summary=[],
            ),
        }


class _Container:
    def __init__(self) -> None:
        self.conversations = _FakeConversationService()
        self.memories = _FakeMemoryService()
        self.agent_runtime = _FakeAgentRuntime()


def _build_test_client() -> TestClient:
    app = FastAPI()
    app.include_router(conversations_routes.router, prefix="/api/v1")
    app.include_router(memories_routes.router, prefix="/api/v1")
    app.dependency_overrides[get_current_user] = lambda: AuthUser(id="user-1", role="student")

    container = _Container()
    conversations_routes.get_container = lambda request: container
    memories_routes.get_container = lambda request: container

    return TestClient(app)


def test_conversations_pagination_envelope_contract():
    client = _build_test_client()
    response = client.get("/api/v1/conversations?page=1&limit=20")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["page"] == 1
    assert payload["limit"] == 20
    assert payload["pages"] == 1
    assert payload["has_next"] is False
    assert payload["has_prev"] is False
    assert payload["items"][0]["id"] == "conv-1"


def test_soft_delete_conversation_contract():
    client = _build_test_client()
    response = client.delete("/api/v1/conversations/conv-1")
    assert response.status_code == 200
    assert response.json()["message"]


def test_memories_endpoint_contract():
    client = _build_test_client()
    list_resp = client.get("/api/v1/memories?page=1&limit=20")
    assert list_resp.status_code == 200
    list_body = list_resp.json()
    assert list_body["total"] == 1
    assert list_body["by_type"]["preference"] == 1
    assert list_body["items"][0]["id"] == "pref-python"

    del_resp = client.delete("/api/v1/memories/pref-python")
    assert del_resp.status_code == 204


def test_memories_my_endpoint_contract():
    client = _build_test_client()
    list_resp = client.get("/api/v1/memories/my?page=1&limit=20&type=preference")
    assert list_resp.status_code == 200
    list_body = list_resp.json()
    assert list_body["total"] == 1
    assert list_body["items"][0]["memory_type"] == "preference"


def test_stream_sse_contract_types():
    client = _build_test_client()
    response = client.post("/api/v1/conversations/conv-1/messages/stream", json={"content": "Xin chao"})
    assert response.status_code == 200
    content = response.text
    assert '"type": "token"' in content
    assert '"type": "tool_call_start"' in content
    assert '"type": "tool_call_end"' in content
    assert '"type": "done"' in content
    assert "data: [DONE]" in content
