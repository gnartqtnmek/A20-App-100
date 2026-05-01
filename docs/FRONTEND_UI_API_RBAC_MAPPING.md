# Frontend Route/API/RBAC Mapping (UI Refactor 2026-04-30)

This table maps the current frontend modules in `apps/web` to backend APIs and role visibility.

## Student

| UI Screen | Frontend Route | API(s) | Role |
|---|---|---|---|
| Student Home Dashboard | `/dashboard/student?module=home` | `GET /api/v1/dashboards/student`, `GET /api/v1/student/grades`, `GET /api/v1/student/attendance` | student, admin |
| My Courses + Course Detail | `/dashboard/student?module=my_courses` | `GET /api/v1/student/courses`, `GET /api/v1/student/courses/{section_id}`, `GET /api/v1/student/courses/{section_id}/lessons` | student, admin |
| Lessons + Lesson Viewer | `/dashboard/student?module=lessons` | `GET /api/v1/student/courses/{section_id}/lessons`, `GET /api/v1/student/courses/{section_id}/quizzes` | student, admin |
| Assignments + Assignment Submission | `/dashboard/student?module=assignments` | `GET /api/v1/student/courses/{section_id}/assignments`, `POST /api/v1/student/assignments/{assignment_id}/submit`, `POST /api/v1/files/upload` | student, admin |
| Quiz and Exams + Quiz Taking | `/dashboard/student?module=quiz_exams` | `GET /api/v1/student/courses/{section_id}/quizzes`, `GET /api/v1/student/quizzes/{quiz_id}/questions`, `POST /api/v1/student/quizzes/{quiz_id}/submit` | student, admin |
| Grades | `/dashboard/student?module=grades` | `GET /api/v1/student/grades` | student, admin |
| Attendance | `/dashboard/student?module=attendance` | `GET /api/v1/student/attendance` | student, admin |
| Calendar | `/dashboard/student?module=calendar` | `GET /api/v1/student/courses/{section_id}/lessons`, `GET /api/v1/student/courses/{section_id}/quizzes`, `GET /api/v1/student/courses/{section_id}/assignments`, `GET /api/v1/notifications` (derived) | student, admin |
| Achievements | `/dashboard/student?module=achievements` | `GET /api/v1/student/grades`, `GET /api/v1/student/attendance` (derived) | student, admin |
| Community Forum | `/dashboard/student?module=community` | TODO endpoint (forum APIs not exposed yet) | student, admin |
| Messages and Notifications + Profile Settings | `/dashboard/student?module=messages` | `GET /api/v1/notifications`, `PATCH /api/v1/notifications/{id}/read`, `GET /api/v1/profile`, `PUT /api/v1/profile` | student, admin |

## Lecturer

| UI Screen | Frontend Route | API(s) | Role |
|---|---|---|---|
| Dashboard | `/dashboard/lecturer?module=dashboard` | `GET /api/v1/dashboards/lecturer` | lecturer, admin |
| Course Studio | `/dashboard/lecturer?module=course_studio` | `GET /api/v1/lecturer/sections`, `GET /api/v1/lecturer/sections/{section_id}` | lecturer, admin |
| Lesson Manager | `/dashboard/lecturer?module=lesson_manager` | `GET/POST /api/v1/lecturer/sections/{section_id}/lessons` | lecturer, admin |
| Assignment Manager | `/dashboard/lecturer?module=assignment_manager` | `GET/POST /api/v1/lecturer/sections/{section_id}/assignments` | lecturer, admin |
| Submission Grading | `/dashboard/lecturer?module=submission_grading` | `GET /api/v1/lecturer/assignments/{assignment_id}/submissions`, `POST /api/v1/lecturer/submissions/{submission_id}/grade` | lecturer, admin |
| Quiz Builder | `/dashboard/lecturer?module=quiz_builder` | `GET/POST /api/v1/lecturer/sections/{section_id}/quizzes`, `GET/POST /api/v1/lecturer/quizzes/{quiz_id}/questions` | lecturer, admin |
| Gradebook | `/dashboard/lecturer?module=gradebook` | `GET /api/v1/lecturer/sections/{section_id}/gradebook` | lecturer, admin |
| Attendance | `/dashboard/lecturer?module=attendance` | `GET/POST /api/v1/lecturer/sections/{section_id}/attendance-sessions`, `POST /api/v1/lecturer/attendance-sessions/{session_id}/mark`, `GET /api/v1/lecturer/sections/{section_id}/attendance` | lecturer, admin |

## Admin (new Admin Portal UI)

| UI Screen | Frontend Route | API(s) | Role |
|---|---|---|---|
| Admin Overview | `/dashboard/admin?module=overview` | `GET /api/v1/dashboards/admin`, `GET /api/v1/admin/reports/system` | admin |
| User Management / User Profile | `/dashboard/admin?module=users` | `GET/POST /api/v1/users`, `PUT /api/v1/users/{user_id}` | admin |
| Roles and RBAC / Permission Matrix | `/dashboard/admin?module=roles_rbac` | `GET /api/v1/admin/roles`, `GET /api/v1/admin/permissions`, `PUT /api/v1/admin/roles/{role_code}/permissions` | admin |
| Organization Structure (Departments/Programs) | `/dashboard/admin?module=departments` | `GET/POST /api/v1/admin/departments`, `GET/POST /api/v1/admin/programs` | admin |
| Academic Calendar | `/dashboard/admin?module=semesters` | `GET/POST /api/v1/admin/semesters` | admin |
| Course Catalog + Class Sections | `/dashboard/admin?module=courses` | `GET/POST /api/v1/admin/courses`, `GET /api/v1/admin/sections` | admin |
| Enrollment Admin | `/dashboard/admin?module=enrollments` | TODO endpoint (no dedicated admin enrollment action API exposed) | admin |
| Content Moderation | `/dashboard/admin?module=content` | `GET /api/v1/files` (derived queue) | admin |
| Exam Administration | `/dashboard/admin?module=exams` | `GET /api/v1/academic/exam-approvals` (admin allowed) | admin |
| Grade Administration | `/dashboard/admin?module=grades` | `GET /api/v1/academic/grade-approvals`, `GET /api/v1/admin/reports/system` | admin |
| Security and Audit Logs / Notification Center / Integrations / Reports / Operations | `/dashboard/admin?module=security` | `GET /api/v1/admin/audit-logs`, `GET/POST /api/v1/announcements`, `GET /api/v1/admin/reports/system` | admin |

