# Brainio API (FastAPI)

## Run locally

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m alembic upgrade head
python seed.py
uvicorn main:app --reload --port 8000
```

## Key demo endpoints

- `GET /health`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/modules/{role}`
- `GET /api/v1/dashboards/{role}`
- `GET /api/v1/users` (admin)
- `GET /api/v1/profile`
- `GET /api/v1/student/courses`
- `POST /api/v1/student/assignments/{assignment_id}/submit`
- `POST /api/v1/student/quizzes/{quiz_id}/submit`
- `GET /api/v1/lecturer/sections`
- `POST /api/v1/lecturer/sections/{section_id}/assignments`
- `POST /api/v1/lecturer/submissions/{submission_id}/grade`

Supported role values:

- `student`
- `lecturer`
- `admin`
- `academic_staff`
- `advisor`

## Alembic

```bash
cd apps/api
alembic upgrade head
```
