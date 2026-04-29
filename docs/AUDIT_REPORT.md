# AUDIT REPORT — Hệ thống LMS tích hợp AI Agent có trí nhớ

> **Ngày kiểm tra:** 27/04/2026  
> **Phiên bản repo:** branch `feature/LMS`  
> **Người kiểm tra:** Claude Sonnet 4.6 (tự động)

---

## 1. Tổng quan kiến trúc hệ thống

Dự án là một **monorepo** gồm 4 service độc lập, được orchestrate bằng Docker Compose:

```
A20-App-100/
├── apps/
│   ├── lms-api       → Backend LMS (FastAPI + SQLAlchemy + Alembic)
│   ├── lms-web       → Frontend LMS (Next.js 15 + TypeScript + Tailwind)
│   ├── agent-api     → AI Agent Service (FastAPI + LangGraph + pgvector)
│   └── agent-web     → Chat UI độc lập (React + Vite + TypeScript)
├── infra/postgres/   → Script khởi tạo PostgreSQL + pgvector
├── docker-compose.yml         → Môi trường dev
├── docker-compose.prod.yml    → Môi trường production (Caddy TLS)
└── Caddyfile                  → Reverse proxy routing
```

### Luồng giao tiếp

```
[lms-web]  ←→  [lms-api]  ←→  PostgreSQL / Redis / MinIO
                    ↑
         AGENT_SERVICE_TOKEN
                    ↑
[agent-web] ←→ [agent-api] ←→  PostgreSQL (pgvector) / Anthropic / OpenAI
```

### Công nghệ chính

| Layer | Công nghệ |
|-------|-----------|
| LLM & Orchestration | LangGraph, LangChain, Anthropic Claude, OpenAI |
| Backend (LMS) | FastAPI, SQLAlchemy (async), Alembic, Pydantic v2 |
| Backend (Agent) | FastAPI, LangGraph StateGraph, psycopg3, pgvector |
| Frontend (LMS) | Next.js 15, TypeScript, Tailwind CSS |
| Frontend (Agent) | React 18, Vite, TypeScript |
| Database | PostgreSQL 16 + pgvector extension |
| Cache | Redis 7 |
| Storage | MinIO (S3-compatible) |
| Reverse Proxy | Caddy (TLS tự động) |
| Container | Docker + Docker Compose |

---

## 2. Đánh giá mức độ hoàn thành

### 2.1 Xác thực & Quản lý người dùng — **75%** ✅

| Tính năng | Trạng thái |
|-----------|-----------|
| Đăng ký / Đăng nhập (JWT) | ✅ Hoàn thành |
| Refresh token rotation | ✅ Hoàn thành |
| Phân quyền (student / lecturer / admin) | ✅ Có model, thiếu middleware toàn diện |
| Hồ sơ sinh viên (student_code, major, year) | ✅ Hoàn thành |
| Hồ sơ giảng viên (employee_code, department, title) | ✅ Hoàn thành |
| Xác minh email | ❌ Chưa implement (có field `is_email_verified`) |
| Quên mật khẩu / Đặt lại mật khẩu | ❌ Chưa implement |
| Upload avatar | ⚠️ Có model + storage, chưa có API endpoint rõ ràng |
| Quản lý admin (CRUD người dùng) | ❌ Chưa implement |

### 2.2 Quản lý khóa học — **80%** ✅

| Tính năng | Trạng thái |
|-----------|-----------|
| CRUD khóa học (Course) | ✅ Hoàn thành |
| Đăng ký khóa học (enrollment) | ✅ Hoàn thành |
| Invite code để tham gia khóa học | ✅ Có model, cần kiểm tra logic |
| Cấu trúc Module → Lesson | ✅ Hoàn thành |
| Nội dung bài học (Markdown + video URL) | ✅ Hoàn thành |
| Tải file đính kèm bài học | ✅ MinIO integration |
| Publish/unpublish khóa học | ✅ Có field `is_published` |
| Trang quản lý khóa học (giảng viên) | ✅ `/courses/[id]/manage/page.tsx` |
| Gradebook theo khóa học | ✅ `/courses/[courseId]/gradebook/page.tsx` |
| Tìm kiếm / lọc khóa học | ⚠️ Chưa rõ ràng ở frontend |

