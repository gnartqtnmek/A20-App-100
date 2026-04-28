# Environment & Deployment Strategy
## LMS Chatbot Có Trí Nhớ (AI20K-015)

**Phiên bản:** 2.0  
**Ngày:** 2026-04-27  
**Nhóm:** Team 100

---

## 1. Tổng quan Môi trường

| Môi trường | Mục đích | URL | Git Branch | Auto Deploy? |
|------------|----------|-----|-----------|--------------|
| **Local** | Dev cá nhân, debug | http://localhost:3000 | Bất kỳ | Không |
| **Staging** | Test tích hợp, demo team, QA | https://staging.lms-team100.app | `develop` | Có (khi push) |
| **Production** | Deploy chính thức | https://lms-team100.app | `main` | Có (khi merge PR) |

**Nguyên tắc:**
- Không bao giờ deploy thẳng lên production, phải qua staging trước
- Mọi thay đổi DB (migration) phải test trên staging trước khi apply production
- Production deployment phải được approve bởi ít nhất 1 thành viên khác (PR review)

---

## 2. Yêu cầu Local Development

### 2.1 Phần mềm Cần Cài

```bash
# Kiểm tra versions (phải đáp ứng minimum)
docker --version          # >= 24.0
docker compose version    # >= 2.20
node --version            # >= 20.0 LTS (khuyến nghị 20.11 LTS)
python --version          # >= 3.11 (3.11.x)
git --version             # >= 2.40

# Cài Node.js (dùng nvm - khuyến nghị)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Cài Python (dùng pyenv - khuyến nghị)
curl https://pyenv.run | bash
pyenv install 3.11.8
pyenv global 3.11.8
```

### 2.2 Setup Lần Đầu (First-time Setup)

```bash
# Bước 1: Clone repository
git clone https://github.com/team100/lms-ai-agent.git
cd lms-ai-agent

# Bước 2: Copy tất cả env files
cp .env.example .env
cp apps/lms-api/.env.example apps/lms-api/.env
cp apps/agent-api/.env.example apps/agent-api/.env
cp apps/lms-web/.env.example apps/lms-web/.env.local
cp apps/agent-web/.env.example apps/agent-web/.env.local

# Bước 3: Điền API keys vào .env files (xem Section 3)
# QUAN TRỌNG: Ít nhất phải có ANTHROPIC_API_KEY hoặc OPENAI_API_KEY
# và MEM0_API_KEY để AI Agent hoạt động

# Bước 4: Build và khởi động services
docker compose build    # Build images lần đầu (có thể mất 3-5 phút)
docker compose up -d    # Start tất cả services in background

# Bước 5: Chờ DB sẵn sàng rồi chạy migrations
docker compose exec lms-api sh -c "sleep 5 && alembic upgrade head"

# Bước 6: Tạo dữ liệu mẫu (seed)
docker compose exec lms-api python -m scripts.seed_data

# Bước 7: Kiểm tra tất cả services running
docker compose ps
# Expected: tất cả status "Up"

# Bước 8: Health check
curl http://localhost:8000/health    # LMS API
curl http://localhost:8001/health    # Agent API

# Bước 9: Mở browser
# LMS Web:   http://localhost:3000
# Agent Web: http://localhost:3001
# LMS API Docs (Swagger): http://localhost:8000/docs
# Agent API Docs: http://localhost:8001/docs

# Test accounts sau khi seed:
# Admin:      admin@lms.test / Admin@123456
# GV:         giaovien@lms.test / Giaovien@123456
# SV:         sinhvien@lms.test / Sinhvien@123456
```

### 2.3 Commands Hàng ngày

```bash
# Khởi động (sau khi đã setup lần đầu)
docker compose up -d

# Xem logs của 1 service
docker compose logs -f lms-api
docker compose logs -f agent-api
docker compose logs -f celery-worker

# Xem logs tất cả
docker compose logs -f

# Dừng tất cả
docker compose down

# Dừng VÀ xóa volumes (RESET toàn bộ DB)
docker compose down -v   # ⚠️ Mất hết data! Chỉ dùng khi cần reset

# Restart 1 service (sau khi thay đổi code Python)
docker compose restart lms-api
docker compose restart agent-api

# Chạy migration mới
docker compose exec lms-api alembic upgrade head

# Tạo migration mới (sau khi thêm model)
docker compose exec lms-api alembic revision --autogenerate -m "add_new_table"

# Chạy tests
docker compose exec lms-api pytest tests/ -v

# Shell vào container
docker compose exec lms-api bash
docker compose exec postgres psql -U lms_user -d lms_db
```

---

## 3. Environment Variables — Chi tiết Đầy đủ

### 3.1 Root `.env` — Shared Docker Compose Config

