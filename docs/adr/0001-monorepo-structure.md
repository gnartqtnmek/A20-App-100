# ADR-0001: Tổ chức code dạng monorepo (backend / agent / frontend / infra)

* **Trạng thái:** Đã chấp nhận
* **Ngày:** 25/04/2026
* **Người đề xuất:** Nguyễn Thị Quỳnh Trang
* **Liên quan:** Sprint 0 — Khởi động

## Bối cảnh

Repo khởi đầu là một template Python đơn lẻ với thư mục ``src/`` chứa
agent loop cơ bản. Theo kế hoạch trong ``ke_hoach_LMS_AI_Agent.docx``, hệ
thống cuối cùng gồm 3 service riêng biệt:

* Backend LMS (FastAPI) — REST API toàn bộ tính năng LMS.
* AI Agent (LangGraph) — service xử lý hội thoại + memory.
* Frontend (Next.js) — giao diện web.

Cộng với ``infra/`` để chứa docker-compose và file cấu hình. Cần thống
nhất cách tổ chức code trước khi viết tính năng để tránh restructure giữa
sprint.

## Các lựa chọn đã xem xét

### A. Monorepo (1 repo, nhiều thư mục con) — **đã chọn**

Một repo duy nhất, mỗi service nằm trong thư mục con với
``requirements.txt`` / ``package.json`` riêng.

* **+** Atomic commit cho thay đổi cross-service (ví dụ thêm 1 endpoint
  backend kèm UI gọi endpoint đó).
* **+** Một CI pipeline, một issue tracker, dễ theo dõi cho nhóm 3 người.
* **+** Đồ án Đại học không cần độ phức tạp polyrepo.
* **−** Build cache có thể chậm nếu codebase phình to.
* **−** Cần Makefile / tooling để quản lý.

### B. Polyrepo (mỗi service một repo)

* **+** Tách quyền (ai sở hữu gì) rõ ràng.
* **−** Quá nặng cho nhóm 3 người, khó sync version giữa repo.
* **−** PR cross-cutting (ví dụ đổi schema API) phải merge nhiều repo.

### C. Tiếp tục giữ ``src/`` Python thuần, không tách

* **+** Đơn giản nhất.
* **−** Không phản ánh được kiến trúc thật, sẽ phải viết lại sau.
* **−** Frontend Next.js không có chỗ.

## Quyết định

Chọn phương án **A — Monorepo**. Cấu trúc thống nhất:

```
backend/   FastAPI
agent/     AI Agent service (kế thừa từ src/ cũ)
frontend/  Next.js (Sprint 1 scaffold)
infra/     docker-compose, init.sql, scripts hạ tầng
docs/adr/  ADR markdown
scripts/   AI logging hooks (giữ nguyên từ template)
```

Mỗi service tự có ``requirements.txt`` / ``package.json`` riêng, có
Dockerfile riêng. ``Makefile`` ở root bao bọc các lệnh phổ biến.

``src/`` cũ được chuyển sang ``agent/`` — code logic không thay đổi, chỉ
đổi vị trí. Để các shim trong ``src/`` để cảnh báo deprecation; user pull
về sẽ ``git rm -r src/``.

## Hệ quả

* Mọi import ``from src.X`` trong tài liệu / scripts cũ phải đổi thành
  ``from agent.X``.
* Lệnh chạy CLI agent đổi từ ``python -m src.agent`` thành
  ``python -m agent.agent``.
* CI/CD (Sprint 0 chưa có) sau này sẽ chạy job riêng cho mỗi thư mục, dùng
  path filter của GitHub Actions (``paths:``) để tránh build lại không cần.
* Onboarding mới: ``make setup && make dev`` là đủ để chạy toàn bộ stack.

## Tham chiếu

* Plan tổng thể: ``ke_hoach_LMS_AI_Agent.docx`` (Chương 4, Sprint 0).
* Thực tế hiện trạng repo: ``WORKLOG.md`` (Sprint 0).