## Academic Staff

| UI Screen | Frontend Route | API(s) | Role |
|---|---|---|---|
| Dashboard | `/dashboard/academic_staff?module=training_dashboard` | `GET /api/v1/dashboards/academic_staff` | academic_staff, admin |
| Curriculum | `/dashboard/academic_staff?module=curriculum` | `GET/POST /api/v1/academic/curriculum` | academic_staff, admin |
| Course Catalog | `/dashboard/academic_staff?module=course_catalog` | `GET /api/v1/academic/curriculum` (derived), TODO dedicated catalog endpoint | academic_staff, admin |
| Class Sections | `/dashboard/academic_staff?module=class_sections` | `GET /api/v1/academic/sections` | academic_staff, admin |
| Lecturer Assignment | `/dashboard/academic_staff?module=lecturers` | `POST /api/v1/academic/lecturer-assignments` | academic_staff, admin |
| Student Monitoring | `/dashboard/academic_staff?module=students` | `GET /api/v1/academic/student-tracking` | academic_staff, admin |
| Exam Approval | `/dashboard/academic_staff?module=exams` | `GET/POST/PATCH /api/v1/academic/exam-approvals` | academic_staff, admin |
| Grade Approval | `/dashboard/academic_staff?module=grade_approval` | `GET/POST/PATCH /api/v1/academic/grade-approvals` | academic_staff, admin |
| Surveys | `/dashboard/academic_staff?module=surveys` | TODO endpoint (no survey API exposed) | academic_staff, admin |
| Reports | `/dashboard/academic_staff?module=reports` | `GET /api/v1/academic/reports/training` | academic_staff, admin |
| Announcements | `/dashboard/academic_staff?module=announcements` | `GET/POST /api/v1/announcements` | academic_staff, admin |

## Advisor

| UI Screen | Frontend Route | API(s) | Role |
|---|---|---|---|
| Success Dashboard | `/dashboard/advisor?module=success_dashboard` | `GET /api/v1/dashboards/advisor`, `GET /api/v1/advisor/reports/summary` | advisor, admin |
| My Students | `/dashboard/advisor?module=my_students` | `GET/POST /api/v1/advisor/students`, `GET /api/v1/advisor/students/{student_id}/progress` | advisor, admin |
| Student 360 Profile | `/dashboard/advisor?module=student_profile` | `GET /api/v1/advisor/students/{student_id}/progress`, `GET /api/v1/advisor/consultations` | advisor, admin |
| Risk Alerts | `/dashboard/advisor?module=risk_alerts` | `GET/POST /api/v1/advisor/risk-alerts` | advisor, admin |
| Progress Tracking | `/dashboard/advisor?module=progress_tracking` | `GET /api/v1/advisor/students`, `GET /api/v1/advisor/students/{student_id}/progress`, `GET /api/v1/advisor/risk-alerts` | advisor, admin |
| Consultations | `/dashboard/advisor?module=consultations` | `GET/POST /api/v1/advisor/consultations` | advisor, admin |
| Study Plans | `/dashboard/advisor?module=study_plans` | `GET/POST /api/v1/advisor/study-plans` | advisor, admin |
| Attendance Follow-up | `/dashboard/advisor?module=attendance` | `GET /api/v1/advisor/students/{student_id}/progress` (derived attendance counters) | advisor, admin |
| Requests & Escalations | `/dashboard/advisor?module=support_requests` | `GET/POST /api/v1/advisor/support-requests`, `PATCH /api/v1/advisor/support-requests/{support_id}/escalate` | advisor, admin |
| Messages | `/dashboard/advisor?module=messages` | `GET /api/v1/notifications` | advisor, admin |
| Reports | `/dashboard/advisor?module=reports` | `GET /api/v1/advisor/reports/summary` | advisor, admin |

## TODO Notes

- Student `calendar` is derived from lessons/quizzes/assignments/notifications because no dedicated calendar endpoint is exposed.
- Student `achievements` metrics are derived from grades and attendance because no dedicated achievements endpoint is exposed.
- Student `community` is UI-only placeholder until forum APIs are available.
- Student profile settings currently persist only `display_name` via `PUT /api/v1/profile`; other preference fields are UI-only.
- Admin `enrollments` action workflow is UI-ready but backend endpoint is not exposed yet.
- Admin `content` moderation table currently uses uploaded files as queue because comment/report moderation endpoints are not exposed.
- Admin `security` integration settings and backup jobs are UI-only placeholders until dedicated backend endpoints are available.
- Academic Staff `surveys` module is UI-only placeholder until survey APIs are available.