### 2.3 Bài tập & Chấm điểm — **70%** ⚠️

| Tính năng | Trạng thái |
|-----------|-----------|
| Tạo bài tập (essay, file, quiz) | ✅ Hoàn thành |
| Nộp bài tập dạng text/file | ✅ Hoàn thành |
| Quiz nhiều lựa chọn / đúng-sai | ✅ Hoàn thành |
| Nộp bài trễ (allow_late + late status) | ✅ Có model |
| Chấm điểm thủ công (giảng viên) | ✅ Có API |
| Rubric đánh giá | ✅ Có field `rubric JSONB` |
| Trọng số điểm (weight) | ✅ Có model |
| Tự động chấm Quiz | ⚠️ Có quiz_service.py nhưng logic chưa rõ |
| Phản hồi của giảng viên cho bài nộp | ✅ Có field `feedback` |
| Xuất điểm (CSV/Excel) | ❌ Chưa implement |
| Thống kê điểm (mean, median, distribution) | ❌ Chưa implement |
| Giới hạn thời gian nộp bài (time_limit_minutes) | ✅ Có model, chưa rõ frontend |

### 2.4 AI Agent (Trí nhớ, RAG, Tools, Prompts) — **85%** ✅

| Tính năng | Trạng thái |
|-----------|-----------|
| Agent đa lượt hội thoại (LangGraph) | ✅ Hoàn thành |
| Trí nhớ cá nhân hóa (personalization) | ✅ Hoàn thành (max 32 keys/user) |
| RAG trên lịch sử hội thoại (pgvector) | ✅ Hoàn thành |
| Embedding generation (OpenAI / compatible) | ✅ Hoàn thành |
| Streaming (SSE) | ✅ Hoàn thành |
| Tool: Xem điểm (`get_my_grades`) | ✅ Hoàn thành |
| Tool: Xem bài tập (`get_my_assignments`) | ✅ Hoàn thành |
| Tool: Xem nội dung bài học (`get_lesson_content`) | ✅ Hoàn thành |
| Tool: Tìm kiếm knowledge (`search_knowledge`) | ✅ Hoàn thành |
| Tool: Tìm kiếm lịch sử hội thoại (`search_past_conversations`) | ✅ Hoàn thành |
| Tool: Cá nhân hóa (`personalization_upsert/delete`) | ✅ Hoàn thành |
| Tóm tắt hội thoại dài (summary) | ✅ Có summary_worker.py |
| Embedding worker bất đồng bộ | ⚠️ Có embedding_worker.py nhưng chưa wire vào flow chính |
| RAG trên nội dung bài học (knowledge_chunks) | ✅ Có ở lms-api (knowledge_service.py) |
| Mem0 integration | ⚠️ Có infra/mem0.py trong lms-api nhưng chưa kích hoạt |
| Prompt injection protection | ❌ Chưa có input sanitization |

### 2.5 Giao diện người dùng (Frontend) — **65%** ⚠️

**lms-web (Next.js):**

| Trang/Tính năng | Trạng thái |
|----------------|-----------|
| Đăng nhập / Đăng ký | ✅ Hoàn thành |
| Dashboard (student/lecturer) | ✅ Hoàn thành |
| Danh sách khóa học | ✅ Hoàn thành |
| Trang chi tiết khóa học | ✅ Hoàn thành |
| Tạo khóa học mới | ✅ Hoàn thành |
| Quản lý khóa học (giảng viên) | ✅ Hoàn thành |
| Nộp bài tập | ✅ Hoàn thành |
| Quiz interface | ✅ Hoàn thành |
| Xem điểm | ✅ Hoàn thành |
| Chat widget tích hợp | ✅ ChatWidget + ChatPanel |
| Trang bài học (xem nội dung) | ⚠️ Chưa rõ có full renderer không |
| Thông báo (notification bell) | ❌ Chưa implement ở frontend |
| Dark mode / accessibility | ❌ Chưa implement |
| Mobile responsive | ⚠️ Tailwind có nhưng chưa test |

**agent-web (React/Vite):**

