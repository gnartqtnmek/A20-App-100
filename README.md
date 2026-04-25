# LMS Chatbot Có Trí Nhớ — Đồ án Đại học

Hệ thống Learning Management System (LMS) tích hợp **AI Agent có trí nhớ
dài hạn** cho giảng viên và sinh viên. Đề tài cấp Đại học, nhóm 3 thành viên,
triển khai trong 16 tuần (8 sprint × 2 tuần).

> Xem **[`ke_hoach_LMS_AI_Agent.docx`](./ke_hoach_LMS_AI_Agent.docx)** để biết
> kế hoạch chi tiết theo từng Sprint, phân công, KPI và quản lý rủi ro.

---

## Cấu trúc monorepo

```
.
├── backend/        # FastAPI REST API (auth, course, assignment, grade, ...)
├── agent/          # AI Agent service (LangGraph + memory layer) — kế thừa từ src/ cũ
├── frontend/       # Next.js 14 + Tailwind + shadcn/ui (Sprint 1 scaffold)
├── infra/          # docker-compose dev stack (Postgres+pgvector, Redis, MinIO)
├── docs/adr/       # Architecture Decision Records
├── scripts/        # AI logging hooks (bắt buộc cho khóa học)
├── Makefile        # `make help` — các lệnh dev tiện dụng
├── README.md
├── AGENTS.md       # Quy định dùng AI coding agent
├── JOURNAL.md      # Nhật ký hằng tuần
├── WORKLOG.md      # Quyết định kỹ thuật + phân công
└── ke_hoach_LMS_AI_Agent.docx   # Plan chi tiết
```

> ⚠️ **Lưu ý migration:** thư mục `src/` cũ đã được chuyển sang `agent/`.
> Sau khi `git pull`, chạy `git rm -r src/ && git commit -m "chore: remove deprecated src/"`.

---

## Quick start (3 bước)

### 1. Clone, install hooks, copy env

```bash
git clone <repo-url>
cd lms-chatbot
make setup              # cp .env.example .env + install git hooks
$EDITOR .env            # điền ANTHROPIC_API_KEY (và OPENAI_API_KEY nếu có)
```

### 2. Bật toàn bộ stack bằng Docker

```bash
make dev                # postgres + redis + minio + backend + agent
make logs               # tail logs để debug
```

Sau ~30 giây:

| Service     | URL |
|-------------|-----|
| Backend Swagger | http://localhost:8000/docs |
| MinIO console   | http://localhost:9001  (`minio` / `minio12345`) |
| Postgres        | `localhost:5432`  (`lms` / `lms` / db `lms`) |
| Redis           | `localhost:6379` |

### 3. Tương tác với agent

```bash
make agent-attach       # vào CLI tương tác của agent
```

Hoặc chạy backend test:

```bash
make backend-test
```

---

## Sprint roadmap (rút gọn)

| Sprint | Tuần  | Trọng tâm |
|--------|-------|-----------|
| 0 ✅   | 1     | Setup monorepo + docker stack + skeleton FastAPI/Agent |
| 1      | 2-3   | Auth, User, RBAC, frontend Next.js scaffold, deploy đầu |
| 2      | 4-5   | Course / Module / Lesson / Upload tài liệu |
| 3      | 6-7   | Assignment / Submission / Quiz / Gradebook |
| 4      | 8-9   | LangGraph Agent core + RAG + 4 tool LMS |
| 5      | 10-11 | **Memory layer** (working / episodic / semantic) |
| 6      | 12-13 | Proactive: weekly report, deadline alert, study suggestion |
| 7      | 14-15 | Analytics, security, performance, polish |
| 8      | 16    | UAT, báo cáo đồ án, demo defense |

---

## Phân vai (3 thành viên — đang tuyển thêm)

| Member | Vai trò | Phụ trách chính |
|--------|---------|-----------------|
| SV1 (Backend Lead + DevOps) | Postgres, FastAPI, JWT, CI/CD, deploy Railway | `backend/`, `infra/` |
| SV2 (AI/Agent Engineer) | LangGraph, LLM, memory, RAG | `agent/` |
| SV3 (Frontend + UX/QA) | Next.js, Tailwind, e2e test, tài liệu, demo | `frontend/`, `docs/` |

Hiện tại nhóm có **Nguyễn Thị Quỳnh Trang** và **Phạm Minh Khải** (xem `JOURNAL.md`),
đang tuyển thành viên thứ 3.

---

## Quy định AI logging (bắt buộc — không bỏ qua)

Khóa học yêu cầu log mọi prompt gửi tới AI tool. Hooks đã setup sẵn cho:
Claude Code, Cursor, OpenAI Codex, Gemini CLI, GitHub Copilot.

```bash
bash scripts/setup_hooks.sh    # chạy 1 lần sau clone
```

Logs lưu vào `.ai-log/session.jsonl` và tự gửi lên server giảng viên khi `git push`.
Xem **[AGENTS.md](./AGENTS.md)** để biết chi tiết.

---

## Lệnh Makefile thường dùng

```bash
make help              # liệt kê toàn bộ target
make dev               # bật stack
make down              # tắt stack
make psql              # mở psql shell
make backend-test      # chạy pytest
make backend-lint      # ruff check
make format            # ruff format
make nuke              # tắt + xóa volume (cẩn thận!)
```

---

## Tài liệu

* **[`ke_hoach_LMS_AI_Agent.docx`](./ke_hoach_LMS_AI_Agent.docx)** — kế hoạch tổng thể
* **[`WORKLOG.md`](./WORKLOG.md)** — quyết định kỹ thuật, ADR, phân công
* **[`JOURNAL.md`](./JOURNAL.md)** — nhật ký tuần
* **[`AGENTS.md`](./AGENTS.md)** — quy định dùng AI agent
* `docs/adr/` — Architecture Decision Records (chi tiết cho từng quyết định lớn)
* `backend/README.md`, `agent/README.md`, `frontend/README.md`, `infra/README.md`
