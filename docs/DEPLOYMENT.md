# Brainio LMS Deployment (Local Docker Compose)

## Prerequisites

- Docker Desktop
- Docker Compose v2

## 1. Environment

Copy env file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Important vars:
- `POSTGRES_PORT` default `55432`
- `REDIS_PORT` default `56379`
- `API_PORT` default `8000`
- `WEB_PORT` default `3000`

## 2. Build & Start

```bash
docker compose up -d --build
```

Services:
- `postgres` (PostgreSQL 15)
- `redis` (Redis 7)
- `api` (FastAPI)
- `web` (Next.js)

## 3. Migrate & Seed

```bash
docker compose exec api alembic upgrade head
docker compose exec api python seed.py
```

## 4. Health Checks

- API health: `http://127.0.0.1:8000/health`
- API docs: `http://127.0.0.1:8000/docs`
- Web app: `http://127.0.0.1:3000/login`

## 5. Stop

```bash
docker compose down
```

If you need volume reset:

```bash
docker compose down -v
```