| Trang/Tính năng | Trạng thái |
|----------------|-----------|
| Danh sách hội thoại (Sidebar) | ✅ Hoàn thành |
| Gửi/nhận tin nhắn | ✅ Hoàn thành |
| Hiển thị tool calls/results | ✅ Hoàn thành |
| Streaming messages | ✅ Hoàn thành |
| Welcome screen | ✅ Hoàn thành |
| Xóa hội thoại | ⚠️ Chưa rõ |
| Upload file vào chat | ❌ Chưa implement |
| Markdown rendering trong chat | ⚠️ Chưa rõ |

### 2.6 Thông báo (Notifications) — **30%** ❌

| Tính năng | Trạng thái |
|-----------|-----------|
| Model & DB table | ✅ Hoàn thành |
| API endpoint (notification_service.py) | ✅ Có |
| Gửi notification khi có bài tập mới | ❌ Chưa wire vào business logic |
| Gửi notification khi được chấm điểm | ❌ Chưa wire |
| Email notification | ❌ Chưa implement |
| Realtime (WebSocket/SSE) | ❌ Chưa implement |
| Frontend notification bell | ❌ Chưa implement |

### 2.7 Hạ tầng & Triển khai — **70%** ⚠️

| Tính năng | Trạng thái |
|-----------|-----------|
| Docker Compose (dev) | ✅ Hoàn thành |
| Docker Compose (prod) + Caddy TLS | ✅ Hoàn thành |
| PostgreSQL + pgvector | ✅ Hoàn thành |
| Redis | ✅ Hoàn thành |
| MinIO object storage | ✅ Hoàn thành |
| Secret validation (production) | ✅ Hoàn thành |
| CI/CD pipeline (GitHub Actions) | ❌ Chưa implement |
| Health check endpoints | ✅ Có `/health` ở cả 2 API |
| Database backup strategy | ❌ Chưa implement |
| Monitoring / Logging tập trung | ❌ Chưa implement |
| Rate limiting | ❌ Chưa implement |
| Auto-scaling | ❌ Ngoài scope hiện tại |

### 2.8 API Design & Tích hợp — **80%** ✅

| Tính năng | Trạng thái |
|-----------|-----------|
| RESTful API chuẩn | ✅ Hoàn thành |
| Pydantic schemas validation | ✅ Hoàn thành |
| JWT authentication | ✅ Hoàn thành |
| Service token (agent ↔ lms) | ✅ Hoàn thành |
| OpenAPI docs (FastAPI auto) | ✅ Tự động |
| CORS configuration | ✅ Có, cần cấu hình production |
| Error handling chuẩn | ⚠️ Cơ bản, cần cải thiện |
| Pagination | ⚠️ Một số endpoint có, chưa đồng nhất |
| API versioning (/v1/) | ✅ agent-api có, lms-api chưa rõ |

### 2.9 Kiểm thử (Testing) — **25%** ❌

| Tính năng | Trạng thái |
|-----------|-----------|
| Unit tests (lms-api) | ⚠️ 4 file test cơ bản |
| Integration tests | ❌ Chưa có test DB fixtures |
| Agent tests | ❌ Chưa có |
| Frontend tests | ❌ Chưa có |
| E2E tests | ❌ Chưa có |
| CI test automation | ❌ Chưa có |
| Test coverage report | ❌ Chưa có |

---

## 3. Các vấn đề cần khắc phục (Bugs & Issues)

### P0 — Nghiêm trọng

| # | Vấn đề | File liên quan |
|---|--------|---------------|
| B1 | `agent-api/Dockerfile` CMD sai: vẫn reference CLI entry point cũ thay vì HTTP server | `apps/agent-api/Dockerfile` |
| B2 | `embedding_worker.py` tồn tại nhưng không được gọi trong flow chính → embedding jobs tạo ra nhưng không được xử lý | `apps/agent-api/src/workers/embedding_worker.py`, `src/services/rag.py` |

### P1 — Cao

| # | Vấn đề | File liên quan |
|---|--------|---------------|
| B3 | Không có rate limiting trên `/messages/stream` → dễ bị abuse hoặc cost tăng vọt | `apps/agent-api/src/api/routes/conversations.py` |
| B4 | Notification service tồn tại nhưng không được gọi từ bất kỳ business logic nào (assign bài tập, chấm điểm) | `apps/lms-api/app/services/notification_service.py` |
| B5 | Không có input sanitization cho user messages trước khi đưa vào LLM → nguy cơ prompt injection | `apps/agent-api/src/services/conversation.py` |
| B6 | Mem0 integration (`apps/lms-api/app/infra/mem0.py`) được import nhưng chưa kích hoạt → dead code | `apps/lms-api/app/infra/mem0.py` |

