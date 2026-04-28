# Agent API (LMS AI Memory Service)

FastAPI service cho chat AI có trí nhớ, tích hợp tool-call vào `lms-api`.

## Run local (không Docker)

```bash
cd apps/agent-api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m src
```

Mặc định service chạy ở `http://localhost:8001`.

## Run qua Docker Compose (repo root)

```bash
docker compose -f infra/docker-compose.yml up -d agent
```

## API base paths

- Legacy: `/v1/*` (giữ tương thích với `apps/agent-web`)
- Documented: `/api/v1/*` (theo tài liệu `docs/API_SPEC.md`)

## Health checks

- `GET /health`
- `GET /v1/health`
- `GET /api/v1/health`
