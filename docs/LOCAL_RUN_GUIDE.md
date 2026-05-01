# Brainio LMS Local Run Guide (Step-by-step)

Tai lieu nay huong dan chay Brainio LMS tren local theo repo hien tai (`apps/api` + `apps/web`) cho nguoi moi, uu tien Windows PowerShell.

## 0) Cai cong cu can thiet

Can cai truoc:
- Git
- Docker Desktop (co Docker Compose v2)
- Python 3.12+
- Node.js 20+

Kiem tra nhanh trong PowerShell:

```powershell
git --version
docker --version
docker compose version
python --version
node --version
npm --version
```

Neu thieu lenh nao, cai cong cu do truoc roi quay lai.

## 1) Clone repo

Neu ban chua co source:

```powershell
git clone <REPO_URL> "Team 100"
cd "Team 100"
```

Neu ban da o dung thu muc repo, bo qua buoc nay.

## 2) Tao file .env

Repo hien tai su dung 3 lop env de chay local de on dinh:
- `/.env`: cho `docker compose`
- `/apps/api/.env`: cho FastAPI + Alembic khi chay truc tiep bang Python
- `/apps/web/.env.local`: cho Next.js khi chay `npm run dev`

### 2.1 Tao `/.env` tu mau

```powershell
Copy-Item .env.example .env
```

### 2.2 Tao `/apps/api/.env`

```powershell
@"
DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:55432/brainio
REDIS_URL=redis://127.0.0.1:56379/0
CORS_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
JWT_SECRET=brainio-dev-secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_MINUTES=10080
"@ | Set-Content -Encoding UTF8 apps/api/.env
```

### 2.3 Tao `/apps/web/.env.local`

```powershell
@"
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
"@ | Set-Content -Encoding UTF8 apps/web/.env.local
```

## 3) Dien bien moi truong

Gia tri local demo co the dung ngay:
- `DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:55432/brainio`
- `REDIS_URL=redis://127.0.0.1:56379/0`
- `CORS_ORIGINS=http://127.0.0.1:3000,http://localhost:3000`
- `NEXT_PUBLIC_API_URL=http://127.0.0.1:8000`

Gia tri can thay khi dua len moi truong that (khong dung demo):
- `JWT_SECRET`
- `POSTGRES_PASSWORD`
- `DATABASE_URL` (credential that)
- `AI_LOG_API_KEY` (neu dung hook push log AI)

Chi tiet tung bien xem them trong [ENV_LOCAL_EXPLAINED.md](./ENV_LOCAL_EXPLAINED.md).

## 4) Chay PostgreSQL + Redis bang Docker

Bat Docker Desktop truoc, sau do chay:

```powershell
docker compose up -d postgres redis
docker compose ps
```

Kiem tra nhanh:
- Postgres host port mac dinh: `55432`
- Redis host port mac dinh: `56379`

## 5) Chuan bi backend FastAPI

```powershell
cd apps/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Neu bi chan script activation, mo PowerShell moi voi quyen user va chay:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## 6) Chay migration

Dung trong thu muc `apps/api` (venv da active):

```powershell
python -m alembic upgrade head
python -m alembic current
```

## 7) Chay seed data

```powershell
python seed.py
```

Seed hien tai la idempotent cho phan du lieu chinh (chay lai khong lam hong baseline demo).

## 8) Chay backend FastAPI

Van trong `apps/api`:

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Kiem tra:
- Health: `http://127.0.0.1:8000/health`
- Swagger: `http://127.0.0.1:8000/docs`

## 9) Chay frontend Next.js

Mo terminal PowerShell thu 2:

```powershell
cd "C:\Users\ADMIN\Downloads\Team 100\apps\web"
npm install
npm run dev
```

Truy cap:
- `http://127.0.0.1:3000/login`

Luu y: trang `/login` la form dang nhap on dinh nhat theo seed password hien tai.

## 10) Dang nhap 5 role demo

Dung cung 1 mat khau:
- `Brainio@123`

| Role | Email | Password |
|---|---|---|
| student | `student@brainio.edu` | `Brainio@123` |
| lecturer | `lecturer@brainio.edu` | `Brainio@123` |
| admin | `admin@brainio.edu` | `Brainio@123` |
| academic_staff | `staff@brainio.edu` | `Brainio@123` |
| advisor | `advisor@brainio.edu` | `Brainio@123` |

## 11) Kiem tra API docs

Mo trinh duyet:
- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

Test nhanh login API:

```powershell
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/auth/login" -ContentType "application/json" -Body '{"email":"student@brainio.edu","password":"Brainio@123"}'
```

## 12) Kiem tra database

### 12.1 Kiem tra ket noi Postgres trong container

```powershell
docker compose exec postgres psql -U postgres -d brainio -c "select now();"
```

### 12.2 Kiem tra bang user va role demo

