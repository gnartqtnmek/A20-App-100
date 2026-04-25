# Worklog

Ghi lại các quyết định kỹ thuật, phân công, và brainstorming của nhóm.

> Cập nhật **bất cứ khi nào** nhóm ra quyết định kỹ thuật quan trọng hoặc thay đổi hướng đi.

---

## Quyết định thực tế của nhóm

### [ADR-0001] Tổ chức code dạng monorepo — 25/04/2026

**Bối cảnh:** Repo khởi đầu chỉ là template Python `/src` với agent loop cơ bản.
Theo kế hoạch (`ke_hoach_LMS_AI_Agent.docx`), hệ thống cần 3 service: Backend
FastAPI, AI Agent (LangGraph), Frontend Next.js. Cần thống nhất cách tổ chức
code trước Sprint 1.

**Các lựa chọn đã xem xét:**
- **Monorepo (1 repo, nhiều thư mục con):** atomic commit cross-service, một CI, dễ cho nhóm nhỏ.
- **Polyrepo (mỗi service một repo):** quá nặng với nhóm 3 người, khó sync version.
- **Giữ nguyên `/src` Python thuần:** không có chỗ cho frontend Next.js.

**Quyết định:** Monorepo với cấu trúc `backend/ agent/ frontend/ infra/ docs/`.
Mỗi service có `requirements.txt`/`package.json` và `Dockerfile` riêng. Một
`Makefile` ở root bao bọc các lệnh phổ biến. `/src` cũ → `/agent`, code logic
giữ nguyên.

**Hệ quả:**
- Đổi import `from src.X` → `from agent.X` (script `submit_log.py` không bị ảnh hưởng).
- CLI: `python -m src.agent` → `python -m agent.agent` hoặc `make agent-attach`.
- Chi tiết đầy đủ ở `docs/adr/0001-monorepo-structure.md`.

---

### Sprint 0 — 25/04 → 02/05/2026 (1 tuần)

**Mục tiêu:** Setup môi trường chung, ai pull cũng chạy được trong < 30 phút.

| Task | Người làm | Deadline | Trạng thái |
|---|---|---|---|
| Tổ chức monorepo (`backend/agent/frontend/infra/docs`) | Trang | 25/04 | ✅ Xong |
| docker-compose: Postgres+pgvector, Redis, MinIO, backend, agent | Trang | 25/04 | ✅ Xong |
| FastAPI skeleton + `/healthz` + `/readyz` | Trang | 25/04 | ✅ Xong |
| Move `/src` → `/agent` + Dockerfile + requirements | Trang | 25/04 | ✅ Xong |
| Makefile (`make help/dev/down/psql/...`) | Trang | 25/04 | ✅ Xong |
| ADR-0001 + cập nhật README | Trang | 25/04 | ✅ Xong |
| Đăng ký free tier: Anthropic, OpenAI, Resend, Railway, Vercel, Sentry | Khải | 28/04 | ⏳ Chờ |
| Wireframe Figma (Login, Dashboard, Course, Chat) | Tuyển SV3 | 30/04 | ⏳ Chờ |
| GitHub Actions skeleton (lint + test) | Khải | 02/05 | ⏳ Chờ |
| Họp kick-off + Definition of Done | Cả nhóm | 26/04 | ⏳ Chờ |

**Definition of Done của Sprint 0:**
- [ ] `make dev` bật full stack thành công trên máy của cả 2 thành viên.
- [ ] `curl http://localhost:8000/healthz` trả 200.
- [ ] `pytest` trong `backend/` chạy xanh ít nhất 1 test (`test_health.py`).
- [ ] CI chạy xanh trên `master`.
- [ ] Có file `.env.example` đầy đủ biến.

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

## Ví dụ

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

**Code thay đổi:** `src/agent.ts` lines 45-67

**Học được:** Luôn thiết kế stop condition trước khi implement retry logic.
