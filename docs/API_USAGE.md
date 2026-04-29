# Brainio LMS API Usage

Base URL local:

```text
http://127.0.0.1:8000/api/v1
```

## 1. Auth

### Login

`POST /auth/login`

```json
{
  "email": "student@brainio.edu",
  "password": "Brainio@123"
}
```

Use returned `access_token`:

```http
Authorization: Bearer <access_token>
```

## 2. Demo Users

- `student@brainio.edu`
- `lecturer@brainio.edu`
- `admin@brainio.edu`
- `staff@brainio.edu`
- `advisor@brainio.edu`

Password for all demo users:

`Brainio@123`

## 3. Sprint 6 APIs

- Admin:
  - `/admin/departments`
  - `/admin/programs`
  - `/admin/courses`
  - `/admin/semesters`
  - `/admin/sections`
  - `/admin/reports/system`
- Academic Staff:
  - `/academic/curriculum`
  - `/academic/lecturer-assignments`
  - `/academic/student-tracking`
  - `/academic/grade-approvals`
  - `/academic/exam-approvals`
  - `/academic/reports/training`
- Advisor:
  - `/advisor/students`
  - `/advisor/risk-alerts`
  - `/advisor/consultations`
  - `/advisor/study-plans`
  - `/advisor/support-requests`
  - `/advisor/reports/summary`

## 4. Sprint 7 APIs

- Notifications:
  - `POST /notifications`
  - `GET /notifications`
  - `PATCH /notifications/{id}/read`
- Announcements:
  - `POST /announcements`
  - `GET /announcements`
- Reports:
  - `GET /reports/{role}`
- Audit logs:
  - `GET /admin/audit-logs`
- Files:
  - `POST /files/upload` (`multipart/form-data`)
  - `GET /files`

## 5. Pagination Convention

List APIs support:
- `page` (default 1)
- `limit` (default 20, max 100)
- `search` (when supported)

Response pattern:

```json
{
  "items": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```