### P2 — Trung bình

| # | Vấn đề | File liên quan |
|---|--------|---------------|
| B7 | Chưa có xác minh email sau đăng ký (field `is_email_verified` tồn tại nhưng không được set) | `apps/lms-api/app/api/auth.py` |
| B8 | Không có endpoint quên mật khẩu | `apps/lms-api/app/api/auth.py` |
| B9 | `summary_worker.py` chưa rõ trigger (cron hay event-driven?) | `apps/agent-api/src/workers/summary_worker.py` |
| B10 | CORS_ORIGINS chưa được cấu hình cho production domain | `.env.example`, settings |

---

## 4. Các phần cần cải thiện (Improvements)

| # | Hạng mục | Mức độ | Ghi chú |
|---|----------|--------|---------|
| I1 | Error handling: thống nhất format lỗi (error code + message) giữa 2 API | P1 | Hiện tại mỗi endpoint tự xử lý |
| I2 | Logging: thêm structured logging (JSON) thay vì print/default | P1 | Cần cho production debugging |
| I3 | Pagination: thống nhất pattern (offset/limit hoặc cursor) trên tất cả list endpoints | P1 | Hiện tại không đồng nhất |
| I4 | Database connection pool: cấu hình pool size phù hợp cho production | P1 | Default settings có thể gây bottleneck |
| I5 | Token budgeting: giới hạn tokens/user/ngày để kiểm soát chi phí LLM | P1 | Không có hiện tại |
| I6 | Async embedding: wire `embedding_worker.py` vào job queue (Redis/Celery) | P1 | Worker tồn tại nhưng chưa dùng |
| I7 | Frontend: thêm loading states và error boundaries | P2 | UX hiện tại chưa robust |
| I8 | Frontend: Markdown rendering trong chat messages | P2 | agent-web chưa rõ |
| I9 | Agent context window: sliding window thay vì load toàn bộ history | P2 | Hiện tại load hết conversation |
| I10 | Quiz: tự động chấm điểm và trả kết quả ngay | P2 | quiz_service.py chưa rõ logic |
| I11 | Secret management: migrate sang environment-based secrets thay vì .env file trong production | P2 | |
| I12 | Frontend lms-web: thêm responsive design cho mobile | P3 | Tailwind có nhưng chưa tối ưu |

---

## 5. Các tính năng còn thiếu (Missing Features)

| # | Tính năng | Mức độ quan trọng |
|---|-----------|------------------|
| F1 | CI/CD pipeline (GitHub Actions: test → build → deploy) | Rất cao |
| F2 | Notification realtime (WebSocket hoặc SSE push) | Cao |
| F3 | Email notifications (SMTP / SendGrid) | Cao |
| F4 | Quên mật khẩu / Đặt lại mật khẩu | Cao |
| F5 | Xác minh email sau đăng ký | Trung bình |
| F6 | Tool agent: thêm bài tập trực tiếp qua chat | Cao |
| F7 | Tool agent: hỏi đáp về nội dung bài học cụ thể (RAG trên knowledge_chunks của lms-api) | Cao |
| F8 | Xuất điểm (CSV/Excel) cho giảng viên | Trung bình |
| F9 | Thống kê điểm (biểu đồ phân bố, mean, median) | Trung bình |
| F10 | Trang quản lý admin (CRUD người dùng, khóa học) | Trung bình |
| F11 | Upload file trong chat (cho agent xử lý) | Trung bình |
| F12 | Dark mode | Thấp |
| F13 | Monitoring & Observability (Prometheus/Grafana hoặc Sentry) | Cao |
| F14 | Database backup tự động | Cao |
| F15 | API rate limiting (per-user, per-endpoint) | Cao |
| F16 | Trang profile người dùng (xem/sửa thông tin cá nhân) | Trung bình |
| F17 | Lịch thi / deadline calendar view | Thấp |
| F18 | Forum / Discussion board trong khóa học | Thấp |

---

## 6. Kế hoạch chi tiết các bước tiếp theo

