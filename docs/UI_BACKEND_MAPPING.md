# UI Backend Mapping (Stitch -> Brainio LMS)

Updated: 2026-04-30

## Audit Scope Covered
- Stitch export: `apps/web/.stitch_design/stitch_duplicate_of_modern_university_lms_dashboard/**/code.html`
- Frontend: `apps/web/app`, `apps/web/components`, `apps/web/lib`
- Backend API: `apps/api/app/api/v1/endpoints`
- Schemas: `apps/api/app/schemas`
- Models/entities: `apps/api/app/models/lms.py`
- Docs: `docs/FUNCTION_COVERAGE_MATRIX.md`, `docs/API_USAGE.md`, `docs/DEMO_ACCOUNTS.md`, `docs/QA_CHECKLIST.md`

## Stitch Screen Mapping

| Stitch screen | Frontend route | Role | API backend used | DB entities | Status |
|---|---|---|---|---|---|
| academiccore_student_portal_navigation_1 | `/dashboard/student?module=home` | student | `GET /api/v1/dashboards/student`, `GET /api/v1/student/grades`, `GET /api/v1/student/attendance` | `users`, `enrollments`, `grades`, `attendance_records`, `course_sections` | implemented |
| academiccore_student_portal_navigation_2 | `/dashboard/student?module=home` | student | `GET /api/v1/dashboards/student` | `users`, `enrollments`, `course_sections` | implemented |
| student_home_dashboard | `/dashboard/student?module=home` | student | `GET /api/v1/dashboards/student`, `GET /api/v1/student/courses` | `users`, `enrollments`, `courses`, `course_sections` | implemented |
| my_courses | `/student/courses` -> `/dashboard/student?module=my_courses` | student | `GET /api/v1/student/courses`, `GET /api/v1/student/courses/{section_id}` | `courses`, `course_sections`, `enrollments`, `users` | implemented |
| course_detail | `/student/courses/[id]` -> `/dashboard/student?module=my_courses` | student | `GET /api/v1/student/courses/{section_id}`, `GET /api/v1/student/courses/{section_id}/lessons` | `course_sections`, `courses`, `lessons` | implemented |
| lesson_player | `/dashboard/student?module=lessons` | student | `GET /api/v1/student/courses/{section_id}/lessons` | `lessons`, `course_sections` | implemented |
| assignments | `/dashboard/student?module=assignments` | student | `GET /api/v1/student/courses/{section_id}/assignments` | `assignments`, `course_sections` | implemented |
| assignment_submission | `/student/assignments/[id]` -> `/dashboard/student?module=assignments` | student | `POST /api/v1/student/assignments/{assignment_id}/submit`, `POST /api/v1/files/upload` | `submissions`, `uploaded_files`, `assignments` | implemented |
| quiz_and_exams | `/dashboard/student?module=quiz_exams` | student | `GET /api/v1/student/courses/{section_id}/quizzes`, `GET /api/v1/student/quizzes/{quiz_id}/questions`, `POST /api/v1/student/quizzes/{quiz_id}/submit` | `quizzes`, `quiz_questions`, `quiz_attempts` | implemented |
| quiz_taking | `/student/quizzes/[id]` -> `/dashboard/student?module=quiz_exams` | student | `GET /api/v1/student/quizzes/{quiz_id}/questions`, `POST /api/v1/student/quizzes/{quiz_id}/submit` | `quiz_questions`, `quiz_attempts`, `grades` | implemented |
| grades_dashboard | `/dashboard/student?module=grades` | student | `GET /api/v1/student/grades` | `grades`, `assignments`, `quizzes` | implemented |
| attendance_history | `/dashboard/student?module=attendance` | student | `GET /api/v1/student/attendance` | `attendance_records`, `attendance_sessions` | implemented |
| calendar | `/dashboard/student?module=calendar` | student | derived from `GET lessons/assignments/quizzes` + `GET /api/v1/notifications` | `lessons`, `assignments`, `quizzes`, `notifications` | needs mock |
| achievements | `/dashboard/student?module=achievements` | student | derived from `GET /api/v1/student/grades`, `GET /api/v1/student/attendance` | `grades`, `attendance_records` | needs mock |
| community_forum | `/dashboard/student?module=community` | student | no forum endpoint in current backend | n/a | needs backend later |
| messages_notifications | `/dashboard/student?module=messages` | student | `GET/PATCH /api/v1/notifications`, `GET/PUT /api/v1/profile` | `notifications`, `users` | implemented |
| profile_settings | `/dashboard/student?module=messages` | student | `GET/PUT /api/v1/profile` | `users` | implemented |
| lecturer_dashboard | `/dashboard/lecturer?module=dashboard` | lecturer | `GET /api/v1/dashboards/lecturer` | `users`, `course_sections`, `enrollments` | implemented |
| course_studio | `/lecturer/courses` -> `/dashboard/lecturer?module=course_studio` | lecturer | `GET /api/v1/lecturer/sections`, `GET /api/v1/lecturer/sections/{section_id}` | `course_sections`, `courses`, `users` | implemented |
| materials_manager | `/dashboard/lecturer?module=materials` | lecturer | `GET/POST /api/v1/lecturer/sections/{section_id}/lessons`, `POST /api/v1/files/upload` | `lessons`, `uploaded_files`, `course_sections` | implemented |
| lesson_editor | `/dashboard/lecturer?module=materials` | lecturer | `POST /api/v1/lecturer/sections/{section_id}/lessons`, `PUT /api/v1/lecturer/lessons/{lesson_id}` | `lessons` | implemented |
| assignment_builder | `/lecturer/assignments` -> `/dashboard/lecturer?module=assignments` | lecturer | `GET/POST /api/v1/lecturer/sections/{section_id}/assignments` | `assignments`, `course_sections` | implemented |
| submission_review | `/lecturer/submissions` -> `/dashboard/lecturer?module=assignments` | lecturer | `GET /api/v1/lecturer/assignments/{assignment_id}/submissions`, `POST /api/v1/lecturer/submissions/{submission_id}/grade` | `submissions`, `grades` | implemented |
| rubric_grading | `/dashboard/lecturer?module=assignments` | lecturer | `POST /api/v1/lecturer/submissions/{submission_id}/grade` | `submissions`, `grades` | implemented |
| quiz_builder | `/dashboard/lecturer?module=quiz_bank` | lecturer | `GET/POST /api/v1/lecturer/sections/{section_id}/quizzes`, `GET/POST /api/v1/lecturer/quizzes/{quiz_id}/questions` | `quizzes`, `quiz_questions` | implemented |
| question_bank | `/dashboard/lecturer?module=quiz_bank` | lecturer | `GET /api/v1/lecturer/quizzes/{quiz_id}/questions` | `quiz_questions`, `quizzes` | implemented |
| gradebook | `/dashboard/lecturer?module=gradebook` | lecturer | `GET /api/v1/lecturer/sections/{section_id}/gradebook` | `grades`, `submissions`, `quiz_attempts` | implemented |
| attendance_manager | `/dashboard/lecturer?module=attendance` | lecturer | `GET/POST /api/v1/lecturer/sections/{section_id}/attendance-sessions`, `POST /api/v1/lecturer/attendance-sessions/{session_id}/mark`, `GET /api/v1/lecturer/sections/{section_id}/attendance` | `attendance_sessions`, `attendance_records` | implemented |
| lecturer_analytics | `/dashboard/lecturer?module=analytics` | lecturer | `GET /api/v1/reports/lecturer` | report aggregation on `grades`, `attendance_records`, `enrollments` | implemented |
| live_class_scheduler | `/dashboard/lecturer?module=live_class` | lecturer | no dedicated live-class endpoint | n/a | needs backend later |
| forum_moderation | `/dashboard/lecturer?module=forum` | lecturer | no forum moderation endpoint | n/a | needs backend later |
| announcements_manager | `/dashboard/lecturer?module=messages` | lecturer | `GET/POST /api/v1/announcements`, `GET /api/v1/notifications` | `announcements`, `notifications` | implemented |
| syllabus_builder | `/dashboard/lecturer?module=materials` | lecturer | `GET/POST /api/v1/lecturer/sections/{section_id}/lessons` (mapped as structured content workflow) | `lessons`, `course_sections` | needs mock |
| admin_overview | `/dashboard/admin?module=overview` | admin | `GET /api/v1/dashboards/admin`, `GET /api/v1/admin/reports/system` | `users`, `courses`, `course_sections`, `audit_logs` | implemented |
| user_management | `/admin/users` -> `/dashboard/admin?module=users` | admin | `GET/POST/PUT/DELETE /api/v1/users` | `users`, `user_role_links`, `roles` | implemented |
| user_profile_admin | `/dashboard/admin?module=users` | admin | `GET/PUT /api/v1/users/{user_id}` | `users` | implemented |
| roles_and_rbac | `/admin/roles` -> `/dashboard/admin?module=roles_rbac` | admin | `GET /api/v1/admin/roles`, `GET /api/v1/admin/permissions`, `PUT /api/v1/admin/roles/{role_code}/permissions` | `roles`, `permissions`, `role_permissions` | implemented |
| permission_matrix | `/dashboard/admin?module=roles_rbac` | admin | `GET /api/v1/admin/permissions`, `PUT /api/v1/admin/roles/{role_code}/permissions` | `permissions`, `role_permissions` | implemented |
| organization_structure | `/dashboard/admin?module=departments` | admin | `GET/POST /api/v1/admin/departments`, `GET/POST /api/v1/admin/programs` | `departments`, `programs` | implemented |
| department_faculty_management | `/dashboard/admin?module=departments` | admin | `GET/POST/PUT/DELETE /api/v1/admin/departments` | `departments` | implemented |
| academic_calendar_admin | `/dashboard/admin?module=semesters` | admin | `GET/POST/PUT /api/v1/admin/semesters` | `semesters` | implemented |
| academic_term_lifecycle_1 | `/dashboard/admin?module=semesters` | admin | `GET/POST/PUT /api/v1/admin/semesters` | `semesters` | implemented |
| academic_term_lifecycle_2 | `/dashboard/admin?module=semesters` | admin | `GET/POST/PUT /api/v1/admin/semesters` | `semesters` | implemented |
| course_catalog_admin | `/dashboard/admin?module=courses` | admin | `GET/POST/PUT /api/v1/admin/courses` | `courses`, `departments` | implemented |
| class_sections_admin | `/dashboard/admin?module=courses` | admin | `GET/POST/PUT /api/v1/admin/sections` | `course_sections`, `courses`, `users` | implemented |
| enrollment_admin | `/dashboard/admin?module=enrollments` | admin | no dedicated enrollment admin endpoint | `enrollments` | needs backend later |
| enrollment_management | `/dashboard/admin?module=enrollments` | admin | no dedicated enrollment admin endpoint | `enrollments` | needs backend later |
| course_scheduling | `/dashboard/admin?module=courses` | admin | partial via `GET /api/v1/admin/sections` | `course_sections`, `semesters` | needs mock |
| student_records | `/dashboard/admin?module=users` | admin | partial via `GET /api/v1/users`, `GET /api/v1/admin/reports/system` | `users`, `enrollments`, `grades` | needs mock |
| financials_billing_management | `/dashboard/admin?module=overview` | admin | no finance endpoint | n/a | needs backend later |
| security_system_settings | `/dashboard/admin?module=security` | admin | `GET /api/v1/admin/audit-logs` | `audit_logs` | implemented |
| audit_logs_activity_tracking | `/dashboard/admin?module=security` | admin | `GET /api/v1/admin/audit-logs` | `audit_logs`, `users` | implemented |
| integration_api_management | `/dashboard/admin?module=security` | admin | `GET /api/v1/admin/audit-logs` (operational view), no integration CRUD endpoint | `audit_logs`, `uploaded_files` | needs mock |
| data_backup_system_maintenance | `/dashboard/admin?module=security` | admin | no backup job endpoint | n/a | needs backend later |
| system_maintenance_backups | `/dashboard/admin?module=security` | admin | no backup job endpoint | n/a | needs backend later |
| notification_alert_templates_1 | `/dashboard/admin?module=security` | admin | `GET/POST /api/v1/announcements`, `GET /api/v1/notifications` | `announcements`, `notifications` | implemented |
| notification_alert_templates_2 | `/dashboard/admin?module=security` | admin | `GET/POST /api/v1/announcements`, `GET /api/v1/notifications` | `announcements`, `notifications` | implemented |
| report_analytics_builder_2 | `/dashboard/admin?module=security` | admin | `GET /api/v1/admin/reports/system`, `GET /api/v1/reports/admin` | `audit_logs`, `users`, `courses` | implemented |
| institutional_communications | `/dashboard/admin?module=security` | admin | `GET/POST /api/v1/announcements` | `announcements` | implemented |
| staff_dashboard | `/dashboard/academic-staff?module=training_dashboard` | academic_staff | `GET /api/v1/dashboards/academic_staff` | `course_sections`, `lecturer_assignments`, `grade_approvals`, `exam_approvals` | implemented |
| curriculum_catalog_management | `/dashboard/academic-staff?module=curriculum` | academic_staff | `GET/POST /api/v1/academic/curriculum` | `curriculum_entries`, `programs`, `courses` | implemented |
| course_catalog_admin | `/dashboard/academic-staff?module=course_catalog` | academic_staff | derived from `GET /api/v1/academic/curriculum` + `GET /api/v1/academic/sections` | `curriculum_entries`, `courses`, `course_sections` | needs mock |
| class_sections_admin | `/dashboard/academic-staff?module=class_sections` | academic_staff | `GET /api/v1/academic/sections`, `PUT /api/v1/academic/sections/{section_id}` | `course_sections`, `courses` | implemented |
| department_faculty_management | `/dashboard/academic-staff?module=lecturers` | academic_staff | `POST /api/v1/academic/lecturer-assignments`, `GET /api/v1/academic/sections` | `lecturer_assignments`, `course_sections`, `users` | implemented |
| enrollment_management | `/dashboard/academic-staff?module=students` | academic_staff | `GET /api/v1/academic/student-tracking` | `enrollments`, `grades`, `attendance_records` | implemented |
| academic_reports | `/dashboard/academic-staff?module=reports` | academic_staff | `GET /api/v1/academic/reports/training` | report aggregation on `curriculum_entries`, `course_sections`, `grades` | implemented |
| report_analytics_builder_1 | `/dashboard/academic-staff?module=reports` | academic_staff | `GET /api/v1/academic/reports/training` | report aggregation | implemented |
| quiz_builder | `/dashboard/academic-staff?module=exams` | academic_staff | `GET/POST/PATCH /api/v1/academic/exam-approvals` | `exam_approvals`, `quizzes` | implemented |
| grades_dashboard | `/dashboard/academic-staff?module=grade_approval` | academic_staff | `GET/POST/PATCH /api/v1/academic/grade-approvals` | `grade_approvals`, `grades` | implemented |
| announcements_manager | `/dashboard/academic-staff?module=announcements` | academic_staff | `GET/POST /api/v1/announcements` | `announcements` | implemented |
| advisor_dashboard | `/dashboard/advisor?module=success_dashboard` | advisor | `GET /api/v1/dashboards/advisor`, `GET /api/v1/advisor/reports/summary` | `advisor_students`, `risk_alerts`, `consultation_records`, `support_requests` | implemented |
| student_caseload_management | `/dashboard/advisor?module=my_students` | advisor | `GET/POST /api/v1/advisor/students` | `advisor_students`, `users` | implemented |
| student_profile_advisor_view | `/advisor/students/[id]` -> `/dashboard/advisor?module=student_profile` | advisor | `GET /api/v1/advisor/students/{student_id}/progress` | `advisor_students`, `enrollments`, `grades`, `attendance_records` | implemented |
| alerts_intervention_center | `/dashboard/advisor?module=risk_alerts` | advisor | `GET/POST/PATCH /api/v1/advisor/risk-alerts` | `risk_alerts` | implemented |
| degree_audit_graduation_clearance | `/dashboard/advisor?module=progress_tracking` | advisor | `GET /api/v1/advisor/students/{student_id}/progress` | `grades`, `enrollments` | implemented |
| appointment_scheduler | `/dashboard/advisor?module=consultations` | advisor | `GET/POST /api/v1/advisor/consultations` | `consultation_records` | implemented |
| degree_planning_advising | `/dashboard/advisor?module=study_plans` | advisor | `GET/POST /api/v1/advisor/study-plans` | `study_plans` | implemented |
| graduation_clearance_review | `/dashboard/advisor?module=support_requests` | advisor | `GET/POST/PATCH /api/v1/advisor/support-requests` | `support_requests` | implemented |
| meeting_preparation_notes | `/dashboard/advisor?module=consultations` | advisor | `GET/POST /api/v1/advisor/consultations` | `consultation_records` | implemented |
| resource_documentation_hub | `/dashboard/advisor?module=messages` | advisor | `GET /api/v1/notifications`, `GET /api/v1/files` | `notifications`, `uploaded_files` | needs mock |
| bulk_communication_tool | `/dashboard/advisor?module=messages` | advisor | `GET/POST /api/v1/announcements`, `POST /api/v1/notifications` | `announcements`, `notifications` | implemented |
| advisor_analytics_reporting | `/dashboard/advisor?module=reports` | advisor | `GET /api/v1/advisor/reports/summary` | report aggregation on advisor domain entities | implemented |
| caseload_audit_verification | `/dashboard/advisor?module=reports` | advisor | `GET /api/v1/advisor/reports/summary` | `advisor_students`, `risk_alerts`, `consultation_records` | implemented |

## Missing Screen Notes
- Forum workflows (`community_forum`, `forum_moderation`) need dedicated backend forum endpoints.
- Live class and system backup/billing screens need backend endpoints before full parity.
- Several screens are implemented as derived dashboards from current APIs (`calendar`, `achievements`, `course_scheduling`, `resource_documentation_hub`, etc.).

## Routing Compatibility Implemented
- `/dashboard/academic-staff` is supported (canonical for `academic_staff`).
- Added redirects for compatibility routes:
  - `/student/courses`, `/student/courses/[id]`, `/student/assignments/[id]`, `/student/quizzes/[id]`
  - `/lecturer/courses`, `/lecturer/assignments`, `/lecturer/submissions`
  - `/admin/users`, `/admin/roles`
  - `/academic/grade-approval`
  - `/advisor/students/[id]`