```bash
# ================================================
# POSTGRES DATABASE
# ================================================
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=lms_db
POSTGRES_USER=lms_user
POSTGRES_PASSWORD=ChangeThisToStrongPassword123!
# Production: dùng random 32+ char string

# ================================================
# REDIS
# ================================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=ChangeThisRedisPassword456!
# Production: dùng random 32+ char string

# ================================================
# INTERNAL SERVICE COMMUNICATION
# ================================================
# Key để Agent API authenticate với LMS API
# Format: random 64-char hex string
# Generate: openssl rand -hex 32
AGENT_INTERNAL_KEY=generate_this_with_openssl_rand_hex_32

# ================================================
# ENVIRONMENT CONFIG
# ================================================
ENVIRONMENT=development   # development | staging | production
DEBUG=true               # false trong production

# ================================================
# DEPLOYMENT
# ================================================
APP_DOMAIN=localhost      # staging.lms-team100.app / lms-team100.app
```

---

### 3.2 LMS API — `apps/lms-api/.env`

```bash
# ================================================
# DATABASE CONNECTION
# ================================================
# Format: postgresql+asyncpg://user:pass@host:port/dbname
DATABASE_URL=postgresql+asyncpg://lms_user:ChangeThisToStrongPassword123!@postgres:5432/lms_db

# Synchronous URL (cho Alembic migrations)
SYNC_DATABASE_URL=postgresql://lms_user:ChangeThisToStrongPassword123!@postgres:5432/lms_db

# Pool settings
DB_POOL_SIZE=10          # Số connections trong pool
DB_MAX_OVERFLOW=20       # Max extra connections khi pool đầy
DB_POOL_TIMEOUT=30       # Giây chờ nếu pool đầy

# ================================================
# JWT AUTHENTICATION
# ================================================
# Generate: openssl rand -hex 32
JWT_SECRET_KEY=generate_with_openssl_rand_hex_32_minimum_32_chars
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15     # 15 phút
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7        # 7 ngày

# ================================================
# SECURITY
# ================================================
# CORS - danh sách domains được phép gọi API
# Local: http://localhost:3000,http://localhost:3001
# Production: https://lms-team100.app,https://agent.lms-team100.app
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Bcrypt cost factor (12 là standard, 14 cho production security cao)
BCRYPT_COST=12

# ================================================
# FILE STORAGE
# ================================================
UPLOAD_DIR=/uploads                # Mount point trong Docker
MAX_FILE_SIZE_MB=50                # Giới hạn file upload
ALLOWED_FILE_TYPES=pdf,docx,pptx,txt,zip  # Extension allowed

# ================================================
# EMAIL SERVICE (Resend)
# ================================================
# Get API key from: resend.com → API Keys
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@lms-team100.app
EMAIL_FROM_NAME=LMS Team 100
EMAIL_REPLY_TO=support@lms-team100.app

# ================================================
# CELERY (Background Tasks)
# ================================================
CELERY_BROKER_URL=redis://:ChangeThisRedisPassword456!@redis:6379/0
CELERY_RESULT_BACKEND=redis://:ChangeThisRedisPassword456!@redis:6379/1
CELERY_TASK_SERIALIZER=json
CELERY_RESULT_SERIALIZER=json
CELERY_TIMEZONE=Asia/Ho_Chi_Minh

# ================================================
# RATE LIMITING
# ================================================
RATE_LIMIT_REDIS_URL=redis://:ChangeThisRedisPassword456!@redis:6379/2
RATE_LIMIT_DEFAULT=60              # requests per minute (general)
RATE_LIMIT_AUTH=10                 # requests per minute (auth endpoints)
RATE_LIMIT_UPLOAD=5                # requests per minute (file upload)

# ================================================
# INTERNAL AGENT COMMUNICATION
# ================================================
AGENT_INTERNAL_KEY=generate_this_with_openssl_rand_hex_32
AGENT_API_URL=http://agent-api:8001        # Internal Docker URL

# ================================================
# APPLICATION
# ================================================
APP_NAME=LMS API
APP_VERSION=1.0.0
LOG_LEVEL=INFO                     # DEBUG | INFO | WARNING | ERROR
DEBUG=true                         # false trong production

# ================================================
# SCHEDULED TASKS CONFIG
# ================================================
WEEKLY_DIGEST_WEEKDAY=0            # 0=Monday, 6=Sunday
WEEKLY_DIGEST_HOUR=8               # 8 AM
WEEKLY_DIGEST_MINUTE=0
DEADLINE_REMINDER_HOUR=9           # 9 AM daily
DEADLINE_REMINDER_DAYS=[1,2]       # Nhắc khi còn 1 ngày VÀ 2 ngày
```

---

### 3.3 Agent API — `apps/agent-api/.env`