### Phase 0 — Sửa lỗi nghiêm trọng (1–2 ngày) 🔴

**Mục tiêu:** Đảm bảo hệ thống chạy đúng ở cả dev và production.

| Task | Độ ưu tiên | Độ phức tạp | File cần sửa |
|------|-----------|-------------|-------------|
| Sửa `agent-api/Dockerfile` CMD trỏ đúng vào HTTP server | P0 | S | `apps/agent-api/Dockerfile` |
| Wire `embedding_worker.py` vào flow sau khi lưu message | P0 | M | `apps/agent-api/src/services/conversation.py`, `src/workers/embedding_worker.py` |
| Xóa hoặc kích hoạt Mem0 integration (đừng để dead code) | P1 | S | `apps/lms-api/app/infra/mem0.py` |
| Cấu hình CORS_ORIGINS cho production domains | P1 | S | `apps/lms-api/app/core/config.py`, `apps/agent-api/src/infra/settings.py` |

---

### Phase 1 — Bảo mật & Ổn định (3–5 ngày) 🟠

**Mục tiêu:** Hệ thống an toàn và ổn định đủ để demo/production nhỏ.

| Task | Độ ưu tiên | Độ phức tạp | File cần sửa |
|------|-----------|-------------|-------------|
| Thêm rate limiting cho `/messages` và `/messages/stream` | P1 | M | `apps/agent-api/src/api/app.py` (dùng `slowapi` hoặc middleware) |
| Thêm input sanitization / length limit cho user messages | P1 | S | `apps/agent-api/src/api/schemas.py` |
| Thêm token budget per-user (max tokens/ngày) | P1 | M | `apps/agent-api/src/services/conversation.py` |
| Thống nhất error response format (error_code + message) | P1 | M | Cả 2 API, tạo `ErrorResponse` schema chung |
| Thêm structured logging (JSON format) | P1 | M | `apps/agent-api/src/api/app.py`, `apps/lms-api/app/main.py` |
| Thêm notification khi tạo bài tập, chấm điểm | P1 | M | `apps/lms-api/app/services/assignment_service.py`, `apps/lms-api/app/api/assignments.py` |

---

### Phase 2 — Hoàn thiện tính năng LMS (5–7 ngày) 🟡

**Mục tiêu:** LMS đủ tính năng cơ bản cho giảng viên và sinh viên thực sự sử dụng.

| Task | Độ ưu tiên | Độ phức tạp | File cần sửa |
|------|-----------|-------------|-------------|
| Implement quên mật khẩu (email OTP/link) | P1 | L | `apps/lms-api/app/api/auth.py`, thêm email service |
| Xác minh email sau đăng ký | P1 | M | `apps/lms-api/app/api/auth.py`, `app/services/auth_service.py` |
| Hoàn thiện tự động chấm Quiz và trả kết quả | P1 | M | `apps/lms-api/app/services/quiz_service.py` |
| Xuất điểm CSV cho giảng viên | P2 | S | `apps/lms-api/app/api/grades.py` |
| Thống kê điểm (mean, median, biểu đồ) | P2 | M | `apps/lms-api/app/api/grades.py`, `apps/lms-web/src/app/courses/[courseId]/gradebook/page.tsx` |
| Trang profile người dùng (xem/sửa + upload avatar) | P2 | M | `apps/lms-api/app/api/users.py`, `apps/lms-web` thêm `/profile` page |
| Pagination đồng nhất tất cả list endpoints | P2 | M | Cả 2 API |
| Frontend: notification bell + dropdown | P2 | M | `apps/lms-web/src/components/app-header.tsx` |

---

### Phase 3 — Nâng cao Agent & RAG (5–7 ngày) 🟢

**Mục tiêu:** Agent thông minh hơn, tích hợp sâu hơn với LMS.

