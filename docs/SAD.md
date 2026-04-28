# SAD — System Architecture Document
## LMS Chatbot Có Trí Nhớ (AI20K-015)

**Phiên bản:** 2.0  
**Ngày:** 2026-04-27  
**Nhóm:** Team 100  
**Trạng thái:** Approved

---

## 1. Mục đích Tài liệu

Tài liệu này mô tả toàn bộ kiến trúc kỹ thuật của hệ thống LMS + AI Agent. Dev cần đọc tài liệu này để hiểu:
- Các thành phần (services) trong hệ thống và trách nhiệm của từng thành phần
- Cách các thành phần giao tiếp với nhau
- Quyết định thiết kế (ADR) và lý do đằng sau
- Chiến lược xử lý lỗi, caching, security, và scale

---

## 2. Kiến trúc Tổng quan

### 2.1 Loại Kiến trúc

Hệ thống áp dụng kiến trúc **Monorepo + Multi-Service** với 4 service chính:

```
Monorepo (1 Git repo)
├── apps/lms-web      ← Next.js frontend cho LMS
├── apps/agent-web    ← Next.js frontend cho AI Agent
├── apps/lms-api      ← FastAPI backend chính (LMS logic)
└── apps/agent-api    ← FastAPI backend cho AI Agent
```

Đây **KHÔNG phải** microservices phân tán — không có service mesh, không có Kubernetes ở phase 1. Đây là **Modular Monolith** được tách thành 2 backend services theo chức năng.

### 2.2 Sơ đồ Kiến trúc Đầy đủ

