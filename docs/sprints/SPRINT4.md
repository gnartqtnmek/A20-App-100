# Sprint 4 - Production Auth + Database + RBAC

## Scope delivered

- PostgreSQL async integration with SQLAlchemy 2.
- Alembic migrations for Sprint 4 auth/rbac hardening.
- Seed script with:
  - 5 roles
  - base permission matrix
  - 5 demo users
  - demo department/program/course/section/enrollment
- Real auth:
  - password hashing (`passlib` + `bcrypt`)
  - JWT access + refresh tokens
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
- RBAC dependencies:
  - `require_current_user`
  - `require_roles`
- Admin user APIs:
  - `GET /api/v1/users`
  - `POST /api/v1/users`
  - `GET /api/v1/users/{user_id}`
  - `PUT /api/v1/users/{user_id}`
  - `DELETE /api/v1/users/{user_id}`
- Profile APIs:
  - `GET /api/v1/profile`
  - `PUT /api/v1/profile`
- Frontend auth integration:
  - real login page
  - token storage
  - protected dashboard route
  - role redirect
  - logout and current user menu

## Commands

```bash
docker compose up -d
cd apps/api
pip install -r requirements.txt
python -m alembic upgrade head
python seed.py
uvicorn main:app --reload --port 8000

cd ../web
npm install
npm run dev
```

## Demo credentials

- `student@brainio.edu / Brainio@123`
- `lecturer@brainio.edu / Brainio@123`
- `admin@brainio.edu / Brainio@123`
- `staff@brainio.edu / Brainio@123`
- `advisor@brainio.edu / Brainio@123`