```bash
# ================================================
# LLM PROVIDERS
# ================================================
# PRIMARY: Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Get from: console.anthropic.com → API Keys

# SECONDARY/FALLBACK: OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Get from: platform.openai.com → API Keys

# Model Selection
LLM_PRIMARY_PROVIDER=anthropic           # anthropic | openai
LLM_PRIMARY_MODEL=claude-sonnet-4-6      # Claude model
LLM_FALLBACK_PROVIDER=openai             # Dùng khi Anthropic fails
LLM_FALLBACK_MODEL=gpt-4o-mini           # OpenAI fallback model

# LLM Parameters
LLM_MAX_TOKENS=2048                      # Max tokens per response
LLM_TEMPERATURE=0.7                      # 0.0 (deterministic) - 1.0 (creative)
LLM_STREAM=true                          # Luôn true cho chat

# ================================================
# EMBEDDING MODEL (OpenAI cho embeddings)
# ================================================
EMBEDDING_MODEL=text-embedding-3-small   # 1536 dimensions, cheaper
EMBEDDING_DIMENSIONS=1536
EMBEDDING_BATCH_SIZE=100                 # Số texts embed cùng lúc

# ================================================
# MEMORY (Mem0)
# ================================================
# Option A: Dùng Mem0 Cloud (đơn giản hơn)
MEM0_API_KEY=m0-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Get from: app.mem0.ai → API Keys

# Option B: Self-hosted Mem0 (uncomment nếu tự host)
# MEM0_API_URL=http://mem0-server:8000
# MEM0_API_KEY=local_key

# Memory Settings
MEM0_USER_ID_PREFIX=lms_user_            # Prefix để phân biệt user IDs
MEMORY_SEARCH_LIMIT=5                    # Max memories retrieved per query
MEMORY_MIN_RELEVANCE=0.5                 # Min relevance score để include

# ================================================
# VECTOR STORE (pgvector trong PostgreSQL)
# ================================================
# Dùng cùng PostgreSQL với LMS API
VECTOR_DB_URL=postgresql://lms_user:ChangeThisToStrongPassword123!@postgres:5432/lms_db
VECTOR_SIMILARITY_THRESHOLD=0.7          # Min cosine similarity để trả về chunk
VECTOR_TOP_K=5                           # Max chunks trả về per query

# ================================================
# DATABASE (cho Agent-specific tables)
# ================================================
DATABASE_URL=postgresql+asyncpg://lms_user:ChangeThisToStrongPassword123!@postgres:5432/lms_db

# ================================================
# LMS API INTERNAL
# ================================================
LMS_API_URL=http://lms-api:8000          # Internal Docker network URL
AGENT_INTERNAL_KEY=generate_this_with_openssl_rand_hex_32

# ================================================
# JWT (để verify tokens từ frontend)
# ================================================
# PHẢI MATCH với LMS API JWT_SECRET_KEY
JWT_SECRET_KEY=generate_with_openssl_rand_hex_32_minimum_32_chars
JWT_ALGORITHM=HS256

# ================================================
# RATE LIMITING
# ================================================
AI_RATE_LIMIT_PER_MINUTE=10              # Max chat requests per user per minute
REDIS_URL=redis://:ChangeThisRedisPassword456!@redis:6379/2

# ================================================
# DOCUMENT PROCESSING
# ================================================
CHUNK_SIZE=1000                          # Characters per chunk
CHUNK_OVERLAP=200                        # Overlap characters giữa chunks
MAX_DOCUMENT_SIZE_MB=100                 # Documents lớn hơn bị reject khi index

# ================================================
# APPLICATION
# ================================================
APP_NAME=Agent API
APP_VERSION=1.0.0
LOG_LEVEL=INFO
DEBUG=true
```

---

### 3.4 LMS Web — `apps/lms-web/.env.local`

```bash
# ================================================
# API ENDPOINTS
# ================================================
# Trong Docker Compose, Next.js gọi qua Caddy
NEXT_PUBLIC_LMS_API_URL=http://localhost:8000
NEXT_PUBLIC_AGENT_API_URL=http://localhost:8001

# Production:
# NEXT_PUBLIC_LMS_API_URL=https://api.lms-team100.app
# NEXT_PUBLIC_AGENT_API_URL=https://agent-api.lms-team100.app

# ================================================
# SERVER-SIDE (không expose ra client)
# ================================================
# Dùng cho Next.js Server Components/API routes
LMS_API_INTERNAL_URL=http://lms-api:8000    # Chỉ trong Docker network

# ================================================
# APP CONFIG
# ================================================
NEXT_PUBLIC_APP_NAME="LMS Team 100"
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_URL=http://localhost:3000    # Full URL của app

# ================================================
# FEATURES FLAGS
# ================================================
NEXT_PUBLIC_FEATURE_AGENT_CHAT=true         # Enable AI Chat tab
NEXT_PUBLIC_FEATURE_ANALYTICS=false         # Chưa làm (phase 2)
NEXT_PUBLIC_FEATURE_MEMORY_VIEW=true        # Memory page
```

