# Brainio LMS UAT Summary

## UAT Overview

- Product: Brainio LMS
- Phase: Sprint 1-7 acceptance
- Environment: Local (Docker + API + Web)
- Test suite reference: `docs/UAT_TEST_CASES.md`
- Roles covered: Student, Lecturer, Admin, Academic Staff, Advisor

## Readiness Checklist

- [ ] Backend service runs and health check is OK
- [ ] Frontend app runs and dashboards are accessible
- [ ] Database migrated to latest schema
- [ ] Seed data loaded for all 5 roles
- [ ] Demo accounts validated
- [ ] RBAC smoke checks passed

## Functional Acceptance Checklist

## Cross-cutting

- [ ] Auth login/logout/me works for all roles
- [ ] RBAC restrictions enforced (403 on forbidden APIs)
- [ ] Dashboard renders correct modules per role
- [ ] Notifications list/create/mark-read works
- [ ] Reports by role are generated correctly

## Student

- [ ] My Courses and Course Detail
- [ ] Lesson Viewer
- [ ] Assignment submission
- [ ] Quiz taking and auto-grade
- [ ] Personal grades
- [ ] Personal attendance

## Lecturer

- [ ] Section-scoped access
- [ ] Lesson CRUD
- [ ] Assignment CRUD
- [ ] Submission review and grading
- [ ] Quiz builder
- [ ] Gradebook by section
- [ ] Attendance session and marking

## Admin

- [ ] User management CRUD
- [ ] Role/permission management
- [ ] Department/program/course management
- [ ] Semester/course section management
- [ ] System report visibility

## Academic Staff

- [ ] Curriculum management
- [ ] Course section operations
- [ ] Lecturer assignment
- [ ] Student tracking
- [ ] Grade approval workflow
- [ ] Exam approval foundation
- [ ] Academic report

## Advisor

- [ ] Assigned student listing
- [ ] Student progress tracking
- [ ] Risk alert lifecycle
- [ ] Consultation records
- [ ] Study plan management
- [ ] Support request and escalation

## Non-functional Acceptance Checklist

- [ ] Frontend build success (`npm run build`)
- [ ] Frontend typecheck success (`npx tsc --noEmit`)
- [ ] Backend import success
- [ ] Docker compose build success
- [ ] No critical regression in UI flows

## UAT Execution Summary

- Total test cases:
- Executed:
- Passed:
- Failed:
- Blocked:
- Not Run:
- Pass rate:

## Defect Summary

- Critical defects:
- High defects:
- Medium defects:
- Low defects:
- Known limitations accepted:

## Go/No-Go Decision

- Decision:
- Conditions:
- Sign-off by Product Owner:
- Sign-off by QA Lead:
- Sign-off date:

