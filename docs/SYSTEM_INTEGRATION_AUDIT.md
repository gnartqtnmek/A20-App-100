# SYSTEM INTEGRATION AUDIT - Brainio LMS

Date: 2026-04-30  
Scope: `apps/api`, `apps/web`, `apps/api/alembic`, `apps/api/app/db/seed.py`, `docs/*`, `docker-compose.yml`, `.env.example`

## 1. Executive Summary

- Architecture is coherent for the 5 required roles: `student`, `lecturer`, `admin`, `academic_staff`, `advisor`.
- Core auth, role dashboards, learning workflows, and most RBAC checks are implemented.
- Core previously-missing modules (forum/live-class/surveys/enrollment actions) are now backed by real API + DB.
- Key RBAC gaps in academic approvals were fixed in this audit.
- Deep-link route query handoff (`sectionId`, `assignmentId`, `quizId`, `studentId`) was partially broken and is fixed in this audit.

## 2. Integration Matrix

Status legend: `OK`, `Broken`, `Missing`, `Mock only`, `Needs fix`

| Feature | Role | Frontend route/page | Frontend component | API endpoint | Backend service/function | DB table/entity | Permission/RBAC rule | Seed data available? | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| login/logout/me | student | `/login`, `/dashboard/student` | `login-form`, `role-guard` | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` | `auth_service.login_user`, `deps.require_current_user` | `users` | token required, role checked in guard | Yes | OK | Shared for all roles |
| dashboard | student | `/dashboard/student?module=home` | `student-workspace` | `GET /dashboards/student` | `dashboard_service.get_dashboard_summary` | derived | only self/admin dashboard | Yes | OK | |
| my courses | student | `/dashboard/student?module=my_courses` | `student-workspace` | `GET /student/courses`, `GET /student/courses/{id}` | `lms_service.list_courses_for_student`, `get_course_detail_for_user` | `courses`, `course_sections`, `enrollments` | student must be enrolled | Yes | OK | |
| course detail | student | `/student/courses/[id]` redirect | `student-workspace` | `GET /student/courses/{id}` | `get_course_detail_for_user` | `course_sections`, `courses` | enrolled-only | Yes | OK | query deep-link fixed |
| lessons/materials | student | `/dashboard/student?module=lessons` | `student-workspace` | `GET /student/courses/{id}/lessons` | `list_lessons` | `lessons` | only published + enrolled | Yes | OK | |
| assignment list | student | `/dashboard/student?module=assignments` | `student-workspace` | `GET /student/courses/{id}/assignments` | `list_assignments` | `assignments` | enrolled-only | Yes | OK | |
| assignment submission | student | `/student/assignments/[id]` redirect | `student-workspace` | `POST /student/assignments/{id}/submit` | `submit_assignment` | `submissions` | own enrollment only | Yes | OK | query deep-link fixed |
| quiz list | student | `/dashboard/student?module=quiz_exams` | `student-workspace` | `GET /student/courses/{id}/quizzes` | `list_quizzes` | `quizzes` | published + enrolled | Yes | OK | |
| quiz taking | student | `/student/quizzes/[id]` redirect | `student-workspace` | `GET /student/quizzes/{id}/questions`, `POST /student/quizzes/{id}/submit` | `list_quiz_questions`, `submit_quiz_attempt` | `quiz_questions`, `quiz_attempts` | enrolled-only | Yes | OK | query deep-link fixed |
| quiz result | student | `/dashboard/student?module=quiz_exams` | `student-workspace` | `POST /student/quizzes/{id}/submit` | `submit_quiz_attempt` | `quiz_attempts`, `grades` | enrolled-only | Yes | OK | |
| grades | student | `/dashboard/student?module=grades` | `student-workspace` | `GET /student/grades` | `list_grades_for_student` | `grades` | own-only | Yes | OK | |
| attendance | student | `/dashboard/student?module=attendance` | `student-workspace` | `GET /student/attendance` | `list_attendance_for_student` | `attendance_records` | own-only | Yes | OK | |
| calendar/deadlines | student | `/dashboard/student?module=calendar` | `student-workspace` | derived from lessons/quizzes/assignments/notifications | derived | multiple | n/a | Partial | Mock only | no dedicated calendar API |
| notifications | student | `/dashboard/student?module=messages` | `student-workspace`, `notifications-center` | `GET /notifications`, `PATCH /notifications/{id}/read` | `list_notifications`, `mark_notification_read` | `notifications` | user-scoped by user_id | Yes | OK | |
| support/forum | student | `/dashboard/student?module=community` | `student-workspace` | `GET/POST /student/community/topics` | `list_student_forum_topics`, `create_forum_topic` | `forum_topics` | student must be enrolled in section | Yes | OK | Connected to real API |
| dashboard | lecturer | `/dashboard/lecturer?module=dashboard` | `lecturer-workspace` | `GET /dashboards/lecturer` | `get_dashboard_summary` | derived | self/admin only | Yes | OK | |
| course sections | lecturer | `/dashboard/lecturer?module=course_studio` | `lecturer-workspace` | `GET /lecturer/sections`, `GET /lecturer/sections/{id}` | `list_sections_for_lecturer`, `get_course_detail_for_user` | `course_sections` | lecturer owns section | Yes | OK | |
| lesson manager | lecturer | `/dashboard/lecturer?module=materials` | `lecturer-workspace` | `GET/POST/PUT/DELETE /lecturer/.../lessons` | `list_lessons`, `create_lesson`, `update_lesson`, `delete_lesson` | `lessons` | lecturer owns section | Yes | OK | |
| assignment manager | lecturer | `/dashboard/lecturer?module=assignments` | `lecturer-workspace` | `GET/POST/PUT/DELETE /lecturer/.../assignments` | `list_assignments`, `create_assignment`, `update_assignment`, `delete_assignment` | `assignments` | lecturer owns section | Yes | OK | |
| submissions | lecturer | `/dashboard/lecturer?module=assignments` | `lecturer-workspace` | `GET /lecturer/assignments/{id}/submissions` | `list_submissions_for_assignment` | `submissions`, `grades` | lecturer owns section | Yes | OK | |
| grading/feedback | lecturer | `/dashboard/lecturer?module=assignments` | `lecturer-workspace` | `POST /lecturer/submissions/{id}/grade` | `grade_submission` | `grades` | lecturer owns section | Yes | OK | |
| quiz builder | lecturer | `/dashboard/lecturer?module=quiz_bank` | `lecturer-workspace` | `GET/POST /lecturer/sections/{id}/quizzes` | `list_quizzes`, `create_quiz` | `quizzes` | lecturer owns section | Yes | OK | |
| question bank | lecturer | `/dashboard/lecturer?module=quiz_bank` | `lecturer-workspace` | `GET/POST /lecturer/quizzes/{id}/questions` | `list_quiz_questions`, `add_quiz_question` | `quiz_questions` | lecturer owns section | Yes | OK | |
| gradebook | lecturer | `/dashboard/lecturer?module=gradebook` | `lecturer-workspace` | `GET /lecturer/sections/{id}/gradebook` | `list_gradebook_for_section` | `grades` | lecturer owns section | Yes | OK | |
| attendance manager | lecturer | `/dashboard/lecturer?module=attendance` | `lecturer-workspace` | `GET/POST /lecturer/sections/{id}/attendance-sessions`, `POST /lecturer/attendance-sessions/{id}/mark` | `create_attendance_session`, `mark_attendance` | `attendance_sessions`, `attendance_records` | lecturer owns section | Yes | OK | |
| analytics | lecturer | `/dashboard/lecturer?module=analytics` | `lecturer-workspace` | `GET /reports/lecturer` | `build_role_report` | aggregated | self/admin report access | Yes | OK | |
| announcements/messages | lecturer | `/dashboard/lecturer?module=messages` | `lecturer-workspace` | `GET/POST /announcements`, `GET /notifications` | `create_announcement`, `list_announcements`, `list_notifications` | `announcements`, `notifications` | lecturer allowed to create announcements | Yes | OK | |
| live class scheduler | lecturer | `/dashboard/lecturer?module=live_class` | `lecturer-workspace` | `GET /lecturer/sections/{id}/live-sessions`, `POST /lecturer/live-sessions` | `list_live_class_sessions`, `create_live_class_session` | `live_class_sessions` | lecturer owns section | Yes | OK | Connected to real API |
| forum moderation | lecturer | `/dashboard/lecturer?module=forum` | `lecturer-workspace` | `GET /lecturer/sections/{id}/forum-topics`, `POST /lecturer/forum-topics`, `PATCH /lecturer/forum-topics/{id}` | `list_lecturer_forum_topics`, `create_forum_topic`, `moderate_forum_topic` | `forum_topics` | lecturer owns section | Yes | OK | Connected to real API |
| dashboard | admin | `/dashboard/admin?module=overview` | `admin-workspace` | `GET /dashboards/admin`, `GET /admin/reports/system` | `get_dashboard_summary`, `get_system_report` | aggregated | admin-only | Yes | OK | |
| user management | admin | `/dashboard/admin?module=users` | `admin-workspace` | `GET/POST/PUT/DELETE /users` | `list_users`, `create_user`, `update_user`, `delete_user` | `users` | admin-only | Yes | OK | |
| role/permission management | admin | `/dashboard/admin?module=roles_rbac` | `admin-workspace` | `GET /admin/roles`, `GET /admin/permissions`, `PUT /admin/roles/{role}/permissions` | `get_roles_and_permissions`, `update_role_permissions` | `roles`, `permissions`, `role_permissions` | admin-only | Yes | OK | |
| department/program management | admin | `/dashboard/admin?module=departments` | `admin-workspace` | `GET/POST/PUT/DELETE /admin/departments`, `/admin/programs` | sprint67 CRUD services | `departments`, `programs` | admin-only | Yes | OK | |
| course management | admin | `/dashboard/admin?module=courses` | `admin-workspace` | `GET/POST/PUT/DELETE /admin/courses` | sprint67 course services | `courses` | admin-only | Yes | OK | |
| course section management | admin | `/dashboard/admin?module=courses` | `admin-workspace` | `GET/POST/PUT /admin/sections` | `list_sections`, `create_section`, `update_section` | `course_sections`, `lecturer_assignments` | admin-only | Yes | OK | |
| security logs/audit logs | admin | `/dashboard/admin?module=security` | `admin-workspace` | `GET /admin/audit-logs` | `list_audit_logs` | `audit_logs` | admin-only | Yes | OK | |
| system reports | admin | `/dashboard/admin?module=security` | `admin-workspace` | `GET /admin/reports/system`, `GET /reports/admin` | `get_system_report`, `build_role_report` | aggregated | admin-only | Yes | OK | |
| announcements/settings | admin | `/dashboard/admin?module=security` | `admin-workspace` | `GET/POST /announcements` | `create_announcement`, `list_announcements` | `announcements` | admin/academic/lecturer create | Yes | OK | |
| enrollment admin actions | admin | `/dashboard/admin?module=enrollments` | `admin-workspace` | `POST /admin/enrollments/actions` | `execute_enrollment_action` | `enrollments` | admin-only | Yes | OK | Supports `enroll/drop/move` |
| dashboard | academic_staff | `/dashboard/academic-staff?module=training_dashboard` | `academic-workspace` | `GET /dashboards/academic_staff` | `get_dashboard_summary` | aggregated | self/admin only | Yes | OK | |
| curriculum | academic_staff | `/dashboard/academic-staff?module=curriculum` | `academic-workspace` | `GET/POST /academic/curriculum` | `list_curriculum_entries`, `create_curriculum_entry` | `curriculum_entries` | scoped by department | Yes | OK | |
| course catalog | academic_staff | `/dashboard/academic-staff?module=course_catalog` | `academic-workspace` | derived from `/academic/curriculum` | derived | `curriculum_entries`, `courses` | scoped indirectly | Partial | Mock only | no dedicated catalog endpoint |
| section management | academic_staff | `/dashboard/academic-staff?module=class_sections` | `academic-workspace` | `GET/PUT /academic/sections` | `list_sections`, `update_section` | `course_sections` | scoped by department | Yes | OK | |
| lecturer assignment | academic_staff | `/dashboard/academic-staff?module=lecturers` | `academic-workspace` | `POST /academic/lecturer-assignments` | `assign_lecturer` | `lecturer_assignments` | scoped by department | Yes | OK | |
| student tracking | academic_staff | `/dashboard/academic-staff?module=students` | `academic-workspace` | `GET /academic/student-tracking` | `get_student_tracking` | enroll/grade/attendance | scoped by department | Yes | OK | |
| exam approval | academic_staff | `/dashboard/academic-staff?module=exams` | `academic-workspace` | `GET/POST/PATCH /academic/exam-approvals` | `create_exam_approval`, `list_exam_approvals`, `action_exam_approval` | `exam_approvals` | scoped by department | Yes | OK | RBAC scope fixed |
| grade approval | academic_staff | `/dashboard/academic-staff?module=grade_approval` | `academic-workspace` | `GET/POST/PATCH /academic/grade-approvals` | `create_grade_approval`, `list_grade_approvals`, `action_grade_approval` | `grade_approvals` | scoped by department | Yes | OK | RBAC scope fixed |
| quality surveys | academic_staff | `/dashboard/academic-staff?module=surveys` | `academic-workspace` | `GET/POST /academic/surveys` | `list_quality_surveys`, `create_quality_survey` | `quality_surveys` | scoped by department | Yes | OK | Connected to real API |
| reports | academic_staff | `/dashboard/academic-staff?module=reports` | `academic-workspace` | `GET /academic/reports/training` | `get_academic_report` | aggregated | scoped by department | Yes | OK | scope filter fixed |
| dashboard | advisor | `/dashboard/advisor?module=success_dashboard` | `advisor-workspace` | `GET /dashboards/advisor`, `GET /advisor/reports/summary` | `get_dashboard_summary`, `get_advisor_report` | aggregated | self/admin only | Yes | OK | |
| assigned students | advisor | `/dashboard/advisor?module=my_students` | `advisor-workspace` | `GET/POST /advisor/students` | `list_advisor_students`, `assign_student_to_advisor` | `advisor_students` | advisor sees own assignments | Yes | OK | |
| student profile | advisor | `/advisor/students/[id]` redirect | `advisor-workspace` | `GET /advisor/students/{id}/progress` | `get_student_progress` | grade/attendance/risk aggregates | assigned-student only | Yes | OK | query deep-link fixed |
| progress tracking | advisor | `/dashboard/advisor?module=progress_tracking` | `advisor-workspace` | `GET /advisor/students/{id}/progress`, `GET /advisor/risk-alerts` | `get_student_progress`, `list_risk_alerts` | `risk_alerts` etc. | assigned-student only | Yes | OK | |
| risk alerts | advisor | `/dashboard/advisor?module=risk_alerts` | `advisor-workspace` | `GET/POST/PATCH /advisor/risk-alerts` | `create_risk_alert`, `list_risk_alerts`, `update_risk_alert` | `risk_alerts` | assigned-student only | Yes | OK | |
| consultations | advisor | `/dashboard/advisor?module=consultations` | `advisor-workspace` | `GET/POST /advisor/consultations` | `create_consultation`, `list_consultations` | `consultation_records` | assigned-student only | Yes | OK | |
| study plans | advisor | `/dashboard/advisor?module=study_plans` | `advisor-workspace` | `GET/POST /advisor/study-plans` | `create_study_plan`, `list_study_plans` | `study_plans` | assigned-student only | Yes | OK | |
| attendance issues | advisor | `/dashboard/advisor?module=attendance` | `advisor-workspace` | derived from `student progress` | `get_student_progress` | aggregated | assigned-student only | Yes | Mock only | no dedicated attendance-issues API |
| support requests | advisor | `/dashboard/advisor?module=support_requests` | `advisor-workspace` | `GET/POST/PATCH /advisor/support-requests` | `create_support_request`, `escalate_support_request` | `support_requests` | assigned-student only | Yes | OK | |
| advisor reports | advisor | `/dashboard/advisor?module=reports` | `advisor-workspace` | `GET /advisor/reports/summary` | `get_advisor_report` | aggregated | advisor own scope, admin global | Yes | OK | |
| advisor messaging | advisor | `/dashboard/advisor?module=messages` | `advisor-workspace` | `GET /notifications` | `list_notifications` | `notifications` | user-scoped | Yes | Mock only | no dedicated advisor messaging send API |

## 3. Key Mismatches Found

1. `academic_staff` approval/report scope leak:
   - Academic staff list/action endpoints for grade/exam approvals were not department-scoped.
   - Lecturer could create academic approvals for sections/quizzes not assigned to themselves.
2. Deep-link route query mismatch:
   - Redirect routes passed `sectionId`, `assignmentId`, `quizId`, `studentId` but workspace components ignored these parameters.
3. Backend route shape mismatch:
   - API module routes and dashboard CTA used `/dashboard/academic_staff` while frontend canonical route is `/dashboard/academic-staff`.
4. Remaining gaps:
   - Calendar and some settings/integration flows still use derived/mock UX paths.

## 4. Fixes Applied In This Audit

- RBAC hardening (backend):
  - `apps/api/app/services/sprint67_service.py`
    - Added lecturer ownership checks for `create_grade_approval` and `create_exam_approval`.
    - Added department-scope filtering for `list_grade_approvals`, `list_exam_approvals`.
    - Added department-scope enforcement for `action_grade_approval`, `action_exam_approval`.
    - Added scoped mode for `get_academic_report`.
    - Scoped `build_role_report` for `academic_staff`.
  - `apps/api/app/api/v1/endpoints/academic.py`
    - Passes role/scope context into grade/exam/report service calls.
- Frontend route/query sync:
  - `apps/web/components/portal/student-workspace.tsx`
    - Honors `sectionId`, `assignmentId`, `quizId` query params from compatibility redirects.
  - `apps/web/components/portal/advisor-workspace.tsx`
    - Honors `studentId` query param for student-profile deep links.
- Frontend/backend route consistency:
  - `apps/api/app/services/role_catalog.py`
    - Academic staff module routes switched to `/dashboard/academic-staff`.
  - `apps/api/app/services/dashboard_service.py`
    - Hero CTA route normalized to `/dashboard/academic-staff`.

## 5. Smoke/Test Scripts Added

- `scripts/smoke_backend.py`
  - Health + login + `/auth/me` + per-role probe endpoint for all 5 roles.
- `scripts/smoke_rbac.py`
  - Cross-role negative checks (403/401) and admin positive check.
- `scripts/check_ui_api_mapping.py`
  - Static mapping of `apps/web/lib/api.ts` exports to UI usage.

## 6. Remaining TODO / Mock

- Calendar API is still derived from lessons/quizzes/assignments/notifications (`Mock only` by design).
- Advisor/messages module is read feed only (no dedicated send endpoint for advisor flow).
- Some settings/integrations screens remain UI-only and are out of current blocking scope.