---

### 3.5 Agent Web — `apps/agent-web/.env.local`

```bash
NEXT_PUBLIC_AGENT_API_URL=http://localhost:8001
NEXT_PUBLIC_LMS_API_URL=http://localhost:8000
NEXT_PUBLIC_LMS_WEB_URL=http://localhost:3000   # Link "Quay lại LMS"
NEXT_PUBLIC_APP_NAME="AI Assistant"
```

---

## 4. Docker Compose (Development)

### `docker-compose.yml` — Đầy đủ

```yaml
version: '3.9'

x-common-env: &common-env
  ENVIRONMENT: ${ENVIRONMENT:-development}

services:
  # ================================================
  # INFRASTRUCTURE
  # ================================================
  postgres:
    image: pgvector/pgvector:pg15
    container_name: lms_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-lms_db}
      POSTGRES_USER: ${POSTGRES_USER:-lms_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--auth-host=scram-sha-256"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init_db.sql:/docker-entrypoint-initdb.d/01_init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-lms_user} -d ${POSTGRES_DB:-lms_db}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - lms_network

  redis:
    image: redis:7-alpine
    container_name: lms_redis
    restart: unless-stopped
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD}
      --maxmemory 512mb
      --maxmemory-policy allkeys-lru
      --save 900 1
      --save 300 10
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - lms_network

  # ================================================
  # BACKEND SERVICES
  # ================================================
  lms-api:
    build:
      context: ./apps/lms-api
      dockerfile: Dockerfile
      target: development
    container_name: lms_api
    restart: unless-stopped
    env_file:
      - ./apps/lms-api/.env
    environment:
      <<: *common-env
    ports:
      - "8000:8000"
    volumes:
      - ./apps/lms-api:/app
      - uploads_data:/uploads
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --reload-dir /app
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
    networks:
      - lms_network

  agent-api:
    build:
      context: ./apps/agent-api
      dockerfile: Dockerfile
      target: development
    container_name: lms_agent_api
    restart: unless-stopped
    env_file:
      - ./apps/agent-api/.env
    environment:
      <<: *common-env
    ports:
      - "8001:8001"
    volumes:
      - ./apps/agent-api:/app
    depends_on:
      postgres:
        condition: service_healthy
      lms-api:
        condition: service_healthy
    command: uvicorn src.api.app:app --host 0.0.0.0 --port 8001 --reload --reload-dir /app
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 20s
    networks:
      - lms_network

  celery-worker:
    build:
      context: ./apps/lms-api
      dockerfile: Dockerfile
      target: development
    container_name: lms_celery_worker
    restart: unless-stopped
    env_file:
      - ./apps/lms-api/.env
    environment:
      <<: *common-env
    command: >
      celery -A app.tasks.celery_app worker
      --loglevel=info
      --concurrency=4
      --queues=default,email,notifications
      --max-tasks-per-child=100
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./apps/lms-api:/app
      - uploads_data:/uploads
    networks:
      - lms_network

  celery-beat:
    build:
      context: ./apps/lms-api
      dockerfile: Dockerfile
      target: development
    container_name: lms_celery_beat
    restart: unless-stopped
    env_file:
      - ./apps/lms-api/.env
    command: >
      celery -A app.tasks.celery_app beat
      --loglevel=info
      --schedule=/tmp/celerybeat-schedule
    depends_on:
      celery-worker:
        condition: service_started
    volumes:
      - ./apps/lms-api:/app
    networks:
      - lms_network

  celery-flower:
    image: mher/flower:2.0
    container_name: lms_flower
    restart: unless-stopped
    ports:
      - "5555:5555"
    environment:
      CELERY_BROKER_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
      FLOWER_BASIC_AUTH: admin:flowerpassword   # Đổi trong production
    depends_on:
      - redis
    networks:
      - lms_network
    profiles:
      - monitoring   # Chỉ start khi: docker compose --profile monitoring up

  # ================================================
  # FRONTEND SERVICES
  # ================================================
  lms-web:
    build:
      context: ./apps/lms-web
      dockerfile: Dockerfile
      target: development
    container_name: lms_web
    restart: unless-stopped
    env_file:
      - ./apps/lms-web/.env.local
    ports:
      - "3000:3000"
    volumes:
      - ./apps/lms-web/src:/app/src
      - ./apps/lms-web/public:/app/public
      - /app/node_modules    # Anonymous volume để không overwrite node_modules
      - /app/.next
    command: npm run dev
    depends_on:
      lms-api:
        condition: service_healthy
    networks:
      - lms_network

  agent-web:
    build:
      context: ./apps/agent-web
      dockerfile: Dockerfile
      target: development
    container_name: lms_agent_web
    restart: unless-stopped
    env_file:
      - ./apps/agent-web/.env.local
    ports:
      - "3001:3001"
    volumes:
      - ./apps/agent-web/src:/app/src
      - /app/node_modules
    command: npm run dev -- --port 3001
    depends_on:
      agent-api:
        condition: service_healthy
    networks:
      - lms_network

  # ================================================
  # REVERSE PROXY
  # ================================================
  caddy:
    image: caddy:2-alpine
    container_name: lms_caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"   # HTTP/3
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - lms-web
      - agent-web
      - lms-api
      - agent-api
    networks:
      - lms_network

networks:
  lms_network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  uploads_data:
    driver: local
  caddy_data:
    driver: local
  caddy_config:
    driver: local
```

