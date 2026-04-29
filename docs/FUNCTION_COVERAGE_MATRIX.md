# Brainio LMS Function Coverage Matrix

This matrix maps core LMS capability coverage for the 5 required roles:

- `student`
- `lecturer`
- `admin`
- `academic_staff`
- `advisor`

## Role-to-Function Matrix

| Function Group | Student | Lecturer | Admin | Academic Staff | Advisor |
|---|---|---|---|---|---|
| Authentication & Profile | Use | Use | Use | Use | Use |
| Role-based Dashboard | Own dashboard | Own dashboard | System dashboard | Faculty dashboard | Advisory dashboard |
| Course / Section Access | View enrolled sections | Manage assigned sections | Full control | Faculty scope control | View assigned students' sections |
| Lessons & Materials | Learn and track progress | Create/publish/manage | Moderate & audit | Monitor and approve | Monitor learning signals |
| Assignments | Submit | Create and grade | Full oversight | Monitor quality | Monitor risk |
| Quizzes | Attempt | Create/manage/grade | Full oversight | Review/approve | Monitor outcomes |
| Grades | View own grades | Manage class gradebook | Configure and audit | Approve and monitor | Track assigned students |
| Attendance | View own records | Manage class attendance | Configure policy | Monitor patterns | Track risk attendance |
| Notifications | Receive | Send class notices | Send global notices | Send faculty notices | Send advising notices |
| Curriculum / Program | View roadmap | Follow curriculum | Manage institution-wide | Manage faculty-level | Advise study plan |
| Risk Alerts | Receive alerts | Trigger class alerts | Configure global rules | Monitor faculty risk | Own intervention workflow |
| Reports | Personal progress | Teaching reports | Full system reports | Faculty reports | Advisor reports |

## Sprint 2 + Sprint 3 Deliverables in Code

| Deliverable | Status |
|---|---|
| Role enum for 5 roles | Done |
| Role navigation/module mapping | Done |
| `GET /api/v1/modules/{role}` | Done |
| `GET /api/v1/dashboards/{role}` | Done |
| Demo login mapping to role | Done |
| `POST /api/v1/auth/login` | Done |
| `GET /api/v1/auth/me` | Done |
| Dashboard summary payload per role | Done |
| Frontend shared shell for 5 roles | Done |
| Frontend dashboards per role route | Done |

## Backend Starter Schema Coverage

Starter SQLAlchemy models and Alembic migration were created for:

- `users`
- `roles`
- `permissions`
- `role_permissions`
- `departments`
- `programs`
- `courses`
- `course_sections`
- `enrollments`
- `lessons`
- `assignments`
- `submissions`
- `quizzes`
- `grades`
- `attendance_records`
- `notifications`
