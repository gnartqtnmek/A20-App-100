# ENV Local Explained

Tai lieu nay giai thich cac bien moi truong cho repo hien tai, phuc vu local run va tranh loi cau hinh.

Nguon doi chieu:
- `/.env.example`
- `docker-compose.yml`
- `apps/api/app/core/config.py`
- `apps/web/lib/api.ts`

## 1) Nen dat env o dau

- `/.env`: duoc `docker compose` doc tu dong.
- `/apps/api/.env`: duoc FastAPI + Alembic doc khi ban chay truc tiep trong `apps/api`.
- `/apps/web/.env.local`: duoc Next.js doc khi chay `npm run dev` trong `apps/web`.

Khuyen nghi local:
1. Tao `/.env` tu `.env.example`.
2. Tao them `apps/api/.env` va `apps/web/.env.local` de chay app truc tiep khong phu thuoc shell env.

## 2) Bang phan loai nhanh

| Bien | Dung demo/local ngay | Bat buoc thay gia tri that | Khong duoc commit GitHub |
|---|---|---|---|
| API_HOST | Co | Khong bat buoc | Co (vi nam trong `.env`) |
| API_PORT | Co | Khong bat buoc | Co |
| WEB_PORT | Co | Khong bat buoc | Co |
| POSTGRES_USER | Co | Nen thay o production | Co |
| POSTGRES_PASSWORD | Co (local demo) | Co | Co |
| POSTGRES_DB | Co | Nen thay o production | Co |
| POSTGRES_PORT | Co | Khong bat buoc | Co |
| DATABASE_URL | Co (local demo) | Co | Co |
| REDIS_PORT | Co | Khong bat buoc | Co |
| REDIS_URL | Co | Nen thay o production | Co |
| CORS_ORIGINS | Co | Can set dung domain that | Co |
| JWT_SECRET | Co (chi local demo) | Co | Co |
| JWT_ALGORITHM | Co (`HS256`) | Khong bat buoc | Co |
| JWT_ACCESS_TOKEN_EXPIRE_MINUTES | Co | Nen review theo policy that | Co |
| JWT_REFRESH_TOKEN_EXPIRE_MINUTES | Co | Nen review theo policy that | Co |
| NEXT_PUBLIC_API_URL | Co | Co (khi deploy) | Co |
| AI_LOG_SERVER | Co (url service) | Co neu doi endpoint noi bo | Co |
| AI_LOG_API_KEY | Khong (can key that) | Co | Co |
| AI_LOG_DIR | Co | Khong bat buoc | Co |

Luu y: cot "Khong duoc commit GitHub" o day ap dung cho file `.env` thuc te. File mau `.env.example` co placeholder thi duoc commit.

## 3) Giai thich chi tiet tung bien quan trong

## `DATABASE_URL`

- Muc dich: ket noi PostgreSQL cho FastAPI va Alembic.
- Dinh dang hien tai:

```text
postgresql+asyncpg://<user>:<password>@<host>:<port>/<db_name>
```

- Gia tri local demo:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:55432/brainio
```

- Su dung o dau:
  - `apps/api/app/core/config.py`
  - `apps/api/app/db/session.py`
  - `apps/api/alembic/env.py`

## `REDIS_URL`

- Muc dich: ket noi Redis cho cache/queue local (hien tai repo chua dung queue nang, nhung bien da san sang).
- Dinh dang:

```text
redis://<host>:<port>/<db_index>
```

- Gia tri local demo:

```env
REDIS_URL=redis://127.0.0.1:56379/0
```

## `JWT_SECRET`

- Muc dich: ky va verify JWT access/refresh token.
- Su dung o `apps/api/app/core/security.py`.
- Local co the de `brainio-dev-secret`.
- Production bat buoc thay bang chuoi random dai, kho doan.

## `CORS_ORIGINS`

- Muc dich: danh sach origin frontend duoc phep goi API.
- Code parse theo danh sach tach bang dau phay trong `apps/api/app/core/config.py`.
- De xuat local:

```env
CORS_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
```

## `NEXT_PUBLIC_API_URL`

- Muc dich: base URL de frontend Next.js goi backend.
- Su dung o `apps/web/lib/api.ts`.
- Local de:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

- Neu doi port backend thi phai doi bien nay theo.

## `SMTP` (neu co)

- Repo hien tai KHONG co bien SMTP trong `.env.example` va khong co code backend doc SMTP env.
- Cac noi dung SMTP trong `docs/BRD.md`, `docs/SAD.md`, `docs/API_SPEC.md` la tai lieu tong quan/roadmap, chua phan anh implementation local hien tai.

## `STORAGE/S3` (neu co)

- Repo hien tai KHONG co bien env S3/Storage trong `.env.example` va khong co code su dung AWS S3 env cho local run.
- Hien tai upload file demo luu local qua backend.

## `OAuth/SSO keys` (neu co)

- Repo hien tai KHONG co bien OAuth/SSO trong `.env.example` va khong co endpoint auth OAuth/SSO trong code chay local.
- Cac noi dung SSO trong docs tong quan la ke hoach mo rong.

## Bat ky API key nao trong repo

Theo code/cau hinh hien tai:
- `AI_LOG_API_KEY`: dung cho hook logging prompt AI khi push Git (AGENTS workflow). Khong commit gia tri that.

Ngoai ra, cac key nhu `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `MEM0_API_KEY`, `RESEND_API_KEY` chi xuat hien trong mot so file tai lieu tong hop, KHONG xuat hien trong code runtime cua `apps/api` + `apps/web` hien tai.

## 4) Mau env de chay local on dinh

## `/.env`

```env
API_HOST=0.0.0.0
API_PORT=8000
WEB_PORT=3000

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=brainio
POSTGRES_PORT=55432

REDIS_PORT=56379

CORS_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
JWT_SECRET=brainio-dev-secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_MINUTES=10080

DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:55432/brainio
REDIS_URL=redis://127.0.0.1:56379/0

NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

AI_LOG_SERVER=https://ai-logs.note.transformerlabs.ai/api/ingest
AI_LOG_API_KEY=replace-with-your-key
AI_LOG_DIR=.ai-log
```

## `/apps/api/.env`

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:55432/brainio
REDIS_URL=redis://127.0.0.1:56379/0
CORS_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
JWT_SECRET=brainio-dev-secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_MINUTES=10080
```

## `/apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## 5) Rule bao mat can nho

- Khong commit file `.env`, `apps/api/.env`, `apps/web/.env.local`.
- Khong share `JWT_SECRET`, `POSTGRES_PASSWORD`, `DATABASE_URL` that, `AI_LOG_API_KEY` tren GitHub/public chat.
- Moi moi truong (dev/staging/prod) nen co secret rieng.