---

## 5. Dockerfiles

### `apps/lms-api/Dockerfile`

```dockerfile
FROM python:3.11-slim AS base

# System dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    curl \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Development stage ──
FROM base AS development
COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements.txt -r requirements-dev.txt
COPY . .
# Dev: uvicorn với --reload (chạy qua docker-compose command override)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# ── Production stage ──
FROM base AS production
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
# Production: Gunicorn + Uvicorn workers
CMD ["gunicorn", "app.main:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--timeout", "60"]

EXPOSE 8000
```

### `apps/lms-web/Dockerfile`

```dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# ── Dependencies stage ──
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ── Development stage ──
FROM base AS development
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ── Build stage ──
FROM deps AS builder
COPY . .
# Build args cho production
ARG NEXT_PUBLIC_LMS_API_URL
ARG NEXT_PUBLIC_AGENT_API_URL
ARG NEXT_PUBLIC_APP_NAME
RUN npm run build

# ── Production stage ──
FROM base AS production
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
```

**`next.config.ts` cần thêm:**
```typescript
const nextConfig = {
  output: 'standalone',  // Required cho production Docker
  // ...
}
```

---

## 6. Caddyfile

### Development (`localhost`)

```
# Caddyfile.dev
:80 {
    @lms_web host localhost
    handle @lms_web {
        reverse_proxy lms-web:3000
    }
}

:8000 {
    reverse_proxy lms-api:8000
}

:8001 {
    reverse_proxy agent-api:8001
}
```

### Production

```
# Caddyfile (Production)

lms-team100.app {
    # Frontend
    reverse_proxy lms-web:3000 {
        health_uri /api/health
        health_interval 30s
        health_timeout 10s
    }
    
    # Compression
    encode gzip zstd
    
    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "camera=(), microphone=(), geolocation=()"
        -Server  # Ẩn server header
    }
    
    # Access logs
    log {
        output file /var/log/caddy/lms-web.log {
            roll_size 50mb
            roll_keep 5
        }
        format json
    }
}

agent.lms-team100.app {
    reverse_proxy agent-web:3001 {
        health_uri /api/health
        health_interval 30s
    }
    
    encode gzip
    
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Frame-Options "SAMEORIGIN"
    }
}

api.lms-team100.app {
    # LMS API
    reverse_proxy lms-api:8000 {
        health_uri /health
        health_interval 10s
    }
    
    # Rate limiting (nếu dùng Caddy Rate Limit plugin)
    # Caddy v2 cần plugin: github.com/mholt/caddy-ratelimit
    
    # CORS headers cho API
    header {
        Access-Control-Allow-Origin "https://lms-team100.app"
        Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Authorization, Content-Type, X-Request-ID"
        Access-Control-Max-Age "86400"
    }
    
    # Handle preflight
    @options method OPTIONS
    respond @options 204
    
    encode gzip
    
    log {
        output file /var/log/caddy/lms-api.log {
            roll_size 100mb
            roll_keep 10
        }
        format json
    }
}

agent-api.lms-team100.app {
    reverse_proxy agent-api:8001 {
        # SSE cần disable buffering
        flush_interval -1
        health_uri /health
        health_interval 10s
    }
    
    # Timeout cao hơn vì AI responses có thể mất lâu
    request_body {
        max_size 10MB
    }
    
    header {
        Access-Control-Allow-Origin "https://agent.lms-team100.app"
        Access-Control-Allow-Methods "GET, POST, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Authorization, Content-Type"
        # SSE: không cache
        Cache-Control "no-cache"
    }
    
    encode gzip
}
```

---

## 7. Database Migrations

### Workflow chuẩn

