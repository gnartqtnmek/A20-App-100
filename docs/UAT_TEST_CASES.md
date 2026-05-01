# Brainio LMS UAT Test Cases

## Scope

This UAT set covers 5 mandatory roles:
- Student
- Lecturer
- Admin
- Academic Staff
- Advisor

Test case fields:
- Test Case ID
- Role
- Module
- Preconditions
- Steps
- Expected Result
- Actual Result
- Status

Use values for execution:
- Actual Result: fill during UAT run
- Status: `Pass` / `Fail` / `Blocked` / `Not Run`

## UAT Environment Baseline

- API running at `http://localhost:8000`
- Web running at `http://localhost:3000`
- Seed data loaded (`python seed.py`)
- Demo accounts available (`docs/DEMO_ACCOUNTS.md`)

---

## Authentication & Session

| Test Case ID | Role | Module | Preconditions | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| UAT-AUTH-001 | Student | Auth Login | Student account exists, API/Web running | 1) Open `/login` 2) Enter student credentials 3) Submit | Login success, redirected to `/dashboard/student` |  | Not Run |
| UAT-AUTH-002 | Lecturer | Auth Login | Lecturer account exists | 1) Login with lecturer account | Redirect to `/dashboard/lecturer` |  | Not Run |
| UAT-AUTH-003 | Admin | Auth Login | Admin account exists | 1) Login with admin account | Redirect to `/dashboard/admin` |  | Not Run |
| UAT-AUTH-004 | Academic Staff | Auth Login | Staff account exists | 1) Login with staff account | Redirect to `/dashboard/academic_staff` |  | Not Run |
| UAT-AUTH-005 | Advisor | Auth Login | Advisor account exists | 1) Login with advisor account | Redirect to `/dashboard/advisor` |  | Not Run |
| UAT-AUTH-006 | Student | Auth Validation | Login page open | 1) Enter wrong password 2) Submit | Error shown, no login, stay on login page |  | Not Run |
| UAT-AUTH-007 | Student | Session | Logged in | 1) Refresh browser 2) Open protected route | Session still valid, page accessible |  | Not Run |
| UAT-AUTH-008 | Student | Logout | Logged in | 1) Click logout 2) Access dashboard URL directly | Redirect to login, protected route blocked |  | Not Run |

---

## RBAC

| Test Case ID | Role | Module | Preconditions | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| UAT-RBAC-001 | Student | RBAC Admin API | Student logged in | 1) Call `/api/v1/admin/courses` | 403 forbidden |  | Not Run |
| UAT-RBAC-002 | Student | RBAC Lecturer API | Student logged in | 1) Call `/api/v1/lecturer/sections` | 403 forbidden |  | Not Run |
| UAT-RBAC-003 | Lecturer | RBAC Admin API | Lecturer logged in | 1) Call `/api/v1/admin/users` | 403 forbidden |  | Not Run |
| UAT-RBAC-004 | Lecturer | Section Scope | Lecturer has assigned sections | 1) Open own section 2) Try foreign section id | Own section allowed, foreign section blocked |  | Not Run |
| UAT-RBAC-005 | Advisor | Advisor Scope | Advisor has assigned students | 1) Open assigned student progress 2) Open unassigned student progress | Assigned allowed, unassigned forbidden |  | Not Run |
| UAT-RBAC-006 | Academic Staff | Department Scope | Staff has department scope | 1) Open in-scope section 2) Update out-of-scope section | In-scope allowed, out-of-scope forbidden |  | Not Run |
| UAT-RBAC-007 | Admin | Global Access | Admin logged in | 1) Access admin APIs 2) Access advisor listing 3) Access reports | Access granted according to admin privileges |  | Not Run |

---

## Dashboard

| Test Case ID | Role | Module | Preconditions | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| UAT-DB-001 | Student | Dashboard | Student logged in | 1) Open student dashboard | Header, hero, metrics, module cards render correctly |  | Not Run |
| UAT-DB-002 | Lecturer | Dashboard | Lecturer logged in | 1) Open lecturer dashboard | Lecturer-specific modules shown |  | Not Run |
| UAT-DB-003 | Admin | Dashboard | Admin logged in | 1) Open admin dashboard | Admin KPIs and management links shown |  | Not Run |
| UAT-DB-004 | Academic Staff | Dashboard | Staff logged in | 1) Open staff dashboard | Academic operations modules shown |  | Not Run |
| UAT-DB-005 | Advisor | Dashboard | Advisor logged in | 1) Open advisor dashboard | Advisor student/risk modules shown |  | Not Run |

---

## Student Modules

