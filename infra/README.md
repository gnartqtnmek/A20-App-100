# Infra (local development)

Docker Compose stack cho việc phát triển local. Không dùng cho production —
production deploy lên Railway (backend + agent) và Vercel (frontend).

## Services

| Service     | Port  | Mục đích |
|-------------|-------|----------|
| postgres    | 5432  | Relational + pgvector |
| redis       | 6379  | Cache, working memory, Celery broker |
| minio       | 9000  | S3-compatible storage (web UI: 9001) |
| backend     | 8000  | FastAPI LMS API |
| agent       | 8001  | AI Agent service (Sprint 4+ HTTP) |

## Lệnh thường dùng

Chạy từ root repo (Makefile bao bọc các lệnh này):

```bash
make dev        # docker compose up -d
make down       # docker compose down
make logs       # docker compose logs -f
make psql       # mở psql shell vào DB
make redis-cli  # mở redis-cli
```

## Credentials mặc định (dev only)

* Postgres: ``lms / lms`` @ ``localhost:5432`` db ``lms``
* MinIO console: http://localhost:9001 — ``minio / minio12345``
* Bucket mặc định: ``lms-uploads`` (tạo tự động bởi service ``minio-init``)

## Verify pgvector

```bash
docker exec -it lms-postgres psql -U lms -d lms -c "SELECT extname FROM pg_extension WHERE extname = 'vector';"
```

Phải trả về 1 row với ``vector``.