```bash
# 1. Tạo migration sau khi thêm/sửa SQLAlchemy model
docker compose exec lms-api alembic revision \
    --autogenerate \
    -m "add_course_announcements_table"

# 2. Review file migration được generate
# File ở: apps/lms-api/alembic/versions/XXXX_add_course_announcements_table.py
# LUÔN xem lại trước khi apply! Autogenerate có thể sai.

# 3. Apply migration
docker compose exec lms-api alembic upgrade head

# 4. Rollback nếu cần
docker compose exec lms-api alembic downgrade -1      # Rollback 1 bước
docker compose exec lms-api alembic downgrade base    # Rollback tất cả

# 5. Xem trạng thái
docker compose exec lms-api alembic current
docker compose exec lms-api alembic history --verbose
```

### Quy tắc Migration

```
✅ LÀM:
- Mỗi migration = 1 thay đổi cụ thể (1 table, hoặc 1 column change)
- Đặt tên rõ ràng: add_, remove_, alter_, create_, rename_
- Test upgrade() VÀ downgrade() trên local trước khi commit
- Thêm column nullable/có default value (không break existing data)

❌ KHÔNG LÀM:
- Xóa column trực tiếp trong production → dùng 2 bước:
  Sprint N:   Deprecate (add _deprecated suffix, stop reading)
  Sprint N+1: Remove column sau khi đã verify không dùng nữa
- Rename column/table trực tiếp → tạo new + migrate data + delete old
- Thêm NOT NULL column không có default vào table đã có data
```

---

## 8. CI/CD Pipeline — GitHub Actions

### `.github/workflows/ci.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ghcr.io/${{ github.repository_owner }}/lms-team100

jobs:
  # ============================================================
  # JOB 1: Lint & Type Check
  # ============================================================
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: apps/lms-api/requirements.txt
      
      - name: Python Lint
        run: |
          pip install ruff mypy
          cd apps/lms-api && ruff check . && mypy app/
          cd ../agent-api && ruff check . && mypy src/
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: |
            apps/lms-web/package-lock.json
            apps/agent-web/package-lock.json
      
      - name: Frontend Type Check
        run: |
          cd apps/lms-web && npm ci && npm run type-check && npm run lint
          cd ../agent-web && npm ci && npm run type-check && npm run lint

  # ============================================================
  # JOB 2: Test LMS API
  # ============================================================
  test-lms-api:
    name: Test LMS API
    runs-on: ubuntu-latest
    needs: lint
    
    services:
      postgres:
        image: pgvector/pgvector:pg15
        env:
          POSTGRES_DB: test_lms_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password123
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    env:
      DATABASE_URL: postgresql+asyncpg://test_user:test_password123@localhost:5432/test_lms_db
      SYNC_DATABASE_URL: postgresql://test_user:test_password123@localhost:5432/test_lms_db
      JWT_SECRET_KEY: ci_test_jwt_secret_key_for_testing_only_32c
      JWT_ALGORITHM: HS256
      JWT_ACCESS_TOKEN_EXPIRE_MINUTES: 15
      JWT_REFRESH_TOKEN_EXPIRE_DAYS: 7
      AGENT_INTERNAL_KEY: ci_test_agent_key_for_testing_only_32c
      CELERY_BROKER_URL: redis://localhost:6379/0
      CELERY_RESULT_BACKEND: redis://localhost:6379/1
      RESEND_API_KEY: re_test_fake_key
      EMAIL_FROM: test@test.com
      UPLOAD_DIR: /tmp/test_uploads
      DEBUG: false
      LOG_LEVEL: WARNING
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: apps/lms-api/requirements.txt
      
      - name: Install dependencies
        run: |
          cd apps/lms-api
          pip install -r requirements.txt
          pip install pytest pytest-asyncio pytest-cov httpx faker
      
      - name: Run migrations
        run: |
          cd apps/lms-api
          alembic upgrade head
      
      - name: Run tests with coverage
        run: |
          cd apps/lms-api
          pytest tests/ -v \
            --cov=app \
            --cov-report=xml \
            --cov-report=term-missing \
            --cov-fail-under=70
      
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: apps/lms-api/coverage.xml

  # ============================================================
  # JOB 3: Test Agent API
  # ============================================================
  test-agent-api:
    name: Test Agent API
    runs-on: ubuntu-latest
    needs: lint
    
    services:
      postgres:
        image: pgvector/pgvector:pg15
        env:
          POSTGRES_DB: test_lms_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password123
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    env:
      DATABASE_URL: postgresql+asyncpg://test_user:test_password123@localhost:5432/test_lms_db
      ANTHROPIC_API_KEY: sk-ant-fake-key-for-testing
      OPENAI_API_KEY: sk-fake-key-for-testing
      MEM0_API_KEY: fake-mem0-key
      LMS_API_URL: http://localhost:8000
      AGENT_INTERNAL_KEY: ci_test_agent_key_for_testing_only_32c
      JWT_SECRET_KEY: ci_test_jwt_secret_key_for_testing_only_32c
      VECTOR_DB_URL: postgresql://test_user:test_password123@localhost:5432/test_lms_db
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: apps/agent-api/requirements.txt
      
      - name: Install dependencies
        run: |
          cd apps/agent-api
          pip install -r requirements.txt
          pip install pytest pytest-asyncio httpx
      
      - name: Run tests (mocked external APIs)
        run: |
          cd apps/agent-api
          pytest tests/ -v --tb=short

  # ============================================================
  # JOB 4: Build Frontend
  # ============================================================
  build-frontend:
    name: Build Frontend
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Build LMS Web
        run: |
          cd apps/lms-web
          npm ci
          NEXT_PUBLIC_LMS_API_URL=https://api.lms-team100.app \
          NEXT_PUBLIC_AGENT_API_URL=https://agent-api.lms-team100.app \
          npm run build
      
      - name: Build Agent Web
        run: |
          cd apps/agent-web
          npm ci
          NEXT_PUBLIC_AGENT_API_URL=https://agent-api.lms-team100.app \
          npm run build

  # ============================================================
  # JOB 5: Deploy to Staging
  # ============================================================
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [test-lms-api, test-agent-api, build-frontend]
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      
      - name: Deploy LMS API
        run: railway up --service lms-api --environment staging
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_STAGING_TOKEN }}
      
      - name: Run Migrations on Staging
        run: railway run --service lms-api --environment staging -- alembic upgrade head
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_STAGING_TOKEN }}
      
      - name: Deploy Agent API
        run: railway up --service agent-api --environment staging
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_STAGING_TOKEN }}
      
      - name: Deploy LMS Web
        run: railway up --service lms-web --environment staging
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_STAGING_TOKEN }}
      
      - name: Deploy Agent Web
        run: railway up --service agent-web --environment staging
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_STAGING_TOKEN }}
      
      - name: Notify Slack
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: "Staging deploy: ${{ job.status }}"
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}

  # ============================================================
  # JOB 6: Deploy to Production
  # ============================================================
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [test-lms-api, test-agent-api, build-frontend]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment: production   # Requires manual approval in GitHub
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      
      - name: Deploy LMS API to Production
        run: railway up --service lms-api --environment production
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_PRODUCTION_TOKEN }}
      
      - name: Run Migrations
        run: railway run --service lms-api --environment production -- alembic upgrade head
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_PRODUCTION_TOKEN }}
      
      # ... Deploy other services ...
