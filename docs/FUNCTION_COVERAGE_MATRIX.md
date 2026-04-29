# Brainio LMS Function Coverage Matrix

This document maps the implementation plan to the 5 required user groups.

## 1. Student

Core modules:
- Account and profile
- My courses
- Lessons and learning materials
- Assignments and submissions
- Quiz and online exams
- Grades and learning results
- Attendance
- Calendar and deadlines
- Online classes
- Forum and messages
- Study groups
- Notifications
- Surveys and feedback
- Support requests

## 2. Lecturer

Core modules:
- Account and teaching profile
- Assigned course sections
- Lesson and material management
- Student management
- Assignment management
- Quiz, exams, and question bank
- Gradebook
- Attendance
- Online classes
- Forum and class communication
- Reports and analytics

## 3. Admin

Core modules:
- System dashboard
- User management
- Role and permission management
- Organization management
- Academic year and semester management
- Course and course section management
- Content moderation
- Assignment, quiz, and exam oversight
- Grade configuration and audit
- Attendance configuration
- Notifications and announcements
- Forum, feedback, and survey moderation
- Third party integrations
- Security and audit logs
- Backup and operations
- System reports

## 4. Academic Staff / Faculty / Training Office

Core modules:
- Academic dashboard
- Curriculum management
- Course catalog management
- Course section management
- Lecturer assignment
- Student tracking
- Teaching progress monitoring
- Exams and assessment approval
- Grade approval
- Attendance and academic warnings
- Academic announcements
- Surveys and training quality
- Academic reports

## 5. Advisor

Core modules:
- Student success dashboard
- Assigned student profiles
- Learning progress tracking
- Academic risk alerts
- Consultation scheduling
- Study plans
- Student communication
- Course registration tracking
- Attendance and discipline tracking
- Support requests and escalation
- Advisor reports

## Implementation Strategy

Sprint 2 builds the core foundation required by all later modules:

- Auth module
- User model
- Role model
- Permission model
- Role based navigation
- Role dashboard contracts
- Frontend app shell
- Dashboard skeletons for all 5 roles

Later sprints add database persistence, real API integration, and detailed CRUD screens for every module above.