| Test Case ID | Role | Module | Preconditions | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| UAT-STU-COURSE-001 | Student | My Courses | Student enrolled in sections | 1) Open My Courses | Only enrolled courses shown |  | Not Run |
| UAT-STU-COURSE-002 | Student | Course Detail | Course exists in enrollment | 1) Open course detail | Course meta, lecturer info, section info displayed |  | Not Run |
| UAT-STU-LESSON-001 | Student | Lessons | Published lessons exist | 1) Open lesson list | Only published lessons visible |  | Not Run |
| UAT-STU-ASSIGN-001 | Student | Assignments | Assignment exists | 1) Open assignment list | Assignments for own section displayed |  | Not Run |
| UAT-STU-SUB-001 | Student | Submission | Assignment exists | 1) Submit assignment content | Submission saved with submitted/resubmitted status |  | Not Run |
| UAT-STU-QUIZ-001 | Student | Quiz Taking | Published quiz exists | 1) Open quiz 2) Answer questions 3) Submit | Score returned, attempt saved |  | Not Run |
| UAT-STU-GRADE-001 | Student | Grades | Student has grades | 1) Open grades page | Only own grades shown (assignment + quiz) |  | Not Run |
| UAT-STU-ATT-001 | Student | Attendance | Attendance records exist | 1) Open attendance page | Only own attendance records shown |  | Not Run |

---

## Lecturer Modules

| Test Case ID | Role | Module | Preconditions | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| UAT-LEC-COURSE-001 | Lecturer | Sections | Lecturer assigned to sections | 1) Open section list | Only assigned sections shown |  | Not Run |
| UAT-LEC-LESSON-001 | Lecturer | Lesson CRUD | Section owned by lecturer | 1) Create lesson 2) Edit lesson 3) Delete lesson | CRUD operations succeed in owned section |  | Not Run |
| UAT-LEC-ASSIGN-001 | Lecturer | Assignment CRUD | Owned section exists | 1) Create assignment 2) Edit 3) Delete | CRUD operations succeed |  | Not Run |
| UAT-LEC-SUB-001 | Lecturer | View Submissions | Students submitted work | 1) Open assignment submissions | Submission list for section displayed |  | Not Run |
| UAT-LEC-GRADE-001 | Lecturer | Grade Submission | Submission exists | 1) Grade submission 2) Add feedback | Grade saved, submission marked graded |  | Not Run |
| UAT-LEC-QUIZ-001 | Lecturer | Quiz Builder | Owned section exists | 1) Create quiz 2) Add questions | Quiz and question bank saved |  | Not Run |
| UAT-LEC-GRADEBOOK-001 | Lecturer | Gradebook | Section has grades | 1) Open gradebook by section | Section student grades displayed |  | Not Run |
| UAT-LEC-ATT-001 | Lecturer | Attendance Session | Owned section exists | 1) Create attendance session | Session created successfully |  | Not Run |
| UAT-LEC-ATT-002 | Lecturer | Attendance Marking | Attendance session exists | 1) Mark present/absent for students | Records saved correctly |  | Not Run |

---

## Admin Modules

| Test Case ID | Role | Module | Preconditions | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| UAT-ADM-USER-001 | Admin | User Management Create | Admin logged in | 1) Open users 2) Create new user | User created, visible in list |  | Not Run |
| UAT-ADM-USER-002 | Admin | User Management Update | Existing user | 1) Edit user profile/role | User updated |  | Not Run |
| UAT-ADM-USER-003 | Admin | User Management Delete | Existing user | 1) Delete user | User removed or deactivated as designed |  | Not Run |
| UAT-ADM-ROLE-001 | Admin | Role Permissions | Role and permission data exists | 1) Open permissions 2) Update role permissions | Mapping updated successfully |  | Not Run |
| UAT-ADM-DEPT-001 | Admin | Department CRUD | Admin logged in | 1) Create/update/delete department | CRUD succeeds, list updates |  | Not Run |
| UAT-ADM-PROG-001 | Admin | Program CRUD | Department exists | 1) Create/update/delete program | CRUD succeeds |  | Not Run |
| UAT-ADM-COURSE-001 | Admin | Course CRUD | Department exists | 1) Create/update/delete course | CRUD succeeds |  | Not Run |
| UAT-ADM-SEM-001 | Admin | Semester Management | Admin logged in | 1) Create semester 2) Update semester | Semester data saved |  | Not Run |
| UAT-ADM-SEC-001 | Admin | Course Section Management | Course exists | 1) Create/update section | Section saved with lecturer assignment if provided |  | Not Run |
| UAT-ADM-REP-001 | Admin | System Reports | Data seeded | 1) Open system report | KPIs returned correctly |  | Not Run |

---

## Academic Staff Modules

