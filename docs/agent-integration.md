# Agent Integration Guide

> **Audience:** the team building the AI Agent service.  
> **Purpose:** describe the contract for calling the LMS backend's
> `/agent/tools/*` endpoints — auth, schemas, and examples.

The Agent never touches `/auth/*` or any per-user route. It uses a
**dedicated, service-to-service contract** so we can:
- audit Agent ↔ LMS traffic separately from human user traffic,
- rotate the Agent credential without revoking real users,
- evolve schemas tailored for LLM tool-calling without breaking the UI.

---

## 1. Authentication

Two headers required (one of them only on user-scoped tools):

| Header            | Value                                    | When                         |
|-------------------|------------------------------------------|------------------------------|
| `Authorization`   | `Bearer <AGENT_SERVICE_TOKEN>`           | Every request                |
| `X-User-Id`       | LMS user UUID                            | User-scoped tools only       |

`AGENT_SERVICE_TOKEN` is a static shared secret. Get the dev value from
`backend/.env.example`. Production: rotate via `openssl rand -hex 32` and
update both LMS and Agent `.env`.

If the token is wrong you get **401**. If `X-User-Id` is missing on a
user-scoped endpoint you get **400**. If the user doesn't exist you get
**404**; if the user is deactivated, **403**.

```bash
export AGENT_SERVICE_TOKEN="dev-agent-token-please-change"
export USER_ID="..."   # the student the Agent is helping right now
```

---

## 2. Tool catalogue

| Name                 | Method | Path                              | User-scoped? |
|----------------------|--------|-----------------------------------|--------------|
| `get_my_grades`      | GET    | `/agent/tools/grades`             | yes          |
| `get_my_assignments` | GET    | `/agent/tools/assignments`        | yes          |
| `get_lesson_content` | GET    | `/agent/tools/lessons/{lesson_id}`| no           |
| `search_knowledge`   | POST   | `/agent/tools/knowledge/search`   | no           |

Full OpenAPI spec is auto-generated at `http://localhost:8000/docs`.

---

### 2.1. `get_my_grades`

Returns all graded items for the current user, newest first.

**Query params:** `course_id` (optional) — filter to one course.

```bash
curl -s "http://localhost:8000/agent/tools/grades?course_id=$CID" \
  -H "Authorization: Bearer $AGENT_SERVICE_TOKEN" \
  -H "X-User-Id: $USER_ID" | jq .
```

**Response item:**
```jsonc
{
  "course_id": "…",
  "course_code": "CS101",
  "course_name": "Intro to Computer Science",
  "assignment_id": "…",
  "assignment_title": "Midterm",
  "score": 8.0,
  "max_score": 10.0,
  "weight": 1.0,
  "recorded_at": "2026-04-25T14:00:00Z",
  "percent": 80.0
}
```

**Suggested system-prompt phrasing:** *"Use this tool when the student
asks 'how am I doing?', 'what's my grade in X?', or before generating a
weekly report."*

---

### 2.2. `get_my_assignments`

Returns assignments the user can see, **with their submission state
inlined** — so the Agent can answer "what do I owe?" in one round trip.

**Query params:**
- `course_id` (optional)
- `only_pending` (bool, default false) — exclude graded items

```bash
curl -s "http://localhost:8000/agent/tools/assignments?only_pending=true" \
  -H "Authorization: Bearer $AGENT_SERVICE_TOKEN" \
  -H "X-User-Id: $USER_ID" | jq .
```

**Response item:**
```jsonc
{
  "id": "…",
  "title": "Lab 3 — Linked Lists",
  "type": "file",
  "due_at": "2026-05-02T17:00:00+07:00",
  "course_id": "…",
  "course_code": "CS201",
  "course_name": "Data Structures",
  "max_score": 10.0,
  "weight": 0.2,
  "submission_status": null,
  "submission_score": null,
  "is_overdue": false
}
```

`submission_status` values: `draft | submitted | late | graded | null`.

---

### 2.3. `get_lesson_content`

Full markdown body + attachments + lesson context. **Not user-scoped** —
the Agent might cite a lesson the student isn't enrolled in (be careful
about leaking; keep lessons in published courses only).

```bash
curl -s "http://localhost:8000/agent/tools/lessons/$LESSON_ID" \
  -H "Authorization: Bearer $AGENT_SERVICE_TOKEN" | jq .
```

