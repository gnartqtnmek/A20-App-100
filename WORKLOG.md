# Worklog

Ghi lại các quyết định kỹ thuật, phân công, và brainstorming của nhóm.

> Cập nhật **bất cứ khi nào** nhóm ra quyết định kỹ thuật quan trọng hoặc thay đổi hướng đi.

---

## Template

### Quyết định kỹ thuật

```markdown
### [ADR-N] Tiêu đề quyết định — DD/MM/YYYY

**Bối cảnh:** Vấn đề cần giải quyết là gì?

**Các lựa chọn đã xem xét:**
- Option A: ...
- Option B: ...

**Quyết định:** Chọn option nào và tại sao.

**Hệ quả:** Những gì bị ảnh hưởng / trade-off.
```

### Phân công

```markdown
### Sprint N — DD/MM → DD/MM/YYYY

| Task | Người làm | Deadline | Trạng thái |
|---|---|---|---|
| | | | |
```

### Brainstorming

```markdown
### Brainstorm: [Chủ đề] — DD/MM/YYYY

**Câu hỏi:** ...

**Các ý tưởng:**
- Ý tưởng 1: ...
- Ý tưởng 2: ...

**Kết luận:** ...
```

---

## Quyết định thực tế của nhóm

### [ADR-0002] Đổi sang `apps/<service>/` layout — 25/04/2026

**Bối cảnh:** Sau Sprint 1 chuẩn bị có 4 service (lms-api, lms-web, agent-api,
agent-web). Cấu trúc flat `backend/agent/frontend/` ở root khó scale + tên
không rõ.

**Quyết định:** Move vào `apps/`:
- `backend/` → `apps/lms-api/`
- `frontend/` → `apps/lms-web/`
- `agent/` → `apps/agent-api/` (đã được team Agent mở rộng)
- (mới) `apps/agent-web/` placeholder

`infra/`, `docs/`, `scripts/` giữ nguyên ở root.

**Hệ quả:** docker-compose, Makefile đã update. Cần `git rm -r backend agent
frontend` sau pull. Plan docx đề cập cấu trúc cũ — sẽ update Sprint 2.
Chi tiết: `docs/adr/0002-apps-monorepo-layout.md`.

---

### [ADR-0001] Tổ chức code dạng monorepo — 25/04/2026

**Bối cảnh:** Repo khởi đầu chỉ là template Python `/src` với agent loop cơ bản.
Theo plan, hệ thống cần 3 service: Backend FastAPI, AI Agent (LangGraph),
Frontend Next.js.

**Các lựa chọn đã xem xét:**
- **Monorepo:** atomic commit cross-service, một CI, dễ cho nhóm nhỏ.
- **Polyrepo:** quá nặng với nhóm 3 người.
- **Giữ nguyên `/src`:** không có chỗ cho frontend.

**Quyết định:** Monorepo, sau đó refine sang `apps/<service>/` (xem ADR-0002).

**Hệ quả:** Đổi import `from src.X` → `from agent.X`. Chi tiết:
`docs/adr/0001-monorepo-structure.md`.

---

### Sprint 0 — 25/04 → 02/05/2026 (1 tuần)

**Mục tiêu:** Setup môi trường chung, ai pull cũng chạy được trong < 30 phút.

| Task | Người làm | Trạng thái |
|---|---|---|
| Tổ chức monorepo (`apps/lms-api/lms-web/agent-api`) | Trang | ✅ Xong |
| docker-compose dev (Postgres+pgvector, Redis, MinIO, backend, agent) | Trang | ✅ Xong |
| FastAPI skeleton + `/healthz` + `/readyz` (DB ping) | Trang | ✅ Xong |
| 19 SQLAlchemy models + Alembic migration đầu tiên | Trang | ✅ Xong |
| Auth (JWT register/login/refresh/logout) + RBAC | Trang | ✅ Xong |
| Course/Module/Lesson/Assignment/Submission/Grade APIs | Trang | ✅ Xong |
| Frontend Next.js scaffold + 7 pages (login, register, dashboard, courses, course detail, assignment, grades) | Trang | ✅ Xong |
| 4 Agent tool endpoints + service-token auth + docs | Trang | ✅ Xong |
| Đăng ký free tier: Anthropic/OpenAI/Resend/Railway/Vercel/Sentry | Khải | ⏳ Chờ |

**Definition of Done:**
- [x] `make dev` bật full stack thành công
- [x] `pytest` lms-api: 16/16 PASS
- [x] `tsc --noEmit` lms-web: PASS
- [x] `docs/agent-integration.md` cho team Agent

---

## Ví dụ (template)

### [ADR-1] Dùng TypeScript thay vì Python — 30/03/2026

