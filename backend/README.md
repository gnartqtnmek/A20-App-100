# LMS Backend (FastAPI)

REST API cho hệ thống LMS. Cung cấp auth, user, course, assignment, grade,
notification và là nguồn tool-call cho Agent service.

## Quick start (local, không docker)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Mở http://localhost:8000/docs để xem Swagger UI.

## Quick start (qua docker-compose ở root)

```bash
make dev          # khởi động Postgres + Redis + MinIO + backend
curl http://localhost:8000/healthz
```

## Layout

```
backend/
├── app/
│   ├── api/          # routers (mỗi resource = 1 file)
│   ├── core/         # config, security, deps dùng chung
│   ├── db/           # SQLAlchemy engine + session
│   ├── models/       # ORM models
│   ├── schemas/      # Pydantic DTOs
│   ├── services/     # business logic
│   └── main.py       # entrypoint
├── tests/
├── requirements.txt
├── pyproject.toml    # ruff / pytest / mypy config
├── Dockerfile
└── .env.example
```

## Sprint roadmap

| Sprint | Phạm vi backend |
|---|---|
| 0 (hiện tại) | Skeleton, /healthz, /readyz, config |
| 1 | Auth (register/login/refresh/OAuth), User, RBAC, RefreshToken |
| 2 | Course, Module, Lesson, Enrollment, file upload (R2/MinIO) |
| 3 | Assignment, Submission, Quiz, Grade, Notification |
| 4 | Tool endpoints cho Agent (`/agent/tools/*`) |
| 5 | Memory APIs (`/memories`) |
| 6 | Proactive workers (cron), recommendation API |
| 7 | Hardening, rate limit, admin dashboard, cost tracking |
| 8 | UAT, polish |

Xem `ke_hoach_LMS_AI_Agent.docx` ở root để biết chi tiết task của từng Sprint.

## Test

```bash
cd backend
pytest
```
