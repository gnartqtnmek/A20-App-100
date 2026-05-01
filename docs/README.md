# Tai lieu Du an - Brainio LMS

**Nhom:** Team 100  
**Ngay cap nhat:** 01/05/2026  
**Phien ban:** 3.0

## 1. Tong quan

Brainio LMS la he thong quan ly hoc tap da vai tro, hien tap trung vao LMS core (khong tach rieng service AI agent nhu ban tai lieu cu).

**5 vai tro dang hoat dong:**
- `student`
- `lecturer`
- `admin`
- `academic_staff`
- `advisor`

## 2. Pham vi chuc nang hien co (thuc te codebase)

- Xac thuc va phan quyen: login, refresh, logout, me, RBAC theo 5 vai tro
- Student modules: khoa hoc, bai giang, bai tap nop bai, quiz, diem, diem danh, community topics
- Lecturer modules: quan ly section, lessons, assignments, submissions, grading, quizzes, attendance, live sessions, forum topics
- Admin modules: users CRUD, roles/permissions, departments, programs, courses, semesters, sections, system reports
- Academic staff modules: curriculum, lecturer assignments, student tracking, grade approvals, exam approvals, quality/training reports
- Advisor modules: assigned students, progress tracking, risk alerts, consultations, study plans, support requests
- Platform modules: notifications, announcements, reports theo role, audit logs, file upload/list

## 3. Kien truc va Tech Stack

- Frontend: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- Backend: FastAPI, Pydantic v2, SQLAlchemy 2 async, Alembic
- Database: PostgreSQL 15
- Cache: Redis 7
- Local deployment: Docker Compose (`api`, `web`, `postgres`, `redis`)

## 4. Cau truc Monorepo

```text
apps/
  api/   FastAPI + Alembic + seed data
  web/   Next.js app

docs/    Tai lieu yeu cau, kien truc, API, QA, sprint
infra/   Ghi chu ha tang
scripts/ Script setup/smoke test
```

## 5. Chay local nhanh

```bash
# 1) Khoi dong ha tang
docker compose up -d postgres redis

# 2) Migrate DB
cd apps/api
python -m alembic upgrade head

# 3) Seed du lieu demo
python seed.py

# 4) Chay API
uvicorn main:app --reload --port 8000

# 5) Chay Web (terminal khac)
cd apps/web
npm install
npm run dev
```

## 6. Ports mac dinh (docker-compose)

- Web: `3000`
- API: `8000`
- PostgreSQL: `55432`
- Redis: `56379`

## 7. API groups chinh (base `/api/v1`)

- `/auth`
- `/modules`
- `/dashboards`
- `/profile`
- `/users` (admin)
- `/student`
- `/lecturer`
- `/admin`
- `/academic`
- `/advisor`
- Platform routes: `/notifications`, `/announcements`, `/files`, `/admin/audit-logs`
- `/reports/{role}`

## 8. Muc tai lieu quan trong

- [BRD.md](BRD.md)
- [PRD.md](PRD.md)
- [SAD.md](SAD.md)
- [ERD.md](ERD.md)
- [API_SPEC.md](API_SPEC.md)
- [API_USAGE.md](API_USAGE.md)
- [SETUP.md](SETUP.md)
- [LOCAL_RUN_GUIDE.md](LOCAL_RUN_GUIDE.md)
- [DEPLOYMENT.md](DEPLOYMENT.md)
- [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md)
- [UAT_SUMMARY.md](UAT_SUMMARY.md)
- [E2E_QA_REPORT.md](E2E_QA_REPORT.md)
- [SEQUENCE_DIAGRAMS/00_README.md](SEQUENCE_DIAGRAMS/00_README.md)

## 9. Tinh trang sprint va migration

- Da co tai lieu sprint: `SPRINT4.md`, `SPRINT5.md`, `SPRINT6.md`, `SPRINT7.md`
- Alembic moi nhat: `20260430_0005_missing_integration_tables.py`
  - Bo sung: `forum_topics`, `live_class_sessions`, `quality_surveys`

## 10. Tai khoan demo

Xem chi tiet tai [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md).

Thong tin mac dinh:
- `student@brainio.edu`
- `lecturer@brainio.edu`
- `admin@brainio.edu`
- `staff@brainio.edu`
- `advisor@brainio.edu`

Mat khau demo chung: `Brainio@123`

---

Capstone LMS - Team 100  
Tai lieu nay da duoc cap nhat theo hien trang repo vao ngay **01/05/2026**.
