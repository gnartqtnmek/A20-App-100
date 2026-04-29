# Brainio LMS Setup

## 1. Prerequisites

- Docker Desktop
- Node.js 20+
- Python 3.11+

## 2. Environment

```bash
cp .env.example .env
```

## 3. Start Infrastructure

```bash
docker compose up -d
```

This starts:

- `postgres:15` on `localhost:55432`
- `redis:7` on `localhost:56379`

## 4. Run API

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m alembic upgrade head
python seed.py
uvicorn main:app --reload --port 8000
```

Check:

- `http://localhost:8000/health`
- `http://localhost:8000/docs`
- `POST http://localhost:8000/api/v1/auth/login`

## 5. Run Web

```bash
cd apps/web
npm install
npm run dev
```

Check:

- `http://localhost:3000`

## 6. Demo Role Accounts

- `student@brainio.edu`
- `lecturer@brainio.edu`
- `admin@brainio.edu`
- `staff@brainio.edu`
- `advisor@brainio.edu`

Password: `Brainio@123`