```

---

## 9. Railway Production Setup

### 9.1 Service Configuration

**LMS API Service:**
```
Name:           lms-api
Region:         Asia Pacific (Singapore) ← gần VN nhất
Root Directory: apps/lms-api
Build Command:  pip install -r requirements.txt
Start Command:  gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:$PORT
Health Check:   /health (HTTP GET, 30s interval)
Replicas:       1 (scale up nếu cần)
RAM:            512MB min, 2GB max
CPU:            0.5 vCPU
```

**Agent API Service:**
```
Name:           agent-api
Root Directory: apps/agent-api
Build Command:  pip install -r requirements.txt
Start Command:  gunicorn src.api.app:app -w 2 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:$PORT --timeout 120
Health Check:   /health
RAM:            1GB min, 4GB max  ← AI cần nhiều RAM hơn
CPU:            1 vCPU
```

**PostgreSQL Service:**
```
Name:           postgres
Image:          pgvector/pgvector:pg15
Volume:         /var/lib/postgresql/data → 20GB persistent
Backups:        Daily (Railway feature, giữ 7 days)
Connection:     Internal URL (không expose ra internet)
```

### 9.2 Environment Variables Production

Tất cả env vars được set trong Railway Dashboard → Service → Variables:

```
# LMS API Production Variables:
DATABASE_URL          = <Railway PostgreSQL URL (asyncpg)>
SYNC_DATABASE_URL     = <Railway PostgreSQL URL (sync)>
JWT_SECRET_KEY        = <PRODUCTION_RANDOM_64_CHAR>
AGENT_INTERNAL_KEY    = <PRODUCTION_RANDOM_64_CHAR>
RESEND_API_KEY        = <Production Resend key>
ALLOWED_ORIGINS       = https://lms-team100.app,https://agent.lms-team100.app
REDIS_URL             = <Railway Redis URL>
DEBUG                 = false
LOG_LEVEL             = INFO
ENVIRONMENT           = production
BCRYPT_COST           = 12
```

---

## 10. Monitoring & Troubleshooting

### 10.1 Logs

```bash
# Local
docker compose logs -f lms-api --tail 100
docker compose logs -f celery-worker --tail 100