```
                              INTERNET
                                 │
                          HTTPS (TLS 1.3)
                                 │
                    ┌────────────▼────────────┐
                    │      CADDY v2           │
                    │   (Reverse Proxy)       │
                    │   Auto HTTPS via        │
                    │   Let's Encrypt         │
                    │                         │
                    │  Routing Rules:         │
                    │  lms.example.com  →     │
                    │    lms-web:3000         │
                    │  agent.example.com →    │
                    │    agent-web:3001       │
                    │  api.example.com →      │
                    │    lms-api:8000         │
                    │  agent-api.example.com→ │
                    │    agent-api:8001       │
                    └────┬────────┬───────────┘
                         │        │
              ┌──────────┘        └──────────┐
              │                              │
   ┌──────────▼──────────┐    ┌─────────────▼─────────────┐
   │    FRONTEND LAYER   │    │      BACKEND LAYER         │
   │                     │    │                            │
   │  ┌────────────────┐ │    │  ┌───────────────────────┐ │
   │  │   LMS Web      │ │    │  │      LMS API          │ │
   │  │  Next.js 14    │ │    │  │   FastAPI (Python)    │ │
   │  │  App Router    │ │    │  │   Port: 8000          │ │
   │  │  Port: 3000    │ │    │  │                       │ │
   │  └────────────────┘ │    │  │  Modules:             │ │
   │                     │    │  │  - auth               │ │
   │  ┌────────────────┐ │    │  │  - users              │ │
   │  │   Agent Web    │ │    │  │  - courses            │ │
   │  │  Next.js 14    │ │    │  │  - assignments        │ │
   │  │  Port: 3001    │ │    │  │  - submissions        │ │
   │  └────────────────┘ │    │  │  - grades             │ │
   └─────────────────────┘    │  │  - notifications      │ │
                              │  │  - documents          │ │
                              │  │  - agent_tools (int.) │ │
                              │  │  - admin              │ │
                              │  └──────────┬────────────┘ │
                              │             │              │
                              │  ┌──────────▼────────────┐ │
                              │  │     AGENT API         │ │
                              │  │  FastAPI (Python)     │ │
                              │  │  Port: 8001           │ │
                              │  │                       │ │
                              │  │  Modules:             │ │
                              │  │  - conversations      │ │
                              │  │  - messages (SSE)     │ │
                              │  │  - memories           │ │
                              │  │  - rag                │ │
                              │  │  - agent runtime      │ │
                              │  └──────────┬────────────┘ │
                              └─────────────┼──────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │               DATA LAYER                      │
                    │                       │                       │
                    │  ┌────────────────────▼───────────────────┐  │
                    │  │           PostgreSQL 15                 │  │
                    │  │   (+ pgvector extension)               │  │
                    │  │   Port: 5432                           │  │
                    │  │                                        │  │
                    │  │   Schemas:                             │  │
                    │  │   public → LMS tables                  │  │
                    │  │   public → Agent tables (conv/msg/mem) │  │
                    │  │   public → document_chunks (vectors)   │  │
                    │  └────────────────────────────────────────┘  │
                    │                                               │
                    │  ┌─────────────────────────────────────────┐ │
                    │  │           Redis 7                        │ │
                    │  │   Port: 6379                            │ │
                    │  │                                         │ │
                    │  │   DB 0: Celery task broker              │ │
                    │  │   DB 1: Celery result backend           │ │
                    │  │   DB 2: Rate limiting counters          │ │
                    │  │   DB 3: API response cache              │ │
                    │  └─────────────────────────────────────────┘ │
                    │                                               │
                    │  ┌─────────────────────────────────────────┐ │
                    │  │         File Storage (Volume)           │ │
                    │  │   /uploads/                             │ │
                    │  │   ├── submissions/{assignment_id}/      │ │
                    │  │   │   └── {student_id}/                │ │
                    │  │   └── documents/{course_id}/           │ │
                    │  └─────────────────────────────────────────┘ │
                    └───────────────────────────────────────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │          EXTERNAL SERVICES                    │
                    │                                               │
                    │  ┌────────────────┐  ┌──────────────────────┐│
                    │  │  Anthropic API │  │    OpenAI API        ││
                    │  │  (Claude)      │  │ (GPT-4o + embeddings)││
                    │  │  Primary LLM   │  │  Fallback LLM        ││
                    │  └────────────────┘  └──────────────────────┘│
                    │                                               │
                    │  ┌────────────────┐  ┌──────────────────────┐│
                    │  │   Mem0 API     │  │   Resend Email API   ││
                    │  │ (Memory Mgmt)  │  │  (Transactional mail)││
                    │  └────────────────┘  └──────────────────────┘│
                    └───────────────────────────────────────────────┘

BACKGROUND WORKERS (cùng Docker network):
┌──────────────────────────────────────────────────────────────────┐
│  Celery Worker (x2 processes)                                    │
│  - send_grade_notification(submission_id)                        │
│  - send_deadline_reminder(assignment_id)                         │
│  - send_enrollment_notification(enrollment_id)                   │
│  - send_new_assignment_notification(assignment_id)               │
│  - index_document(document_id)  ← gọi Agent API để embed        │
│  - generate_and_send_weekly_digest(user_id)                      │
│                                                                  │
│  Celery Beat (scheduler)                                         │
│  - Every Monday 8:00 AM: trigger weekly_digest for all users    │
│  - Every day 9:00 AM: check deadlines in 48h → send reminder    │
│  - Every day 9:00 AM: check deadlines in 24h → send reminder    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Chi tiết Từng Service

### 3.1 LMS API (apps/lms-api)

**Mục đích:** Backend chính xử lý toàn bộ nghiệp vụ LMS

**Cấu trúc thư mục đầy đủ:**
```
apps/lms-api/
├── app/
│   ├── main.py              ← FastAPI app entry point, middleware setup
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py          ← Shared dependencies: get_db, get_current_user
│   │   ├── v1/
│   │   │   ├── auth.py      ← /api/v1/auth/*
│   │   │   ├── users.py     ← /api/v1/users/*
│   │   │   ├── courses.py   ← /api/v1/courses/*
│   │   │   ├── assignments.py ← /api/v1/assignments/*  
│   │   │   ├── submissions.py ← /api/v1/submissions/*
│   │   │   ├── grades.py    ← /api/v1/grades/*
│   │   │   ├── notifications.py ← /api/v1/notifications/*
│   │   │   ├── documents.py ← /api/v1/documents/* (file upload)
│   │   │   ├── analytics.py ← /api/v1/analytics/*
│   │   │   ├── admin.py     ← /api/v1/admin/* (admin only)
│   │   │   └── agent_tools.py ← /api/v1/agent-tools/* (internal)
│   ├── core/
│   │   ├── config.py        ← Settings class (pydantic-settings)
│   │   ├── database.py      ← AsyncEngine, AsyncSession, get_db
│   │   ├── security.py      ← JWT create/verify, bcrypt hash/verify
│   │   ├── middleware.py    ← CORS, rate limit, request ID, logging
│   │   └── exceptions.py   ← Custom exception handlers
│   ├── models/              ← SQLAlchemy ORM models (1 file per table)
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── enrollment.py
│   │   ├── assignment.py
│   │   ├── submission.py
│   │   ├── grade.py
│   │   ├── notification.py
│   │   ├── document.py
│   │   ├── conversation.py  ← Shared with Agent API
│   │   └── memory.py        ← Shared with Agent API
│   ├── schemas/             ← Pydantic v2 schemas
│   │   ├── auth.py          ← LoginRequest, TokenResponse, etc.
│   │   ├── user.py          ← UserCreate, UserRead, UserUpdate
│   │   ├── course.py
│   │   ├── assignment.py
│   │   ├── submission.py
│   │   ├── grade.py
│   │   ├── notification.py
│   │   └── common.py        ← PaginatedResponse, ErrorResponse
│   ├── services/            ← Business logic (no DB queries here → use repos)
│   │   ├── auth_service.py
│   │   ├── course_service.py
│   │   ├── assignment_service.py
│   │   ├── grade_service.py
│   │   ├── notification_service.py
│   │   └── email_service.py
│   ├── repositories/        ← Database queries (SQLAlchemy)
│   │   ├── user_repo.py
│   │   ├── course_repo.py
│   │   ├── assignment_repo.py
│   │   └── ...
│   ├── tasks/               ← Celery tasks
│   │   ├── celery_app.py    ← Celery configuration
│   │   ├── email_tasks.py   ← send_*_email functions
│   │   ├── notification_tasks.py
│   │   └── scheduler.py     ← Beat schedule (weekly digest, deadline check)
│   └── alembic/             ← Database migrations
│       ├── env.py
│       └── versions/
│           ├── 001_initial_schema.py
│           └── ...
├── tests/
│   ├── conftest.py          ← pytest fixtures (test DB, test client)
│   ├── test_auth.py
│   ├── test_courses.py
│   └── ...
├── requirements.txt
├── Dockerfile
├── alembic.ini
└── .env.example
```

**Middleware Stack (thứ tự thực thi):**
```
Request IN
    │
    ▼
1. RequestIDMiddleware     → Gán X-Request-ID (UUID) cho mỗi request
    │
    ▼
2. CORSMiddleware          → Allow origins từ ALLOWED_ORIGINS env
    │
    ▼
3. LoggingMiddleware       → Log: method, path, status, duration, request_id
    │
    ▼
4. RateLimitMiddleware     → Check Redis rate limit counter
    │                        (skip nếu IP trong whitelist)
    ▼
5. Route Handler           → Business logic
    │
    ▼
6. ExceptionHandler        → Convert exceptions → JSON error response
    │
    ▼
Response OUT
```

**Dependency Injection Flow:**
```python
# Mọi protected route đều dùng pattern này:
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    # 1. Decode JWT
    # 2. Lấy user từ DB
    # 3. Check is_active
    # 4. Return user

# Route example:
@router.get("/courses/{course_id}")
async def get_course(
    course_id: UUID,
    current_user: User = Depends(get_current_user),  # Auth
    db: AsyncSession = Depends(get_db)
):
    # Authorization check trong service layer
    ...
```

---

### 3.2 Agent API (apps/agent-api)

**Mục đích:** Xử lý AI Agent: chat streaming, memory management, RAG

**Cấu trúc thư mục:**
```
apps/agent-api/
├── src/
│   ├── api/
│   │   ├── app.py           ← FastAPI app, CORS, middleware
│   │   ├── deps.py          ← get_current_user (verify JWT từ LMS API secret)
│   │   └── routes/
│   │       ├── conversations.py ← /api/v1/conversations/*
│   │       ├── memories.py      ← /api/v1/memories/*
│   │       └── rag.py           ← /api/v1/rag/*
│   ├── agent/
│   │   ├── runtime.py        ← LangGraph graph definition
│   │   ├── state.py          ← AgentState TypedDict
│   │   ├── prompts.py        ← System prompts (DETAILED)
│   │   ├── nodes.py          ← LangGraph nodes (functions)
│   │   └── tools/
│   │       ├── __init__.py   ← Tool registry
│   │       ├── lms_tools.py  ← get_grades, get_assignments, get_courses
│   │       ├── memory_tools.py ← search_memories, update_memory
│   │       ├── rag_tools.py  ← search_documents
│   │       └── calculator.py ← gpa_calculator
│   ├── services/
│   │   ├── conversation_service.py
│   │   ├── memory_service.py ← Wrapper around Mem0
│   │   └── rag_service.py    ← Document embedding & retrieval
│   ├── infra/
│   │   ├── settings.py       ← Config
│   │   ├── database.py       ← DB connection (shared PostgreSQL)
│   │   ├── lms_client.py     ← HTTP client gọi LMS API (internal)
│   │   └── vector_store.py   ← pgvector operations
│   └── schemas/
│       ├── conversation.py
│       └── memory.py
├── tests/
├── requirements.txt
├── Dockerfile
└── .env.example
```

**LangGraph Agent Flow:**

```
User Message
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    LANGGRAPH AGENT                              │
│                                                                 │
│  ┌─────────────┐                                                │
│  │  START node │                                                │
│  │  - Load     │                                                │
│  │    memories │                                                │
│  │  - Build    │                                                │
│  │    context  │                                                │
│  └──────┬──────┘                                                │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐     ┌────────────────────────────────────┐    │
│  │   LLM node  │────▶│  Router: Cần gọi tool không?       │    │
│  │  (Claude/   │     │                                    │    │
│  │   GPT-4o)   │     │  Intent detection:                 │    │
│  └─────────────┘     │  - "điểm" → get_grades tool        │    │
│                       │  - "bài tập" → get_assignments     │    │
│                       │  - "tài liệu" → rag_search         │    │
│                       │  - "giải thích" → rag + llm        │    │
│                       │  - general → LLM only              │    │
│                       └──────┬─────────────────────────────┘    │
│                              │ Tool needed                      │
│                              ▼                                  │
│                      ┌──────────────┐                           │
│                      │  Tool Caller │                           │
│                      │  node        │                           │
│                      └──────┬───────┘                           │
│                             │                                   │
│              ┌──────────────┼─────────────────────┐            │
│              │              │                     │            │
│              ▼              ▼                     ▼            │
│    ┌─────────────┐  ┌───────────────┐  ┌─────────────────┐    │
│    │  LMS Tools  │  │ Memory Tools  │  │   RAG Tools     │    │
│    │             │  │               │  │                 │    │
│    │ get_grades()│  │ search_mem()  │  │ search_docs()   │    │
│    │ get_assign()│  │               │  │                 │    │
│    │ get_courses │  │               │  │                 │    │
│    └──────┬──────┘  └──────┬────────┘  └────────┬────────┘    │
│           │                │                    │             │
│           └────────────────┴────────────────────┘             │
│                            │ Tool results                      │
│                            ▼                                   │
│                    ┌──────────────┐                            │
│                    │ Response Gen │                            │
│                    │  node        │                            │
│                    │ (Stream to   │                            │
│                    │  client)     │                            │
│                    └──────┬───────┘                            │
│                           │                                   │
│                           ▼                                   │
│                    ┌──────────────┐                            │
│                    │  Memory      │                            │
│                    │  Update node │                            │
│                    │ (async,      │                            │
│                    │  after resp) │                            │
│                    └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

**Agent System Prompt Structure:**

```
SYSTEM PROMPT:
═══════════════
1. IDENTITY: "Bạn là trợ lý học tập AI của hệ thống LMS..."
2. STUDENT PROFILE: {full_name}, {student_id}, {enrolled_courses}
3. STUDENT MEMORY: (inject top-K memories from Mem0)
   - Điểm yếu: ...
   - Sở thích học: ...
   - Câu hỏi thường gặp: ...
4. CURRENT CONTEXT: {course_name nếu có context}
5. AVAILABLE TOOLS: (list tools và khi nào dùng)
6. BEHAVIORAL RULES:
   - Luôn nói tiếng Việt
   - Cite nguồn khi dùng RAG
   - Không trả lời về điểm/bài tập của người khác
   - Khi không biết → thừa nhận, không hallucinate
   - Giới hạn response: không quá 500 words trừ khi được yêu cầu
7. LANGUAGE: Tiếng Việt, có thể dùng English cho thuật ngữ kỹ thuật
```

---

### 3.3 LMS Web (apps/lms-web)

**Công nghệ:**
- Next.js 14 (App Router)
- TypeScript strict mode
- Tailwind CSS v3 + shadcn/ui (Radix UI based)
- TanStack Query v5 (server state)
- Zustand v4 (client state: auth, notifications)
- React Hook Form + Zod (form validation)
- Axios (HTTP client, interceptors cho token refresh)

**Cấu trúc:**
```
apps/lms-web/
├── src/
│   ├── app/                    ← Next.js App Router pages
│   │   ├── layout.tsx          ← Root layout (providers)
│   │   ├── page.tsx            ← Landing page (redirect nếu logged in)
│   │   ├── (auth)/             ← Route group (không có layout)
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   └── (app)/              ← Route group (có App Shell layout)
│   │       ├── layout.tsx      ← App Shell: Sidebar + Header
│   │       ├── dashboard/page.tsx
│   │       ├── courses/
│   │       │   ├── page.tsx    ← Course list
│   │       │   ├── [courseId]/
│   │       │   │   ├── page.tsx      ← Course detail (tabs)
│   │       │   │   └── announcements/page.tsx
│   │       ├── assignments/
│   │       │   ├── [assignmentId]/
│   │       │   │   ├── page.tsx      ← Assignment detail + submit
│   │       │   │   └── grade/page.tsx ← View grade (student)
│   │       ├── grades/page.tsx
│   │       ├── notifications/page.tsx
│   │       ├── profile/
│   │       │   ├── page.tsx
│   │       │   └── memory/page.tsx
│   │       └── admin/
│   │           ├── layout.tsx  ← Admin-only guard
│   │           ├── page.tsx    ← Admin dashboard
│   │           ├── users/page.tsx
│   │           └── courses/page.tsx
│   ├── components/
│   │   ├── ui/                 ← shadcn/ui components
│   │   ├── layout/             ← Sidebar, Header, AppShell
│   │   ├── forms/              ← Form components
│   │   ├── data-display/       ← Tables, Cards, Charts
│   │   └── feedback/           ← Toast, Alert, Modal, Skeleton
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts       ← Axios instance + interceptors
│   │   │   └── types.ts        ← API response types (generated từ API spec)
│   │   ├── hooks/              ← Custom React hooks
│   │   ├── store/              ← Zustand stores
│   │   │   ├── auth.ts
│   │   │   └── notifications.ts
│   │   └── utils/              ← Helper functions
├── public/
└── next.config.ts
```

**State Management Strategy:**

```
Server State (TanStack Query):
  - /courses → useCoursesQuery()
  - /courses/{id} → useCourseQuery(id)
  - /assignments → useAssignmentsQuery()
  - /grades/my → useMyGradesQuery()
  - /notifications → useNotificationsQuery()
  
  Invalidation:
  - Sau khi enroll → invalidate ['courses']
  - Sau khi submit → invalidate ['assignments', assignmentId]
  - Sau khi grade → invalidate ['grades']

Client State (Zustand):
  - auth: {user, tokens, isLoggedIn, login(), logout()}
  - notifications: {unreadCount, markRead()}
  - ui: {sidebarOpen, theme}
```

**Token Refresh Interceptor:**
```typescript
// Axios interceptor tự động refresh token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 
        && error.response?.data?.error_code === 'TOKEN_EXPIRED'
        && !error.config._retry) {
      error.config._retry = true;
      const newToken = await refreshToken(); // gọi /auth/refresh
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return axiosInstance(error.config); // retry request
    }
    return Promise.reject(error);
  }
);
```

---

### 3.4 Agent Web (apps/agent-web)

**Công nghệ:** Next.js 14, TypeScript, Tailwind, shadcn/ui

**Tính năng đặc biệt — SSE Streaming:**
```typescript
// SSE handling cho chat streaming
const streamMessage = async (convId: string, content: string) => {
  const response = await fetch(`/api/v1/conversations/${convId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({ content }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        
        switch (data.type) {
          case 'token':
            appendToken(data.content); // Update UI realtime
            break;
          case 'tool_call_start':
            showToolCallIndicator(data.tool_name);
            break;
          case 'tool_call_end':
            hideToolCallIndicator();
            break;
          case 'done':
            finalizeMessage(data.message_id);
            break;
          case 'error':
            showError(data.message);
            break;
        }
      }
    }
  }
};
```

---

## 4. Giao tiếp Giữa các Service

### 4.1 Frontend → LMS API

```
Protocol:     HTTPS REST
Auth:         JWT Bearer token trong Authorization header
Format:       JSON
Error format: {detail, error_code, field_errors, request_id}
```

**Headers mỗi request:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000  (optional, FE gán)
```

### 4.2 Frontend (Agent Web) → Agent API

```
Protocol:     HTTPS REST + SSE
Auth:         JWT Bearer token (cùng token với LMS)
SSE:          text/event-stream
```

### 4.3 Agent API → LMS API (Internal Communication)

**Quan trọng:** Agent API cần lấy dữ liệu điểm, bài tập của sinh viên từ LMS API.

```
Protocol:     HTTP (không qua internet, Docker internal network)
Auth:         X-Agent-Key: {AGENT_INTERNAL_KEY}  (shared secret)
Target:       http://lms-api:8000/api/v1/agent-tools/*
```

**Lý do dùng internal key thay vì JWT:**
- Agent API không có JWT của user (chỉ có user_id từ token đã verify)
- Internal endpoints không expose ra internet (chỉ Docker network)
- Nhanh hơn: không cần verify JWT mỗi request nội bộ

**Internal Endpoints:**
```
GET  /api/v1/agent-tools/students/{user_id}/profile
GET  /api/v1/agent-tools/students/{user_id}/grades
GET  /api/v1/agent-tools/students/{user_id}/assignments
GET  /api/v1/agent-tools/students/{user_id}/courses
GET  /api/v1/agent-tools/courses/{course_id}/documents
```

### 4.4 LMS API → Celery Workers

```
Protocol:     Message Queue (Redis)
Broker:       redis://redis:6379/0
Pattern:      Fire-and-forget (LMS API enqueue, worker thực thi async)
```

**Task Serialization:**
```python
# LMS API gọi:
from app.tasks.email_tasks import send_grade_notification
send_grade_notification.delay(grade_id=str(grade_id))

# Celery worker nhận và thực thi:
@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_grade_notification(self, grade_id: str):
    try:
        # Logic gửi email
    except Exception as exc:
        raise self.retry(exc=exc)
```

### 4.5 Agent API → External AI APIs

```
Anthropic (Primary):
  Model:    claude-sonnet-4-6
  Usage:    Chat completions (streaming)
  Fallback: Nếu quota/error → switch sang OpenAI

OpenAI (Secondary):
  Model:    gpt-4o-mini (chat fallback)
  Model:    text-embedding-3-small (embeddings — luôn dùng OpenAI cho embed)
  
Mem0:
  Usage:    Memory add, search, delete
  Mode:     SaaS API (phase 1) hoặc self-hosted (phase 2)
```

---

## 5. Chiến lược Caching

### 5.1 Cái gì nên cache / không nên cache

| Dữ liệu | Cache? | Lý do |
|---------|--------|-------|
| JWT token validation | Không | Tokens có expiry riêng |
| User profile | Có (5 min) | Ít thay đổi, đọc nhiều |
| Course list | Có (2 min) | Thay đổi ít |
| Assignment list | Không | Deadline quan trọng, phải real-time |
| Grade | Không | Cần real-time sau khi GV chấm |
| Notification unread count | Có (30 sec) | Đọc nhiều, chấp nhận hơi delay |
| Rate limit counters | Có (Redis TTL) | Đây là purpose của Redis |
| AI Response | Không | Mỗi response cá nhân hóa |
| LMS data trong Agent | Không | Phải real-time |

### 5.2 Cache Implementation

```python
# Cache decorator cho FastAPI routes
import redis.asyncio as redis

async def get_cached_or_fetch(
    cache: redis.Redis,
    key: str,
    ttl: int,
    fetch_func: Callable
):
    cached = await cache.get(key)
    if cached:
        return json.loads(cached)
    
    data = await fetch_func()
    await cache.setex(key, ttl, json.dumps(data, default=str))
    return data

# Sử dụng:
async def get_course_list(user_id: UUID, db: AsyncSession, cache: redis.Redis):
    cache_key = f"courses:user:{user_id}"
    return await get_cached_or_fetch(
        cache=cache,
        key=cache_key,
        ttl=120,  # 2 phút
        fetch_func=lambda: course_repo.get_by_user(db, user_id)
    )
```

---

## 6. Chiến lược Xử lý Lỗi

### 6.1 Error Taxonomy

```
ERROR HIERARCHY:
├── ValidationError (422) ← Pydantic input validation
├── AuthenticationError (401) ← Token invalid/expired
├── AuthorizationError (403) ← Permission denied
├── NotFoundError (404) ← Resource không tồn tại
├── ConflictError (409) ← Duplicate, unique violation
├── BusinessLogicError (400) ← Logic rule violated (deadline passed, etc.)
├── ExternalServiceError (502) ← AI API down, email service down
└── InternalError (500) ← Unexpected errors
```

### 6.2 Exception Handler Pattern

```python
# app/core/exceptions.py

class LMSException(Exception):
    def __init__(self, detail: str, error_code: str, status_code: int = 400):
        self.detail = detail
        self.error_code = error_code
        self.status_code = status_code

class DeadlinePassedException(LMSException):
    def __init__(self):
        super().__init__(
            detail="Đã hết thời hạn nộp bài",
            error_code="DEADLINE_PASSED",
            status_code=400
        )

class NotEnrolledException(LMSException):
    def __init__(self):
        super().__init__(
            detail="Bạn chưa đăng ký khóa học này",
            error_code="NOT_ENROLLED",
            status_code=403
        )

# main.py - Global exception handler
@app.exception_handler(LMSException)
async def lms_exception_handler(request: Request, exc: LMSException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_code": exc.error_code,
            "request_id": request.state.request_id
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    field_errors = {}
    for error in exc.errors():
        field = ".".join(str(x) for x in error["loc"][1:])
        field_errors.setdefault(field, []).append(error["msg"])
    
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Dữ liệu đầu vào không hợp lệ",
            "error_code": "VALIDATION_ERROR",
            "field_errors": field_errors,
            "request_id": request.state.request_id
        }
    )
```

### 6.3 Retry Strategy cho External Services

```python
# Anthropic API retry
import anthropic
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
async def call_llm_with_retry(messages: list, **kwargs):
    try:
        return await anthropic_client.messages.create(
            model=settings.LLM_PRIMARY_MODEL,
            messages=messages,
            **kwargs
        )
    except anthropic.RateLimitError:
        # Switch to OpenAI fallback
        return await call_openai_fallback(messages, **kwargs)
    except anthropic.APIStatusError as e:
        if e.status_code >= 500:
            raise  # Retry
        raise  # Don't retry 4xx
```

---

## 7. Security Architecture

### 7.1 Authentication Flow chi tiết

```
JWT Structure:
─────────────
Header: {"alg": "HS256", "typ": "JWT"}
Payload: {
  "sub": "user-uuid",        ← user ID
  "email": "user@email.com",
  "role": "student",
  "iat": 1704067200,         ← issued at
  "exp": 1704068100,         ← expires at (15 min later)
  "jti": "unique-token-id"   ← JWT ID (for revocation)
}
Signature: HMACSHA256(base64(header) + "." + base64(payload), SECRET)

Refresh Token:
──────────────
- Format: opaque random 64-char hex string
- Stored: hashed (SHA-256) trong refresh_tokens table
- Expiry: 7 ngày
- Revocation: xóa row khỏi DB
```

### 7.2 RBAC Implementation

```python
# Dependency decorator cho authorization
def require_roles(*roles: str):
    def decorator(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=403,
                detail="Bạn không có quyền thực hiện hành động này",
                headers={"X-Error-Code": "PERMISSION_DENIED"}
            )
        return current_user
    return Depends(decorator)

# Usage:
@router.post("/courses")
async def create_course(
    data: CourseCreate,
    current_user: User = require_roles("instructor", "admin"),
    db: AsyncSession = Depends(get_db)
):
    ...
```

### 7.3 Resource-Level Authorization

```python
# Course ownership check
async def verify_course_instructor(
    course_id: UUID,
    current_user: User,
    db: AsyncSession
) -> Course:
    course = await course_repo.get_by_id(db, course_id)
    if not course:
        raise NotFoundException("Khóa học không tồn tại")
    if current_user.role != "admin" and course.instructor_id != current_user.id:
        raise ForbiddenException("Bạn không phải giảng viên của khóa học này")
    return course

# Student enrollment check
async def verify_student_enrolled(
    course_id: UUID,
    student_id: UUID,
    db: AsyncSession
) -> Enrollment:
    enrollment = await enrollment_repo.get(db, student_id, course_id)
    if not enrollment or enrollment.status != "active":
        raise ForbiddenException("Bạn chưa đăng ký khóa học này")
    return enrollment
```

### 7.4 Input Sanitization

```python
# Tất cả file upload phải qua kiểm tra này:
ALLOWED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/zip": ".zip",
    "text/plain": ".txt",
}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

async def validate_upload_file(file: UploadFile) -> None:
    # 1. Check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise BusinessLogicError(f"File quá lớn (tối đa 50MB)")
    await file.seek(0)
    
    # 2. Check MIME type (magic bytes, không tin content-type header)
    import magic
    detected_type = magic.from_buffer(content, mime=True)
    if detected_type not in ALLOWED_MIME_TYPES:
        raise BusinessLogicError(f"Định dạng file không được hỗ trợ")
    
    # 3. Sanitize filename (prevent path traversal)
    safe_name = secure_filename(file.filename)
    if not safe_name:
        raise BusinessLogicError("Tên file không hợp lệ")
```

### 7.5 Memory Isolation

```python
# CRITICAL: Mọi query memory phải filter theo user_id
# KHÔNG BAO GIỜ lấy memory mà không có user_id filter

async def search_memories(user_id: UUID, query: str) -> list[Memory]:
    # Mem0 SDK
    results = mem0_client.search(
        query=query,
        user_id=str(user_id),  # BẮT BUỘC
        limit=10
    )
    
    # Double-check: filter lại ở application layer
    return [m for m in results if m.user_id == str(user_id)]
```

---

## 8. Performance Strategy

### 8.1 Database Query Optimization

```python
# Dùng selectinload/joinedload để tránh N+1 queries
# BAD - N+1:
courses = await db.execute(select(Course))
for course in courses:
    instructor = await db.get(User, course.instructor_id)  # N queries!

# GOOD - 1 query:
stmt = (
    select(Course)
    .options(selectinload(Course.instructor))
    .where(Course.is_archived == False)
)
courses = await db.execute(stmt)
```

### 8.2 Async/Concurrent Operations

```python
# Chạy song song nhiều DB queries khi có thể
import asyncio

async def get_dashboard_data(user_id: UUID, db: AsyncSession):
    # Chạy song song thay vì tuần tự
    courses, upcoming_assignments, recent_grades, unread_count = await asyncio.gather(
        course_repo.get_enrolled(db, user_id),
        assignment_repo.get_upcoming(db, user_id, days=7),
        grade_repo.get_recent(db, user_id, limit=5),
        notification_repo.count_unread(db, user_id)
    )
    return {...}
```

### 8.3 Pagination

```python
# Luôn dùng keyset pagination cho large datasets
# Offset pagination chậm dần khi data lớn (LIMIT 20 OFFSET 10000)

# Keyset pagination (faster):
stmt = (
    select(Assignment)
    .where(Assignment.course_id == course_id)
    .where(Assignment.id > last_seen_id)  # cursor
    .order_by(Assignment.created_at.desc())
    .limit(limit)
)

# Phase 1: Dùng offset pagination (đủ cho < 10K records)
stmt = (
    select(Assignment)
    .offset((page - 1) * limit)
    .limit(limit)
)
```

---

## 9. Architecture Decision Records (ADR)

### ADR-001: Tách LMS API và Agent API thành 2 service riêng

**Ngày:** 2026-01-15  
**Trạng thái:** Accepted

**Bối cảnh:** Cần quyết định 1 backend (monolith) hay 2 backend (multi-service)

**Quyết định:** 2 service riêng biệt

**Lý do:**
1. Agent API cần Python dependencies nặng (LangChain, vector libs, Mem0 SDK) không liên quan đến LMS core
2. Scale độc lập: AI requests tốn compute hơn nhiều so với CRUD LMS
3. Failure isolation: AI API có thể down mà không ảnh hưởng LMS core (upload, grade)
4. Team có thể làm việc song song không conflict

**Đánh đổi:** Cần manage internal communication, shared DB schema

---

### ADR-002: Dùng PostgreSQL + pgvector thay vì DB riêng

**Ngày:** 2026-01-15  
**Trạng thái:** Accepted

**Quyết định:** Dùng pgvector extension trong cùng PostgreSQL

**Lý do:**
- Phase 1: < 50K document chunks → pgvector đủ performance
- Giảm số service cần maintain (1 DB thay vì DB + ChromaDB)
- Transaction consistency giữa relational và vector data
- Backup đơn giản (1 pg_dump là đủ)

**Review point:** Nếu > 500K vectors hoặc query > 100ms → migrate sang Qdrant/Weaviate

---

### ADR-003: Chọn Mem0 cho Memory Management

**Ngày:** 2026-01-15  
**Trạng thái:** Accepted

**Quyết định:** Dùng Mem0 SDK (hosted hoặc self-hosted)

**Lý do:**
- Mem0 xử lý memory extraction (dùng LLM để extract facts)
- Deduplication tự động
- Semantic search trong memories
- Time to market nhanh hơn tự implement

**Rủi ro:** Vendor lock-in. **Mitigation:** Wrap Mem0 trong `MemoryService` class → dễ swap

---

### ADR-004: SSE thay vì WebSocket cho streaming

**Ngày:** 2026-01-20  
**Trạng thái:** Accepted

**Quyết định:** Server-Sent Events (SSE) cho AI response streaming

**Lý do:**
- SSE đơn giản hơn WebSocket, HTTP/1.1 compatible
- Không cần upgrade connection
- FastAPI hỗ trợ SSE native (EventSourceResponse)
- Chỉ cần one-directional streaming (server → client)

**Đánh đổi:** Không real-time bidirectional như WebSocket, nhưng đủ cho chat

---

### ADR-005: Celery + Redis cho Background Tasks

**Ngày:** 2026-01-20  
**Trạng thái:** Accepted

**Quyết định:** Celery + Redis thay vì FastAPI BackgroundTasks

**Lý do:**
- FastAPI BackgroundTasks không persistent (server restart = lost tasks)
- Email gửi có thể fail → cần retry mechanism
- Weekly digest cần scheduled execution (Celery Beat)
- Celery có monitoring (Flower dashboard)

---

### ADR-006: Monorepo structure

**Ngày:** 2026-01-10  
**Trạng thái:** Accepted

**Quyết định:** 1 Git repository cho tất cả services

**Lý do:**
- Team nhỏ (< 6 người): monorepo giảm overhead quản lý nhiều repos
- Shared types/schemas dễ sync
- 1 CI/CD pipeline đơn giản hơn
- Code review dễ hơn khi change cross nhiều services

---

## 10. Monitoring và Observability

### 10.1 Logging Strategy

```python
# Structured logging với JSON format
import structlog

logger = structlog.get_logger()

# Mỗi request log:
logger.info(
    "request_completed",
    request_id=request.state.request_id,
    user_id=str(current_user.id) if current_user else None,
    method=request.method,
    path=request.url.path,
    status_code=response.status_code,
    duration_ms=round((time.time() - start_time) * 1000, 2),
    user_agent=request.headers.get("User-Agent")
)

# Log AI usage:
logger.info(
    "ai_request_completed",
    user_id=str(user_id),
    conversation_id=str(conv_id),
    model=model_used,
    input_tokens=usage.input_tokens,
    output_tokens=usage.output_tokens,
    cost_usd=calculate_cost(model_used, usage),
    duration_ms=duration
)
```

### 10.2 Health Check Endpoints

```python
# LMS API: GET /health
{
  "status": "ok",
  "version": "1.0.0",
  "timestamp": "2024-01-15T08:00:00Z",
  "dependencies": {
    "database": "connected",     # hoặc "error: ..."
    "redis": "connected",
    "celery": "running"
  }
}

# Agent API: GET /health
{
  "status": "ok",
  "version": "1.0.0",
  "dependencies": {
    "database": "connected",
    "lms_api": "connected",      # ping /health của LMS API
    "anthropic": "ok",           # kiểm tra API key còn hạn
    "mem0": "connected"
  }
}
```

### 10.3 Metrics (Phase 2 - Prometheus)

```
# Key metrics cần track:
http_requests_total{method, path, status}
http_request_duration_seconds{method, path, quantile}
ai_requests_total{model, status}
ai_tokens_used_total{model, type}  # input/output
celery_tasks_total{task_name, status}
memory_operations_total{operation}  # add/search/delete
active_conversations_gauge
```

---

## 11. Deployment Architecture

Xem [DEPLOYMENT.md](DEPLOYMENT.md) để biết chi tiết. Summary:

```
Production (Railway):
├── lms-web service      (Next.js, Node 20)
├── agent-web service    (Next.js, Node 20)
├── lms-api service      (FastAPI, Python 3.11, uvicorn)
├── agent-api service    (FastAPI, Python 3.11, uvicorn)
├── celery-worker service (Python 3.11, 2 workers)
├── celery-beat service  (Python 3.11, scheduler)
├── postgres service     (PostgreSQL 15 + pgvector)
├── redis service        (Redis 7)
└── caddy service        (Caddy 2, reverse proxy)
```

---

*Tài liệu này là nguồn sự thật cho kiến trúc. Mọi thay đổi kiến trúc lớn phải có ADR mới và được team review trước khi implement.*