| Task | Độ ưu tiên | Độ phức tạp | File cần sửa |
|------|-----------|-------------|-------------|
| Agent RAG trên knowledge_chunks của lms-api (nội dung bài học) | P1 | L | `apps/agent-api/src/agent/tools/lms.py` thêm tool `search_lesson_knowledge` gọi `/agent/tools/knowledge/search` |
| Sliding window context thay vì load toàn bộ history | P1 | M | `apps/agent-api/src/services/message_loader.py` |
| Trigger summary_worker tự động khi hội thoại > N turns | P1 | M | `apps/agent-api/src/services/conversation.py`, `src/workers/summary_worker.py` |
| Tool agent: `submit_assignment` (nộp bài tập qua chat) | P2 | L | `apps/agent-api/src/agent/tools/lms.py`, `apps/lms-api/app/api/agent_tools.py` |
| Tool agent: `get_course_info` (thông tin khóa học, lịch học) | P2 | M | `apps/agent-api/src/agent/tools/lms.py` |
| Markdown rendering trong chat messages (agent-web) | P2 | S | `apps/agent-web/src/components/MessageItem.tsx` |
| Upload file vào chat | P3 | L | `apps/agent-web`, `apps/agent-api` |

---

### Phase 4 — CI/CD & Observability (3–5 ngày) 🔵

**Mục tiêu:** Tự động hóa deploy và giám sát hệ thống.

| Task | Độ ưu tiên | Độ phức tạp | File cần sửa |
|------|-----------|-------------|-------------|
| GitHub Actions: lint + test on PR | P1 | M | Tạo `.github/workflows/ci.yml` |
| GitHub Actions: build + push Docker image on merge to main | P1 | M | Tạo `.github/workflows/cd.yml` |
| Path-filter để chỉ build service thay đổi | P2 | S | `.github/workflows/ci.yml` |
| Database backup tự động (pg_dump + upload MinIO/S3) | P1 | M | Tạo `infra/backup/` + cron script |
| Thêm health check vào docker-compose | P2 | S | `docker-compose.yml` |
| Sentry integration (error tracking) | P2 | M | `apps/lms-api/app/main.py`, `apps/agent-api/src/api/app.py` |
| Thêm `/metrics` endpoint (Prometheus) | P3 | M | Cả 2 API |

---

### Phase 5 — Testing & Chất lượng code (3–5 ngày) 🟣

**Mục tiêu:** Đảm bảo code chất lượng, dễ maintain.

| Task | Độ ưu tiên | Độ phức tạp | File cần sửa |
|------|-----------|-------------|-------------|
| Thêm pytest fixtures + test DB (SQLite in-memory hoặc testcontainers) | P1 | M | `apps/lms-api/tests/conftest.py` |
| Test coverage cho auth, courses, assignments | P1 | M | `apps/lms-api/tests/` |
| Unit tests cho agent tools | P1 | M | `apps/agent-api/tests/` (tạo mới) |
| Frontend tests với Vitest/RTL | P2 | L | `apps/lms-web/`, `apps/agent-web/` |
| Pre-commit hooks (ruff, black, tsc) | P2 | S | `.pre-commit-config.yaml` |
| E2E tests với Playwright | P3 | XL | Tạo `apps/e2e/` |

---

## 7. Tóm tắt

### Trạng thái tổng thể: **~65% hoàn thành** ⚠️

Hệ thống đã có **nền tảng kiến trúc vững chắc** và **các tính năng core** hoạt động tốt. Đây là một dự án capstone có chất lượng kỹ thuật tốt, thể hiện qua:

- LangGraph agent multi-turn với memory thực sự
- RAG pipeline hoàn chỉnh (embedding + pgvector + search)
- LMS backend đầy đủ (courses, assignments, grades, quiz)
- Kiến trúc microservice rõ ràng, có security service-to-service

### 3 việc cần làm NGAY (P0/P1):

1. **Sửa Dockerfile agent-api** — Hệ thống không deploy được nếu CMD sai
2. **Wire embedding worker** — RAG không hoạt động đúng nếu embeddings không được tạo
3. **Thêm rate limiting** — Bảo vệ chi phí LLM và tránh abuse

### Roadmap ưu tiên:
```
Phase 0 (1-2 ngày)  → Sửa lỗi nghiêm trọng
Phase 1 (3-5 ngày)  → Bảo mật & Ổn định
Phase 2 (5-7 ngày)  → Hoàn thiện LMS
Phase 3 (5-7 ngày)  → Nâng cao Agent
Phase 4 (3-5 ngày)  → CI/CD & Monitoring
Phase 5 (3-5 ngày)  → Testing
```

**Tổng ước tính:** ~20–31 ngày làm việc để đạt production-ready hoàn chỉnh.