| Test Case ID | Role | Module | Preconditions | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| UAT-ACS-CUR-001 | Academic Staff | Curriculum Management | Staff logged in | 1) Create curriculum entry 2) List curriculum | Entry created and listed in scope |  | Not Run |
| UAT-ACS-SEC-001 | Academic Staff | Section Management | In-scope sections exist | 1) Open sections 2) Update section status | Update succeeds for in-scope sections |  | Not Run |
| UAT-ACS-LEC-001 | Academic Staff | Lecturer Assignment | Section and lecturer exist | 1) Assign lecturer to section | Assignment created, section lecturer updated |  | Not Run |
| UAT-ACS-TRACK-001 | Academic Staff | Student Tracking | Enrollments exist | 1) Open tracking | Student tracking metrics displayed |  | Not Run |
| UAT-ACS-GA-001 | Academic Staff | Grade Approval | Pending request exists | 1) Open approvals 2) Approve/reject | Status updated with approver info |  | Not Run |
| UAT-ACS-EA-001 | Academic Staff | Exam Approval | Pending exam request exists | 1) Open exam approvals 2) Approve/reject | Status updated correctly |  | Not Run |
| UAT-ACS-REP-001 | Academic Staff | Academic Report | Data available | 1) Open training report | Report metrics returned correctly |  | Not Run |

---

## Advisor Modules

| Test Case ID | Role | Module | Preconditions | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| UAT-ADV-STU-001 | Advisor | Assigned Students | Advisor-student links exist | 1) Open My Students | Only assigned students shown |  | Not Run |
| UAT-ADV-PROG-001 | Advisor | Student Progress | Assigned student exists | 1) Open student progress | Grades, attendance, risk summary shown |  | Not Run |
| UAT-ADV-RISK-001 | Advisor | Risk Alerts Create | Assigned student exists | 1) Create risk alert | Risk alert saved with open status |  | Not Run |
| UAT-ADV-RISK-002 | Advisor | Risk Alerts Update | Existing risk alert | 1) Update alert status/recommendation | Alert updated successfully |  | Not Run |
| UAT-ADV-CONS-001 | Advisor | Consultation Notes | Assigned student exists | 1) Create consultation note | Consultation saved and listed |  | Not Run |
| UAT-ADV-PLAN-001 | Advisor | Study Plans | Assigned student exists | 1) Create study plan | Plan saved and listed |  | Not Run |
| UAT-ADV-SUP-001 | Advisor | Support Requests | Assigned student exists | 1) Create support request 2) Escalate | Request created and escalation status updated |  | Not Run |
| UAT-ADV-REP-001 | Advisor | Advisor Report | Advisor data exists | 1) Open advisor report summary | Metrics for assigned students and alerts returned |  | Not Run |

---

## Notifications, Announcements, Reports

| Test Case ID | Role | Module | Preconditions | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| UAT-NOTI-001 | Student | Notifications List | Notification exists for user | 1) Open notification center | User notifications listed with pagination |  | Not Run |
| UAT-NOTI-002 | Student | Mark Read | Unread notification exists | 1) Mark notification as read | Notification state updates to read |  | Not Run |
| UAT-NOTI-003 | Lecturer | Create Notification | Lecturer logged in | 1) Create notification for target user | Notification created successfully |  | Not Run |
| UAT-ANN-001 | Admin | Announcements Create | Admin logged in | 1) Create announcement with target role | Announcement saved and visible to target role |  | Not Run |
| UAT-ANN-002 | Student | Announcements View | Role-targeted announcement exists | 1) Open announcements | Student sees own-target/all announcements only |  | Not Run |
| UAT-REP-001 | Student | Role Report | Student logged in | 1) Call `/api/v1/reports/student` | Student report generated |  | Not Run |
| UAT-REP-002 | Lecturer | Role Report | Lecturer logged in | 1) Call `/api/v1/reports/lecturer` | Lecturer report generated |  | Not Run |
| UAT-REP-003 | Admin | Role Report | Admin logged in | 1) Call `/api/v1/reports/admin` and other roles | Reports generated as allowed |  | Not Run |

---

## End-to-End Critical Flows

| Test Case ID | Role | Module | Preconditions | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|---|
| UAT-E2E-001 | Lecturer + Student | Assignment Workflow | Lecturer has section, student enrolled | 1) Lecturer creates assignment 2) Student submits 3) Lecturer grades 4) Student checks grades | End-to-end assignment lifecycle works with correct visibility |  | Not Run |
| UAT-E2E-002 | Admin + Academic Staff | Academic Operation | Course/section exists | 1) Admin creates section 2) Academic staff assigns lecturer 3) Academic staff approves grade request | Admin-academic staff coordination works with RBAC |  | Not Run |
| UAT-E2E-003 | Advisor + Student | Risk Management | Advisor assigned to student | 1) Advisor creates risk alert 2) Adds consultation 3) Creates study plan | Advisor support workflow persisted and visible in advisor scope |  | Not Run |

---

## UAT Sign-off

- Test execution owner:
- Execution window:
- Pass rate:
- Blocking defects:
- Go/No-Go decision:

