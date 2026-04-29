# Brainio LMS

**Brainio** — *Learn Smarter. Grow Faster.*

Brainio is a modern university Learning Management System designed for 5 core user groups:

- Student
- Lecturer
- Admin
- Academic Staff / Faculty / Training Office
- Advisor

## Tech Stack

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- App Router

### Backend
- FastAPI
- SQLAlchemy 2.x async
- Alembic
- PostgreSQL
- Redis

### Local Development
- Docker Compose
- PostgreSQL 15
- Redis 7

## Repository Structure

```txt
Brainio/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # FastAPI backend
├── packages/
│   └── shared/              # Shared types/constants later
├── docs/                    # Project documents
├── docker-compose.yml
├── .env.example
└── README.md
```

## Quick Start

```bash
cp .env.example .env
docker compose up -d
```

Frontend and backend setup instructions are inside each app folder.

## Development Roadmap

See GitHub Issue #1: **Brainio LMS - Implementation roadmap**.