**Bối cảnh:** Cả nhóm cần chọn 1 ngôn ngữ chính để xây dựng agent. Có 2 thành viên quen Python, 1 thành viên quen TypeScript.

**Các lựa chọn đã xem xét:**
- **Python**: Ecosystem ML tốt hơn, syntax đơn giản, thành viên quen hơn.
- **TypeScript**: Type safety, dễ refactor khi project lớn, nhiều library AI mới ra bản TS trước.

**Quyết định:** Chọn TypeScript vì project này focus vào agent architecture, không cần ML library nặng. Type safety sẽ giúp bắt lỗi sớm hơn khi codebase phình ra.

**Hệ quả:** 2 thành viên Python cần học TypeScript cơ bản (ước tính 1 tuần). Sẽ không dùng được `langchain` Python trực tiếp.

---

### [ADR-2] Lưu conversation history bằng file JSON — 03/04/2026

**Bối cảnh:** Agent cần nhớ context giữa các lần chạy. Cần chọn storage.

**Các lựa chọn đã xem xét:**
- **In-memory array**: Đơn giản nhất nhưng mất khi restart.
- **File JSON**: Persistent, không cần setup, dễ inspect bằng tay.
- **SQLite**: Có thể query, tốt cho production nhưng overkill cho prototype.
- **Redis**: Fast nhưng cần chạy thêm service.

**Quyết định:** File JSON cho giai đoạn prototype. Thiết kế interface `MemoryStore` để sau này swap sang SQLite không cần sửa logic agent.

**Hệ quả:** Không query được theo thời gian hay user. Chấp nhận được ở giai đoạn này.

---

### Sprint 1 — 31/03 → 06/04/2026

| Task | Người làm | Deadline | Trạng thái |
|---|---|---|---|
| Setup TypeScript project + CI | Văn A | 01/04 | ✅ Xong |
| Implement agent loop cơ bản | Thị B | 02/04 | ✅ Xong |
| Tool: `search_web` (Brave API) | Văn C | 03/04 | ✅ Xong |
| Tool: `read_file`, `write_file` | Thị B | 05/04 | ✅ Xong |
| Conversation memory (JSON) | Văn A | 06/04 | ✅ Xong |
| README + setup docs | Văn C | 06/04 | ✅ Xong |

---

### Sprint 2 — 07/04 → 13/04/2026

| Task | Người làm | Deadline | Trạng thái |
|---|---|---|---|
| Fix infinite loop: thêm `max_iterations` | Thị B | 08/04 | 🔄 Đang làm |
| Tool: `run_tests` (chạy pytest) | Văn C | 10/04 | ⏳ Chờ |
| Sliding window memory | Văn A | 09/04 | ⏳ Chờ |
| Demo prep + slides | Cả nhóm | 13/04 | ⏳ Chờ |

---

### Brainstorm: Tính năng cho demo — 05/04/2026

**Câu hỏi:** Demo tuần tới nên show gì để ấn tượng nhất trong 5 phút?

**Các ý tưởng:**
- **Ý tưởng 1 (Văn A):** Cho agent đọc 1 file Python có bug, tự fix, rồi chạy test để verify. Trực quan, dễ hiểu.
- **Ý tưởng 2 (Thị B):** Agent tự build 1 tính năng nhỏ từ mô tả bằng tiếng Việt. Show khả năng hiểu ngôn ngữ tự nhiên.
- **Ý tưởng 3 (Văn C):** Agent review PR, comment vào từng dòng code có vấn đề. Gần với use case thực tế nhất.

**Pros/Cons:**
| Ý tưởng | Pros | Cons |
|---|---|---|
| Fix bug | Dễ làm, chắc chắn chạy được | Ít "wow" hơn |
| Build từ mô tả | Ấn tượng nhất | Có thể fail nếu prompt phức tạp |
| Review PR | Thực tế, liên quan trực tiếp đến khóa học | Cần setup GitHub webhook |

**Kết luận:** Chọn ý tưởng 1 (fix bug) cho demo chính vì đảm bảo. Nếu còn thời gian sẽ show thêm ý tưởng 2 như bonus.

---

### Bug quan trọng: Tool call loop vô hạn — 04/04/2026

**Triệu chứng:** Agent gọi `search_web` liên tục không dừng khi tool trả về lỗi network.

**Root cause:** Không có stop condition khi tool raise exception. Agent nhận `"error": "timeout"` nhưng interpret là cần thử lại.

**Fix:** Thêm 2 điều kiện dừng:
1. `max_iterations = 10` — hard stop sau 10 vòng
2. Nếu tool trả về lỗi 3 lần liên tiếp → dừng và báo user

**