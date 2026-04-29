# Brainio LMS Monorepo

Brainio LMS là hệ thống LMS đa vai trò cho 5 đối tượng:

- `student`
- `lecturer`
- `admin`
- `academic_staff`
- `advisor`

## Cấu trúc repo

```text
apps/
  api/   FastAPI + SQLAlchemy 2 async + Alembic
  web/   Next.js 14 App Router + TypeScript + Tailwind CSS
docs/    BRD/PRD/ERD/API Spec + sprint docs + deployment docs
infra/   Ghi chú hạ tầng
```

## Stack

- Frontend: Next.js 14, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2, SQLAlchemy async, Alembic
- Database: PostgreSQL 15
- Cache/Queue: Redis 7
- Local deployment: Docker Compose

## Yêu cầu môi trường

- Docker Desktop (Compose v2)
- Python 3.12+ (khuyến nghị 3.12/3.13)
- Node.js 20+

## Thiết lập local đầy đủ

1. Khởi động hạ tầng:
```bash
docker compose up -d postgres redis
```

2. Chạy migration:
```bash
cd apps/api
python -m alembic upgrade head
```

3. Seed dữ liệu demo:
```bash
cd apps/api
python seed.py
```

4. Chạy API:
```bash
cd apps/api
uvicorn main:app --reload --port 8000
```

5. Chạy Web:
```bash
cd apps/web
npm install
npm run dev
```

## Kiểm tra nhanh

- API health: `GET http://localhost:8000/health`
- API docs: `http://localhost:8000/docs`
- Web app: `http://localhost:3000`

## Build/QA local

- Backend import check:
```bash
cd apps/api
python -c "from main import app; print(bool(app))"
```

- Frontend typecheck/build:
```bash
cd apps/web
npx tsc --noEmit
npm run build
```

- Docker image build:
```bash
docker compose build
```

## Demo accounts

Xem chi tiết tại `docs/DEMO_ACCOUNTS.md`. Mặc định:

- `student@brainio.edu`
- `lecturer@brainio.edu`
- `admin@brainio.edu`
- `staff@brainio.edu`
- `advisor@brainio.edu`

Password chung demo: `Brainio@123`

## Tài liệu vận hành

- `docs/SETUP.md`
- `docs/DEPLOYMENT.md`
- `docs/API_USAGE.md`
- `docs/QA_CHECKLIST.md`
- `docs/DEMO_SCRIPT.md`
