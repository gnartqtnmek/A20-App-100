# Brainio LMS Demo Accounts

## Default password

- `Brainio@123`

## Core role accounts (5 roles)

| Role | Email | Purpose |
|---|---|---|
| student | `student@brainio.edu` | Student portal, course learning, submission, quiz, grades, attendance |
| lecturer | `lecturer@brainio.edu` | Lecturer portal, lesson/assignment/quiz management, grading, attendance |
| admin | `admin@brainio.edu` | Full system administration, user/role/academic structure management |
| academic_staff | `staff@brainio.edu` | Curriculum & section operations, lecturer assignment, approvals |
| advisor | `advisor@brainio.edu` | Assigned students, progress tracking, risk and consultation workflows |

## Seeded sample data

- Departments: `CSE`, `BUS`
- Programs: `SE2026`, `BA2026`
- Courses: `SE401`, `SE402`
- Sections: `SE401-01`, `SE402-01`
- Lessons: ít nhất 1 bài học published
- Assignments: ít nhất 1 assignment
- Submissions: student đã có submission demo
- Quizzes: ít nhất 1 quiz + câu hỏi trắc nghiệm
- Grades: có grade assignment và grade quiz
- Attendance: có attendance session + record
- Notifications: có notification demo cho student

## Notes

- Tài khoản `admin` có quyền kiểm tra chéo các module để QA.
- Dữ liệu được seed theo hướng idempotent: chạy lại `python seed.py` không làm hỏng baseline demo.