Returns 404 if the lesson does not exist.

---

### 2.4. `search_knowledge`

Semantic search over the `knowledge_chunks` table (lesson content already
chunked + embedded by an offline job). The Agent has two ways to call it:

**Option A — let the Agent do the embedding (recommended):**
```bash
curl -s -X POST "http://localhost:8000/agent/tools/knowledge/search" \
  -H "Authorization: Bearer $AGENT_SERVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"what is encapsulation\",
    \"embedding\": [0.0123, -0.0456, ...],
    \"limit\": 5
  }"
```

**Option B — fall back to text search (Sprint 1 friendly):** omit
`embedding`. The endpoint runs a simple `ILIKE %query%` match. The
response field `used_vector_search=false` and a `note` will tell the
Agent it should switch on embeddings later.

**Response:**
```jsonc
{
  "matches": [
    {
      "chunk_id": "…",
      "lesson_id": "…",
      "lesson_title": "OOP Basics",
      "course_id": "…",
      "course_code": "CS101",
      "chunk_index": 4,
      "content": "Encapsulation is the bundling of data and methods …",
      "similarity": 0.8743
    }
  ],
  "used_vector_search": true,
  "note": null
}
```

Embedding dimension MUST be **1536** (matches OpenAI
`text-embedding-3-small`). If dimension mismatches we silently fall back
to text search and tell you in `note`.

---

## 3. Error envelope

All errors are FastAPI's standard:

```json
{ "detail": "Invalid agent service token." }
```

Status codes the Agent should expect:

| Code | When                                           |
|------|------------------------------------------------|
| 200  | Success                                        |
| 400  | Bad query params, missing `X-User-Id`, etc.    |
| 401  | Missing or wrong `AGENT_SERVICE_TOKEN`         |
| 403  | User exists but is inactive                    |
| 404  | User / lesson not found                        |
| 422  | Schema validation failure on POST body         |
| 500  | Backend bug — please paste the request id      |

---

## 4. Calling from the Agent (Python sketch)

```python
import os
import httpx

LMS_URL = os.environ["LMS_API_URL"]
TOKEN   = os.environ["AGENT_SERVICE_TOKEN"]

class LmsToolClient:
    def __init__(self, user_id: str | None = None):
        self.user_id = user_id
        self.headers = {"Authorization": f"Bearer {TOKEN}"}
        if user_id:
            self.headers["X-User-Id"] = user_id

    async def grades(self, course_id: str | None = None) -> list[dict]:
        params = {"course_id": course_id} if course_id else {}
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get(f"{LMS_URL}/agent/tools/grades",
                            headers=self.headers, params=params)
            r.raise_for_status()
            return r.json()

    async def search_knowledge(self, query: str, embedding: list[float] | None = None,
                               course_id: str | None = None, limit: int = 5) -> dict:
        body = {"query": query, "limit": limit}
        if embedding is not None:
            body["embedding"] = embedding
        if course_id is not None:
            body["course_id"] = course_id
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(f"{LMS_URL}/agent/tools/knowledge/search",
                             headers=self.headers, json=body)
            r.raise_for_status()
            return r.json()
```

Wire this into LangGraph as 4 separate `StructuredTool`s. Schemas mirror
the FastAPI Pydantic models above so JSON-schema generation is trivial.

---

## 5. Operational notes

* **Caching:** the Agent SHOULD cache `get_lesson_content` responses for
  the duration of a chat session — lesson markdown rarely changes.
* **Rate-limiting:** the LMS does not yet rate-limit Agent traffic.
  Sprint 7 will add per-token bucket; design your retry with this in
  mind (no aggressive parallel fan-out).
* **Auditing:** every call is logged with `(user_id, tool_name,
  latency_ms, status_code)`. Sprint 7 surfaces this on the admin dash.
* **Token rotation:** keep the value in your secret manager. We accept a
  single token at a time; rotation is a deploy with downtime measured in
  seconds.

---

## 6. Wishlist (please file as issues if you want them)

* Streaming bulk `get_my_assignments` for many users at once (digest job).
* `register_chat_session` so the LMS knows which student is currently
  chatting and can render a "✱ Online" indicator on the Lecturer
  dashboard.
* Webhook **from** LMS to Agent on grade-changed events, so the Agent
  can proactively notify the student.
