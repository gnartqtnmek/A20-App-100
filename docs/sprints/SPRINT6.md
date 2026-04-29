# Sprint 6 - Admin + Academic Staff + Advisor Modules

Date: 2026-04-29

## Delivered Scope

- Admin backend + frontend modules:
  - User management full CRUD (existing `/api/v1/users` admin role)
  - Role/permission management endpoints
  - Department/program/course management
  - Semester and course section management
  - System report summary
- Academic staff backend + frontend modules:
  - Curriculum entry management
  - Course section management and lecturer assignment
  - Student tracking
  - Grade approval workflow
  - Exam approval foundation
  - Academic report summary
- Advisor backend + frontend modules:
  - Assigned students
  - Student progress tracking
  - Risk alerts
  - Consultation records
  - Study plans
  - Support requests and escalation

## Key API Groups Added

- `GET/PUT /api/v1/admin/roles/*`
- `GET/POST/PUT/DELETE /api/v1/admin/departments`
- `GET/POST/PUT/DELETE /api/v1/admin/programs`
- `GET/POST/PUT/DELETE /api/v1/admin/courses`
- `GET/POST/PUT /api/v1/admin/semesters`
- `GET/POST/PUT /api/v1/admin/sections`
- `GET /api/v1/admin/reports/system`
- `GET/POST /api/v1/academic/curriculum`
- `GET /api/v1/academic/sections`
- `POST /api/v1/academic/lecturer-assignments`
- `GET /api/v1/academic/student-tracking`
- `GET/POST/PATCH /api/v1/academic/grade-approvals`
- `GET/POST/PATCH /api/v1/academic/exam-approvals`
- `GET /api/v1/academic/reports/training`
- `GET/POST /api/v1/advisor/students`
- `GET /api/v1/advisor/students/{student_id}/progress`
- `GET/POST/PATCH /api/v1/advisor/risk-alerts`
- `GET/POST /api/v1/advisor/consultations`
- `GET/POST /api/v1/advisor/study-plans`
- `GET/POST/PATCH /api/v1/advisor/support-requests*`
- `GET /api/v1/advisor/reports/summary`

## DB Additions

Alembic revision: `20260429_0004`

Tables:
- `semesters`
- `curriculum_entries`
- `lecturer_assignments`
- `grade_approvals`
- `exam_approvals`
- `advisor_students`
- `risk_alerts`
- `consultation_records`
- `study_plans`
- `support_requests`

## Validation Executed

- Admin create course + section: passed
- Academic staff assign lecturer + approve grade: passed
- Advisor view risk alert + create consultation: passed
