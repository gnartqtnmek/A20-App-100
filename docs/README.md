# Tài liệu Dự án — LMS Chatbot Có Trí Nhớ (AI20K-015)

**Nhóm:** Team 100 | **Ngày tạo:** 2026-04-27 | **Phiên bản:** 2.0

> Hệ thống LMS (Learning Management System) tích hợp AI Agent có trí nhớ bền vững (Persistent Memory), cho phép sinh viên tương tác với AI hiểu bối cảnh học tập cá nhân của họ qua nhiều phiên trò chuyện.

---

## Mục Lục

1. [Tổng quan Dự án](#1-tổng-quan-dự-án)
2. [Tech Stack](#2-tech-stack)
3. [Cấu trúc Monorepo](#3-cấu-trúc-monorepo)
4. [Hướng dẫn Cài đặt Local](#4-hướng-dẫn-cài-đặt-local)
5. [Danh sách Tài liệu](#5-danh-sách-tài-liệu)
6. [Thứ tự Đọc theo Vai trò](#6-thứ-tự-đọc-theo-vai-trò)
7. [Sprint Roadmap](#7-sprint-roadmap)
8. [Architecture Tóm tắt](#8-architecture-tóm-tắt)
9. [Môi trường và Biến Cấu hình](#9-môi-trường-và-biến-cấu-hình)
10. [Các Lệnh Thường dùng](#10-các-lệnh-thường-dùng)
11. [Cấu trúc API](#11-cấu-trúc-api)
12. [Tính năng Cốt lõi](#12-tính-năng-cốt-lõi)
13. [Thành viên Nhóm](#13-thành-viên-nhóm)

---

## 1. Tổng quan Dự án

### 1.1 Vấn đề Cần Giải quyết

```
TRƯỚC KHI CÓ HỆ THỐNG:
• Sinh viên quên deadline → nộp bài trễ (32% mỗi kỳ)
• Phải giải thích lại bối cảnh mỗi lần hỏi AI
• Giảng viên nhận 30+ tin nhắn Zalo lặp lại cùng câu hỏi
• Không có hệ thống theo dõi điểm/bài tập tập trung
• AI (ChatGPT) không biết điểm số, bài tập thực của sinh viên
```

### 1.2 Giải pháp

```
SAU KHI CÓ HỆ THỐNG:
• Dashboard hiển thị tất cả deadline, nhắc nhở tự động 48h/24h trước
• AI nhớ tiến trình học của sinh viên qua nhiều phiên (Mem0)
• AI truy cập trực tiếp dữ liệu LMS: điểm, bài tập, tài liệu
• Giảng viên quản lý bài tập, nộp bài, chấm điểm trên 1 platform
• AI tìm kiếm ngữ nghĩa trong tài liệu khóa học (RAG + pgvector)
```

### 1.3 Các Tính năng Chính

| Tính năng | Mô tả | Sprint |
|---|---|---|
| Auth + RBAC | Đăng ký, đăng nhập, JWT, phân quyền 3 vai trò | 1 |
| Quản lý Khóa học | CRUD, enrollment code, tài liệu | 2 |
| Bài tập & Nộp bài | Tạo bài tập, file upload, theo dõi deadline | 3 |
| Chấm điểm + Thông báo | Grade book, email thông báo, Celery | 4 |
| AI Chat + Streaming | SSE, LangGraph, tool-calling LMS data | 5 |
| Trí nhớ AI (Mem0) + RAG | Persistent memory, tìm kiếm tài liệu | 6 |
| Proactive Features | Weekly digest AI, nhắc nhở deadline tự động | 7 |
| Production Deploy | Railway, CI/CD, monitoring | 8 |

---

## 2. Tech Stack

### 2.1 Frontend

```
lms-web  (apps/lms-web)    → LMS interface cho SV, GV, Admin
agent-web (apps/agent-web) → AI Chat interface

Công nghệ:
  Framework:    Next.js 14 (App Router, Server Components)
  Language:     TypeScript 5 (strict mode)
  Styling:      Tailwind CSS v3 + shadcn/ui (Radix UI)
  State:        TanStack Query v5 (server) + Zustand v4 (client)
  Forms:        React Hook Form + Zod validation
  HTTP:         Axios (với refresh token interceptor)
  Real-time:    Native Fetch API (SSE streaming)
```

### 2.2 Backend

```
lms-api  (apps/lms-api)    → FastAPI service: LMS business logic
agent-api (apps/agent-api) → FastAPI service: AI Agent + RAG

Công nghệ:
  Framework:    FastAPI 0.115+ (Python 3.11)
  ORM:          SQLAlchemy 2.0 (async)
  Validation:   Pydantic v2
  Auth:         python-jose (JWT) + passlib (bcrypt cost=12)
  Background:   Celery 5 + Celery Beat
  AI Framework: LangGraph (agent) + LangChain (tools)
  LLM Primary:  Anthropic Claude (claude-sonnet-4-6)
  LLM Fallback: OpenAI GPT-4o-mini
  Embeddings:   OpenAI text-embedding-3-small (1536 dims)
  Memory:       Mem0 SDK
  File upload:  python-magic (MIME type check) + aiofiles
  Email:        Resend Python SDK
  Migrations:   Alembic
```

### 2.3 Infrastructure

```
Database:     PostgreSQL 15 + pgvector extension
Cache/Queue:  Redis 7
Proxy:        Caddy v2 (auto HTTPS, Let's Encrypt)
Deploy:       Railway (production) + Docker Compose (local)
CI/CD:        GitHub Actions
Container:    Docker (multi-stage builds)
```

---

## 3. Cấu trúc Monorepo

```
team-100/                          ← Root của monorepo
├── apps/
│   ├── lms-web/                   ← Next.js 14 (LMS frontend)
│   │   ├── src/app/               ← App Router pages
│   │   ├── src/components/        ← React components
│   │   ├── src/lib/               ← API client, hooks, stores
│   │   ├── Dockerfile
│   │   └── next.config.ts
│   │
│   ├── agent-web/                 ← Next.js 14 (AI Chat frontend)
│   │   ├── src/app/               ← Chat pages
│   │   ├── src/components/        ← Chat components
│   │   └── Dockerfile
│   │
│   ├── lms-api/                   ← FastAPI (LMS backend)
│   │   ├── app/
│   │   │   ├── api/v1/            ← Route handlers
│   │   │   ├── core/              ← Config, DB, security
│   │   │   ├── models/            ← SQLAlchemy models
│   │   │   ├── schemas/           ← Pydantic schemas
│   │   │   ├── services/          ← Business logic
│   │   │   ├── repositories/      ← DB queries
│   │   │   └── tasks/             ← Celery tasks
│   │   ├── alembic/               ← DB migrations
│   │   ├── tests/
│   │   └── Dockerfile
│   │
│   └── agent-api/                 ← FastAPI (AI Agent backend)
│       ├── src/
│       │   ├── agent/             ← LangGraph agent runtime
│       │   │   ├── runtime.py     ← Graph definition
│       │   │   ├── prompts.py     ← System prompts
│       │   │   └── tools/         ← LMS tools, RAG, Memory
│       │   ├── api/               ← Route handlers
│       │   ├── services/          ← Memory, RAG, Conversation
│       │   └── infra/             ← DB, LMS client, vector store
│       └── Dockerfile
│
├── docs/                          ← Tài liệu dự án (thư mục này)
│   ├── README.md                  ← File này
│   ├── BRD.md
│   ├── PRD.md
│   ├── SAD.md
│   ├── ERD.md
│   ├── API_SPEC.md
│   ├── SEQUENCE_DIAGRAMS.md
│   ├── UI_UX_WIREFRAMES.md
│   └── DEPLOYMENT.md
│
├── docker-compose.yml             ← Local dev environment
├── Caddyfile                      ← Reverse proxy config
├── .env.example                   ← Template biến môi trường
├── .github/
│   └── workflows/
│       └── ci-cd.yml              ← GitHub Actions
└── WORKLOG.md                     ← Sprint log
```

---

## 4. Hướng dẫn Cài đặt Local

### 4.1 Yêu cầu Hệ thống

```
- Docker Desktop >= 24.0
- Node.js >= 20 (cho dev local không qua Docker)
- Python >= 3.11 (cho dev local không qua Docker)
- Git
```

### 4.2 Lần Đầu Cài đặt

```bash
# 1. Clone repository
git clone <repo-url>
cd team-100

# 2. Tạo file biến môi trường
cp .env.example .env
# Mở .env và điền các API keys:
#   ANTHROPIC_API_KEY=sk-ant-...
#   OPENAI_API_KEY=sk-...
#   MEM0_API_KEY=m0-...
#   RESEND_API_KEY=re_...

# 3. Khởi động toàn bộ services
docker compose up -d

# 4. Chờ services healthy (khoảng 30s)
docker compose ps

# 5. Chạy database migrations
docker compose exec lms-api alembic upgrade head

# 6. (Tùy chọn) Seed dữ liệu test
docker compose exec lms-api python -m app.scripts.seed_data

# 7. Truy cập:
#    LMS:       http://localhost:3000
#    AI Chat:   http://localhost:3001
#    LMS API:   http://localhost:8000/docs  ← Swagger UI
#    Agent API: http://localhost:8001/docs
#    Flower:    http://localhost:5555  ← Celery monitor
```

### 4.3 Tài khoản Test (sau khi seed)

```
Admin:
  Email:    admin@lms.dev
  Password: Admin123!

Giảng viên:
  Email:    gv.lan@lms.dev
  Password: Test1234!

Sinh viên:
  Email:    sv.minh@lms.dev
  Password: Test1234!
```

### 4.4 Cấu hình Ports

```
3000  → lms-web     (LMS frontend)
3001  → agent-web   (AI Chat frontend)
8000  → lms-api     (LMS API + Swagger)
8001  → agent-api   (Agent API + Swagger)
5432  → PostgreSQL
6379  → Redis
5555  → Celery Flower (monitoring)
```

---

## 5. Danh sách Tài liệu

| # | Tài liệu | Mô tả | Độc giả chính | Phiên bản |
|---|----------|-------|---------------|-----------|
| 1 | [BRD.md](BRD.md) | Business Requirements — Bài toán, stakeholders, KPIs, ROI, rủi ro | PM, Team Lead | 2.0 |
| 2 | [PRD.md](PRD.md) | Product Requirements — Features, User Stories, Business Rules, State Machines, RBAC | Toàn team | 2.0 |
| 3 | [SAD.md](SAD.md) | System Architecture — Kiến trúc, tech stack, giao tiếp services, ADRs, security | Backend, DevOps | 2.0 |
| 4 | [ERD.md](ERD.md) | Database Schema — 21 bảng, SQL, indexes, triggers, functions, query patterns | Backend | 2.0 |
| 5 | [SEQUENCE_DIAGRAMS.md](SEQUENCE_DIAGRAMS.md) | Luồng dữ liệu — Mermaid diagrams cho 15+ tính năng chính | Toàn team | 2.0 |
| 6 | [API_SPEC.md](API_SPEC.md) | API Specification — 50+ endpoints, SSE spec, error codes, rate limits | Frontend + Backend | 2.0 |
| 7 | [UI_UX_WIREFRAMES.md](UI_UX_WIREFRAMES.md) | UI/UX Design — Design system, wireframes ASCII, component states, responsive | Frontend, Designer | 2.0 |
| 8 | [DEPLOYMENT.md](DEPLOYMENT.md) | Deployment — Local Docker, env vars, Railway, GitHub Actions CI/CD | DevOps, Backend | 2.0 |

---

## 6. Thứ tự Đọc theo Vai trò

### Product Manager / Team Lead
```
BRD → PRD → SAD → (xem lướt SEQUENCE_DIAGRAMS)
```

### Backend Developer
```
ERD → SAD → API_SPEC → SEQUENCE_DIAGRAMS → DEPLOYMENT
Ưu tiên: ERD để setup DB, SAD để hiểu kiến trúc, API_SPEC để implement endpoints
```

### Frontend Developer
```
PRD → API_SPEC → UI_UX_WIREFRAMES → SEQUENCE_DIAGRAMS
Ưu tiên: API_SPEC để biết data shapes, UI_UX để implement screens
```

### AI/Agent Developer
```
SAD (phần Agent API) → SEQUENCE_DIAGRAMS (phần 4) → ERD (phần conversations/memories) → API_SPEC (Agent endpoints)
```

### DevOps / Infrastructure
```
SAD → DEPLOYMENT → ERD (để hiểu DB schema) → (Docker configs)
```

---

## 7. Sprint Roadmap

```
SPRINT 1 (Week 1-2): Foundation
├── Setup monorepo, Docker Compose, CI/CD
├── Database schema + migrations (15 bảng cơ bản)
├── Auth API: register, login, refresh, logout, JWT
├── LMS Web: Login, Register pages
└── DELIVERABLE: Đăng nhập/đăng ký hoạt động end-to-end

SPRINT 2 (Week 3-4): Course Management
├── Course CRUD API
├── Enrollment (enroll/drop với enrollment code)
├── LMS Web: Dashboard, Course list, Course detail
└── DELIVERABLE: GV tạo khóa học, SV đăng ký được

SPRINT 3 (Week 5-6): Assignments
├── Assignment CRUD API (draft/published/closed)
├── File upload + submission API
├── Assignment extensions
├── LMS Web: Assignment list, Assignment detail, Submit page
└── DELIVERABLE: SV nộp bài, GV xem submissions

SPRINT 4 (Week 7-8): Grading + Notifications
├── Grade API (enter/edit/release)
├── Notification system (in-app + email via Resend)
├── Celery tasks: deadline reminders (T-48h, T-24h)
├── LMS Web: Grade book, Notification center
└── DELIVERABLE: GV chấm điểm, SV nhận thông báo email

SPRINT 5 (Week 9-10): AI Chat Basic
├── Agent API: Conversations CRUD
├── LangGraph agent với tool-calling (grades, assignments)
├── SSE streaming (EventSourceResponse)
├── Agent Web: Chat interface
└── DELIVERABLE: Chat với AI, AI trả lời dựa trên LMS data

SPRINT 6 (Week 11-12): Memory + RAG
├── Mem0 integration (add/search/delete memories)
├── Document indexing pipeline (Celery + pgvector)
├── RAG search tool
├── Memory management UI
└── DELIVERABLE: AI nhớ xuyên session, search tài liệu khóa học

SPRINT 7 (Week 13-14): Proactive Features + Admin
├── Weekly digest (Celery Beat + AI generation)
├── Admin dashboard (user management, AI cost)
├── Notification preferences UI
├── Profile management + avatar upload
└── DELIVERABLE: Email digest hàng tuần, Admin quản lý users

SPRINT 8 (Week 15-16): Production + Polish
├── Railway deployment (all services)
├── Performance optimization (query, cache)
├── End-to-end testing
├── Documentation finalize
└── DELIVERABLE: Production deployment + demo
```

---

## 8. Architecture Tóm tắt

```
                         INTERNET
                             │
                      Caddy (HTTPS)
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
      lms-web            agent-web         lms-api / agent-api
    (Next.js)           (Next.js)            (FastAPI)
           │                 │                 │
           └─────────────────┴────────────────▶│
                                               │
                              ┌────────────────┴──────────────┐
                              │                               │
                        PostgreSQL                          Redis
                      (+ pgvector)               (Cache / Celery broker)
                              │
                         Celery Workers
                              │
                    ┌─────────┴──────────┐
                    │                    │
              Resend Email          Agent API
                                  (Document index)
                                         │
                              ┌──────────┴──────────┐
                              │                     │
                        Anthropic API          Mem0 API
                        + OpenAI API
```

**Nguyên tắc kiến trúc:**
- `lms-api` = LMS core (CRUD, auth, notifications) — không biết gì về AI
- `agent-api` = AI layer — gọi `lms-api` qua internal API để lấy dữ liệu SV
- Cả 2 backend chia sẻ cùng PostgreSQL database
- Celery workers chạy async tasks (email, index documents, weekly digest)

Chi tiết: [SAD.md](SAD.md)

---

## 9. Môi trường và Biến Cấu hình

### 9.1 Biến Môi trường Quan trọng

```bash
# ═══════════════════════════════════
# AI APIs (BẮT BUỘC)
# ═══════════════════════════════════
ANTHROPIC_API_KEY=sk-ant-...        # Claude API (primary LLM)
OPENAI_API_KEY=sk-...              # OpenAI (embeddings + fallback LLM)
MEM0_API_KEY=m0-...                # Mem0 memory service

# ═══════════════════════════════════
# Email (BẮT BUỘC cho notifications)
# ═══════════════════════════════════
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@yourdomain.com

# ═══════════════════════════════════
# Database
# ═══════════════════════════════════
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/lms_db
SYNC_DATABASE_URL=postgresql://user:pass@localhost:5432/lms_db

# ═══════════════════════════════════
# Security (THAY ĐỔI trong production)
# ═══════════════════════════════════
JWT_SECRET_KEY=<random-64-char-string>
AGENT_INTERNAL_KEY=<random-32-char-string>

# ═══════════════════════════════════
# Xem .env.example cho đầy đủ
# ═══════════════════════════════════
```

### 9.2 File .env.example

Xem `.env.example` ở root cho toàn bộ biến. Các giá trị mặc định cho local dev đã được điền sẵn — chỉ cần điền API keys.

---

## 10. Các Lệnh Thường dùng

### Docker Compose

```bash
# Khởi động tất cả services
docker compose up -d

# Xem log của một service
docker compose logs -f lms-api
docker compose logs -f agent-api
docker compose logs -f celery-worker

# Restart một service
docker compose restart lms-api

# Dừng tất cả
docker compose down

# Dừng và xóa volumes (reset DB)
docker compose down -v
```

### Database Migrations

```bash
# Chạy migrations mới nhất
docker compose exec lms-api alembic upgrade head

# Tạo migration mới
docker compose exec lms-api alembic revision --autogenerate -m "add_table_xyz"

# Xem trạng thái migration
docker compose exec lms-api alembic current

# Rollback 1 migration
docker compose exec lms-api alembic downgrade -1
```

### Chạy Tests

```bash
# Test toàn bộ lms-api
docker compose exec lms-api pytest tests/ -v

# Test với coverage
docker compose exec lms-api pytest tests/ --cov=app --cov-report=term-missing

# Test một file cụ thể
docker compose exec lms-api pytest tests/test_auth.py -v
```

### Shell Access

```bash
# Python shell trong lms-api
docker compose exec lms-api python

# PostgreSQL shell
docker compose exec postgres psql -U lms_user -d lms_db

# Redis CLI
docker compose exec redis redis-cli
```

---

## 11. Cấu trúc API

### 11.1 LMS API (Port 8000)

```
Base URL: http://localhost:8000/api/v1

AUTH:
  POST  /auth/register           Đăng ký tài khoản mới
  POST  /auth/login              Đăng nhập
  POST  /auth/refresh            Refresh access token
  POST  /auth/logout             Đăng xuất
  POST  /auth/forgot-password    Yêu cầu reset password
  POST  /auth/reset-password     Đặt lại password với token
  POST  /auth/change-password    Đổi password (đã đăng nhập)

USERS:
  GET   /users/me                Profile của mình
  PATCH /users/me                Cập nhật profile
  POST  /users/me/avatar         Upload avatar

COURSES:
  GET   /courses                 Danh sách khóa học của tôi
  POST  /courses                 Tạo khóa học mới (GV)
  GET   /courses/{id}            Chi tiết khóa học
  PATCH /courses/{id}            Cập nhật (GV)
  DELETE /courses/{id}           Xóa khóa học (GV/Admin)
  POST  /courses/{id}/enroll     Đăng ký khóa học (SV)
  DELETE /courses/{id}/enroll    Rút khỏi khóa học (SV)
  POST  /courses/{id}/documents  Upload tài liệu (GV)
  GET   /courses/{id}/documents  Danh sách tài liệu

ASSIGNMENTS:
  GET   /courses/{id}/assignments        Danh sách bài tập của KH
  POST  /courses/{id}/assignments        Tạo bài tập (GV)
  GET   /assignments/{id}               Chi tiết bài tập
  PATCH /assignments/{id}               Cập nhật (GV)
  POST  /assignments/{id}/submit        Nộp bài (SV)
  GET   /assignments/{id}/submissions   Danh sách bài nộp (GV)

GRADES:
  GET   /grades/my               Tất cả điểm của tôi (SV)
  GET   /grades/my/gpa           GPA summary (SV)
  POST  /submissions/{id}/grade  Chấm điểm (GV)
  PATCH /grades/{id}             Cập nhật điểm (GV)

NOTIFICATIONS:
  GET   /notifications           Danh sách thông báo
  PATCH /notifications/{id}/read Đánh dấu đã đọc
  POST  /notifications/read-all  Đọc tất cả
  GET   /notifications/preferences      Lấy preferences
  PUT   /notifications/preferences      Cập nhật preferences

ADMIN:
  GET   /admin/dashboard         Stats tổng quan
  GET   /admin/users             Danh sách users
  POST  /admin/users             Tạo user
  PATCH /admin/users/{id}        Lock/unlock/update user
```

### 11.2 Agent API (Port 8001)

```
Base URL: http://localhost:8001/api/v1

CONVERSATIONS:
  GET   /conversations            Danh sách conversations
  POST  /conversations            Tạo conversation mới
  GET   /conversations/{id}       Chi tiết + messages
  DELETE /conversations/{id}      Xóa conversation
  POST  /conversations/{id}/messages  Gửi tin nhắn (SSE stream)

MEMORIES:
  GET   /memories                 Danh sách memories của tôi
  DELETE /memories/{id}           Xóa một memory
  DELETE /memories                Xóa tất cả memories
```

Xem [API_SPEC.md](API_SPEC.md) để biết đầy đủ request/response schemas.

---

## 12. Tính năng Cốt lõi

### 12.1 AI Agent với Trí nhớ Bền vững

```
Luồng memory:
  1. SV chat: "Tôi đang học Python, gặp khó với recursion"
  2. Sau trò chuyện → Mem0 tự động extract facts
  3. Memory được lưu: "SV đang gặp khó với Recursion"
  4. Phiên hôm sau → Agent load memory vào context
  5. Agent nhớ → cá nhân hóa câu trả lời
```

### 12.2 RAG — Tìm kiếm Tài liệu Khóa học

```
Luồng RAG:
  1. GV upload PDF/DOCX lên khóa học
  2. Celery worker tự động:
     a. Extract text từ file
     b. Chunk thành đoạn 1000 tokens (overlap 200)
     c. Embed mỗi chunk (OpenAI text-embedding-3-small)
     d. Lưu vào PostgreSQL (pgvector)
  3. SV hỏi AI: "Giải thích BST trong slide chương 4"
  4. Agent embed câu hỏi → tìm chunks tương tự (cosine similarity)
  5. Inject top-K chunks vào prompt → AI trả lời chính xác + cite nguồn
```

### 12.3 SSE Streaming

```
Khi SV gửi tin nhắn → Agent API trả về stream:
  data: {"type":"tool_call_start","tool":"get_grades","display":"Đang tra cứu điểm..."}
  data: {"type":"tool_call_end","tool":"get_grades"}
  data: {"type":"token","content":"Điểm"}
  data: {"type":"token","content":" môn"}
  data: {"type":"token","content":" Python"}
  ...
  data: {"type":"memory_update","message":"AI đã ghi nhớ thông tin mới"}
  data: {"type":"done","message_id":"msg-uuid","tokens_used":245}
```

### 12.4 Hệ thống Thông báo

```
Trigger → Channel → Template

Điểm mới     → Email + In-app → grade_released
Bài tập mới  → Email + In-app → new_assignment
T-48h        → Email + In-app → deadline_reminder_48h
T-24h        → Email + In-app → deadline_reminder_24h
Thứ Hai      → Email          → weekly_digest (AI-generated)
```

---

## 13. Thành viên Nhóm

| Thành viên | Vai trò | Phụ trách |
|---|---|---|
| [Thành viên 1] | Team Lead / Backend | LMS API, Auth, Database |
| [Thành viên 2] | AI Engineer | Agent API, LangGraph, Mem0, RAG |
| [Thành viên 3] | Frontend | LMS Web, Agent Web |
| [Thành viên 4] | Backend / DevOps | Celery, Notifications, Docker, CI/CD |
| [Thành viên 5] | Full-stack | Grades, Admin panel, Testing |

---

## Tài liệu Liên quan

- **Swagger UI (local):** http://localhost:8000/docs (LMS API)
- **Swagger UI (local):** http://localhost:8001/docs (Agent API)
- **Celery Flower:** http://localhost:5555
- **WORKLOG.md:** Sprint log và nhật ký công việc
- **JOURNAL.md:** Ghi chú kiến trúc và quyết định thiết kế

---

*Dự án AI20K-015 — Capstone Project, Học kỳ 2 2025-2026*  
*Team 100 | Khoa Công nghệ Thông tin*
