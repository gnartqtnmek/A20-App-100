# Brainio Local Setup

## Requirements
- Node.js 20+
- Python 3.11+
- Docker Desktop

## Start Infrastructure

```bash
docker compose up -d
```

## Frontend

```bash
cd apps/web
npm install
npm run dev
```

## Backend

```bash
cd apps/api
python -m venv .venv
# activate venv
pip install fastapi uvicorn sqlalchemy alembic asyncpg redis
uvicorn main:app --reload --port 8000
```
