# ADR-0002: Move to `apps/*` monorepo layout

* **Trạng thái:** Đã chấp nhận
* **Ngày:** 25/04/2026
* **Người đề xuất:** Nguyễn Thị Quỳnh Trang
* **Liên quan:** Sprint 1 (mid-sprint refactor)
* **Thay thế phần cấu trúc của:** ADR-0001 (vẫn giữ nguyên các quyết định khác về monorepo)

## Bối cảnh

Sau Sprint 1, hệ thống đã có 3 service chạy được (backend FastAPI, frontend
Next.js, agent CLI/HTTP) và rõ ràng sẽ có thêm 1 service nữa (`agent-web`
cho admin/dev chat UI). Cấu trúc cũ đặt mỗi service ở root làm khó việc:

- Phân biệt **deployable apps** vs **infrastructure** vs **docs**.
- Mở rộng sang 4 service mà vẫn nhìn vào root project là rõ.
- Sau này thêm `packages/` cho code chia sẻ (vd. shared TS types từ
  OpenAPI, shared Pydantic schemas) — cần namespace riêng.

Cấu trúc `apps/<service>/` là pattern chuẩn của các monorepo lớn (Turborepo,
Nx, pnpm workspaces, Vercel templates). Việc đổi sớm khi codebase còn nhỏ
rẻ hơn nhiều so với đổi muộn.

## Các lựa chọn đã xem xét

### A. `apps/<service>/` — **đã chọn**

```
apps/
  lms-api/      # FastAPI backend
  lms-web/      # Next.js frontend
  agent-api/    # AI Agent service
  agent-web/    # (optional) chat UI for admin
infra/
docs/
```

* **+** Chuẩn ngành; dễ thêm `packages/` về sau.
* **+** Tên rõ ràng: `lms-api` vs `lms-web`, `agent-api` vs `agent-web`
  — không nhầm lẫn khi có 4 app.
* **+** CI có thể dùng `paths-filter: apps/lms-api/**` để chỉ build job
  liên quan.
* **−** Đường dẫn dài hơn vài ký tự.
* **−** Phải đổi mọi reference (Makefile, docker-compose, READMEs, ADRs).

### B. Giữ nguyên flat layout

```
backend/  agent/  frontend/  infra/  docs/
```

* **+** Không phải đổi gì.
* **−** Khi thêm `agent-web`, sẽ có 4 thư mục cùng cấp với `infra/` và
  `docs/` — khó nhìn.
* **−** Tên `frontend/` không cho biết nó là LMS hay Agent web.

### C. Polyrepo (tách thành 4 repo)

* **+** Phân quyền sạch.
* **−** Quá nặng cho nhóm 3 người, khó atomic commit cross-service.
* Đã loại trừ trong ADR-0001.

## Quyết định

Chọn phương án **A**. Layout cuối cùng:

```
apps/
  lms-api/      # ← backend/ cũ
  lms-web/      # ← frontend/ cũ
  agent-api/    # ← agent/ cũ (đã được mở rộng riêng bởi team Agent)
  agent-web/    # placeholder, team Agent fill khi cần
infra/          # docker-compose, init.sql
docs/           # ADRs, agent-integration guide
scripts/        # AI logging hooks
```

`packages/` sẽ thêm khi có code chia sẻ thật sự (YAGNI).

## Hệ quả

### Đã update

* `infra/docker-compose.yml`: `build.context` và `volumes` chuyển sang
  `../apps/lms-api` và `../apps/agent-api`. Service names và env vars
  giữ nguyên (`backend`/`agent`) để giảm churn.
* `Makefile`: target mới `api-shell`, `api-test`, `api-lint`,
  `api-migrate`, `web-dev`, `web-build`, `web-lint`, `web-install`.
  Giữ alias `backend-shell` v.v. để PR trong sprint không bị break.
* `README.md` (root): cần cập nhật theo (sẽ làm trong commit này).

### Cần user xử lý sau khi pull

Sandbox không xóa được file/folder trên Windows mount. Trên máy thật:

```bash
git rm -r backend agent frontend
git commit -m "chore: remove legacy folders after apps/* migration"
```

(`infra/`, `docs/`, `scripts/` giữ nguyên ở root.)

### Còn nợ (Sprint 2)

* Update `ke_hoach_LMS_AI_Agent.docx` reference đến `/backend`,
  `/agent`, `/frontend`.
* Setup CI matrix với path filters cho từng app.
* Thêm `apps/lms-web/.env.example` nhắc `NEXT_PUBLIC_API_BASE_URL`.

## Tham chiếu

* [ADR-0001](./0001-monorepo-structure.md) — quyết định monorepo gốc.
* `docs/agent-integration.md` — contract Agent ↔ LMS, không bị ảnh hưởng.
