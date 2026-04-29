# Sprint 7 - Notifications, Reports, Polish, QA, Deployment

Date: 2026-04-29

## Delivered Scope

- Backend:
  - Notifications: create/list/mark-read
  - Announcements: create/list by role
  - Reports endpoint by role (`student`, `lecturer`, `admin`, `academic_staff`, `advisor`)
  - Audit logs for major actions (admin list API)
  - File upload foundation and file listing
  - Standardized validation/internal error response handlers
  - Pagination/filter/search pattern for list APIs in new modules
- Frontend:
  - Notification center
  - Role report panel
  - Admin/Academic Staff/Advisor portals wired to real APIs
  - Empty/loading/error handling in module components
  - Dark mode toggle
  - Responsive grid polish for dashboards
  - Form validation for critical create actions
- Deployment/Local:
  - API Dockerfile
  - Web Dockerfile
  - Docker Compose updated with `api`, `web`, `postgres`, `redis`
  - Deployment and API usage docs added

## Key API Added

- `POST /api/v1/notifications`
- `GET /api/v1/notifications`
- `PATCH /api/v1/notifications/{id}/read`
- `POST /api/v1/announcements`
- `GET /api/v1/announcements`
- `GET /api/v1/reports/{role}`
- `GET /api/v1/admin/audit-logs`
- `POST /api/v1/files/upload`
- `GET /api/v1/files`

## DB Additions

Also in revision `20260429_0004`:
- `announcements`
- `audit_logs`
- `uploaded_files`

## QA Results

- Backend import/compile: passed
- Alembic upgrade to head: passed
- Seed data: passed
- Notifications flow (create/list/read): passed
- Announcement flow (create/list): passed
- Reports for all 5 roles: passed
- File upload + list: passed
- Frontend lint: passed
- Frontend build: passed