# Railway
railway logs --service lms-api --tail 100
railway logs --service agent-api --tail 100

# Filter lỗi
railway logs --service lms-api | grep "ERROR"
```

### 10.2 Health Check Commands

```bash
# Test tất cả endpoints
curl -s http://localhost:8000/health | python -m json.tool
curl -s http://localhost:8001/health | python -m json.tool

# Test database connection
docker compose exec postgres pg_isready -U lms_user -d lms_db

# Test Redis
docker compose exec redis redis-cli -a $REDIS_PASSWORD ping

# Test Celery
docker compose exec celery-worker celery -A app.tasks.celery_app inspect ping
docker compose exec celery-worker celery -A app.tasks.celery_app inspect registered
```

### 10.3 Common Issues & Solutions

**Issue: "code chạy local nhưng lỗi khi deploy"**
```bash
# Checklist:
□ Tất cả env vars đã set đúng trên Railway?
□ DATABASE_URL dùng asyncpg:// prefix?
□ Migration đã chạy? railway run alembic upgrade head
□ ALLOWED_ORIGINS có domain production?
□ File uploads: volume đã mount?
□ Redis password đúng format trong URL? redis://:password@host:port/db
```

**Issue: "Agent không trả lời về điểm số"**
```bash
# 1. Check Agent API logs
railway logs --service agent-api | grep "get_grades\|tool_call\|LMS API"

# 2. Check AGENT_INTERNAL_KEY match
# LMS API env: AGENT_INTERNAL_KEY=xxx
# Agent API env: AGENT_INTERNAL_KEY=xxx  ← phải giống hệt

# 3. Test internal endpoint
docker compose exec agent-api curl http://lms-api:8000/api/v1/agent-tools/students/test-uuid/grades \
  -H "X-Agent-Key: $AGENT_INTERNAL_KEY"
```

**Issue: "Email không gửi"**
```bash
# 1. Check Celery worker đang chạy
docker compose exec celery-worker celery -A app.tasks.celery_app inspect active

# 2. Check task queue
docker compose exec celery-worker celery -A app.tasks.celery_app inspect reserved

# 3. Check email logs trong DB
docker compose exec postgres psql -U lms_user -d lms_db -c \
  "SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10;"

# 4. Test RESEND_API_KEY
curl -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"test@lms.app","to":"your@email.com","subject":"Test","text":"Test"}'
```

**Issue: "Weekly digest không gửi"**
```bash
# 1. Check Celery Beat đang chạy
docker compose ps celery-beat

# 2. Xem scheduled tasks
docker compose exec lms-api celery -A app.tasks.celery_app beat --show

# 3. Trigger thủ công để test
docker compose exec lms-api python -c \
  "from app.tasks.email_tasks import generate_weekly_digests; generate_weekly_digests.delay()"
```

**Issue: "SSE streaming không hoạt động"**
```bash
# Caddy cần config flush_interval -1 cho SSE
# Kiểm tra trong Caddyfile:
agent-api.example.com {
    reverse_proxy agent-api:8001 {
        flush_interval -1   ← BẮT BUỘC cho SSE
    }
}

# Test SSE trực tiếp (không qua Caddy)
curl -N http://localhost:8001/api/v1/conversations/test-id/messages \
  -X POST \
  -H "Accept: text/event-stream" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"test"}'
```

---

## 11. Backup & Disaster Recovery

```bash
# ================================================
# MANUAL BACKUP
# ================================================

# Backup PostgreSQL
docker compose exec postgres pg_dump \
  -U lms_user \
  -d lms_db \
  --format=custom \
  --compress=9 \
  > backups/lms_db_$(date +%Y%m%d_%H%M%S).pgdump

# Restore từ backup
docker compose exec -T postgres pg_restore \
  -U lms_user \
  -d lms_db \
  --clean \
  --if-exists \
  < backups/lms_db_20240115_080000.pgdump

# Backup uploads
tar -czf backups/uploads_$(date +%Y%m%d).tar.gz uploads/

# ================================================
# AUTOMATED BACKUP (Cron on Railway)
# ================================================
# Railway PostgreSQL có built-in daily backups
# Giữ 7 ngày, có thể restore từ Dashboard

# ================================================
# RECOVERY STEPS khi production sập
# ================================================
# 1. Kiểm tra Railway Dashboard → service logs
# 2. Nếu DB corrupt: restore từ backup mới nhất
# 3. Nếu code lỗi: Railway Dashboard → Deployments → Rollback
# 4. Nếu OOM: tăng RAM trong Railway service settings
```

---

*Tài liệu này phải được update mỗi khi có thay đổi về infrastructure, dependencies, hoặc deployment process.*
