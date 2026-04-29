# Sprint 5 - Student + Lecturer Core LMS Modules

Date: 2026-04-29

## Scope Delivered

- Backend modules for student and lecturer:
  - Courses and section detail
  - Lessons CRUD (lecturer) + view (student)
  - Assignments CRUD (lecturer), submit (student), submissions listing and grading (lecturer)
  - Quiz foundation: quiz create, question create, student attempt, auto-grade MCQ
  - Gradebook: lecturer section gradebook, student personal grades
  - Attendance: session create, mark attendance, student/lecturer attendance views
- Frontend role portals:
  - Student: My Courses, Course Detail, Lesson Viewer, Assignments + submission, Quiz Taking, Grades, Attendance
  - Lecturer: Course Studio, Lessons Manager, Assignment Manager, Submission Grading, Quiz Builder, Gradebook, Attendance Manager

## New Backend Endpoints

- Student
  - `GET /api/v1/student/courses`
  - `GET /api/v1/student/courses/{section_id}`
  - `GET /api/v1/student/courses/{section_id}/lessons`
  - `GET /api/v1/student/courses/{section_id}/assignments`
  - `POST /api/v1/student/assignments/{assignment_id}/submit`
  - `GET /api/v1/student/courses/{section_id}/quizzes`
  - `GET /api/v1/student/quizzes/{quiz_id}/questions`
  - `POST /api/v1/student/quizzes/{quiz_id}/submit`
  - `GET /api/v1/student/grades`
  - `GET /api/v1/student/attendance`
- Lecturer
  - `GET /api/v1/lecturer/sections`
  - `GET /api/v1/lecturer/sections/{section_id}`
  - `GET /api/v1/lecturer/sections/{section_id}/students`
  - `GET/POST /api/v1/lecturer/sections/{section_id}/lessons`
  - `PUT/DELETE /api/v1/lecturer/lessons/{lesson_id}`
  - `GET/POST /api/v1/lecturer/sections/{section_id}/assignments`
  - `PUT/DELETE /api/v1/lecturer/assignments/{assignment_id}`
  - `GET /api/v1/lecturer/assignments/{assignment_id}/submissions`
  - `POST /api/v1/lecturer/submissions/{submission_id}/grade`
  - `GET/POST /api/v1/lecturer/sections/{section_id}/quizzes`
  - `GET/POST /api/v1/lecturer/quizzes/{quiz_id}/questions`
  - `GET /api/v1/lecturer/sections/{section_id}/gradebook`
  - `GET/POST /api/v1/lecturer/sections/{section_id}/attendance-sessions`
  - `POST /api/v1/lecturer/attendance-sessions/{session_id}/mark`
  - `GET /api/v1/lecturer/sections/{section_id}/attendance`

## Database Changes

- Alembic revision `20260429_0003`
  - `quiz_questions`
  - `quiz_attempts`
  - `attendance_sessions`

## Verification Done

- `python -m compileall apps/api/app apps/api/main.py apps/api/seed.py`
- `cd apps/api && alembic upgrade head`
- `cd apps/api && python seed.py`
- End-to-end API flow passed:
  - lecturer creates assignment
  - student submits assignment
  - lecturer grades submission
  - student sees grade
  - lecturer creates quiz/question
  - student takes quiz (auto-grade)
  - lecturer creates attendance session and marks
  - student sees attendance
- `cd apps/web && npm run lint`
- `cd apps/web && npm run build`