```powershell
docker compose exec postgres psql -U postgres -d brainio -c "select email, role, is_active from users order by email;"
```

### 12.3 Kiem tra Redis

```powershell
docker compose exec redis redis-cli ping
```

Ket qua mong doi: `PONG`.

## 13) Lenh local run day du (copy chay tu dau)

```powershell
cd "C:\Users\ADMIN\Downloads\Team 100"
Copy-Item .env.example .env
@"
DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:55432/brainio
REDIS_URL=redis://127.0.0.1:56379/0
CORS_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
JWT_SECRET=brainio-dev-secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_MINUTES=10080
"@ | Set-Content -Encoding UTF8 apps/api/.env
@"
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
"@ | Set-Content -Encoding UTF8 apps/web/.env.local

docker compose up -d postgres redis

cd apps/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m alembic upgrade head
python seed.py
```

Sau do mo 2 terminal:

Terminal 1 (backend):
```powershell
cd "C:\Users\ADMIN\Downloads\Team 100\apps\api"
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Terminal 2 (frontend):
```powershell
cd "C:\Users\ADMIN\Downloads\Team 100\apps\web"
npm install
npm run dev
```

## 14) Troubleshooting

### 14.1 Port 3000 bi chiem

Kiem tra process:

```powershell
netstat -ano | findstr :3000
```

Chay web o port khac:

```powershell
cd apps/web
npm run dev -- -p 3001
```

Cap nhat CORS/API URL neu can.

### 14.2 Port 8000 bi chiem

Kiem tra:

```powershell
netstat -ano | findstr :8000
```

Chay API o port khac:

```powershell
cd apps/api
uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

Va doi `NEXT_PUBLIC_API_URL=http://127.0.0.1:8001` trong `apps/web/.env.local`.

### 14.3 Port 5432 bi chiem

Repo mac dinh map Postgres ra `55432`, nen thuong khong va cham `5432`.
Neu ban doi `POSTGRES_PORT=5432` va bi trung, doi sang cong khac trong `/.env`:

```env
POSTGRES_PORT=55433
DATABASE_URL=postgresql+asyncpg://postgres:postgres@127.0.0.1:55433/brainio
```

Sau do restart postgres:

```powershell
docker compose up -d postgres
```

### 14.4 Loi Docker chua chay

Dau hieu: loi ket noi Docker daemon.
Cach xu ly:
- Mo Docker Desktop
- Cho den khi Docker hien `Engine running`
- Chay lai `docker compose up -d postgres redis`

### 14.5 Loi database connection

Kiem tra:
- Container postgres da `healthy` chua: `docker compose ps`
- `DATABASE_URL` trong `apps/api/.env` dung host port chua (`55432` mac dinh)
- User/password/db co khop `POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB` trong `/.env` khong

Reset nhanh ha tang DB:

```powershell
docker compose down
docker compose up -d postgres redis
```

Reset ca du lieu DB (can nhac vi mat du lieu local):

```powershell
docker compose down -v
docker compose up -d postgres redis
```

### 14.6 Loi alembic migration

Thu tu dung:
1. Postgres phai dang chay
2. Dang o `apps/api`
3. Venv da active
4. `DATABASE_URL` hop le

Lenh debug:

```powershell
cd apps/api
python -m alembic current
python -m alembic history --verbose
```

Neu can reset local DB de chay lai sach:

```powershell
docker compose down -v
docker compose up -d postgres redis
cd apps/api
python -m alembic upgrade head
python seed.py
```

### 14.7 Loi npm install

Thu cach sau trong `apps/web`:

```powershell
npm cache verify
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
npm install
```

Neu van loi, kiem tra Node version phai tu 20 tro len.

### 14.8 Loi npm run build

Thu:

```powershell
cd apps/web
npx tsc --noEmit
npm run build
```

Neu fail do env, dam bao `apps/web/.env.local` co `NEXT_PUBLIC_API_URL` hop le.

### 14.9 Loi CORS

Symptom: frontend goi API bi chan tren browser console.

Kiem tra `CORS_ORIGINS` trong `apps/api/.env`, nen de:

```env
CORS_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
```

Sau do restart backend.

### 14.10 Loi login khong duoc

Checklist:
- Da chay `python seed.py` chua
- Dang login dung password `Brainio@123` chua
- API dang chay o dung port trong `NEXT_PUBLIC_API_URL` chua
- Thu login truc tiep qua Swagger hoac `Invoke-RestMethod` de tach loi frontend/backend

### 14.11 Loi seed data trung du lieu

Seed hien tai da duoc viet theo huong idempotent cho baseline demo.
Neu ban gap trung du lieu do da thay doi schema/constraint:
- Kiem tra migration moi nhat
- Reset DB local roi migrate + seed lai:

```powershell
docker compose down -v
docker compose up -d postgres redis
cd apps/api
python -m alembic upgrade head
python seed.py
```
