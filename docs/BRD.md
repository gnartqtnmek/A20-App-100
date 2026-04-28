# BRD — Business Requirements Document
## AI20K-015: LMS Chatbot Có Trí Nhớ (LMS with Memory AI Agent)
**Version:** 2.0 | **Date:** 2026-04-27 | **Status:** Approved

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Business Context & Problem Statement](#2-business-context--problem-statement)
3. [Market & Competitive Analysis](#3-market--competitive-analysis)
4. [Stakeholder Analysis](#4-stakeholder-analysis)
5. [Business Objectives & Success Criteria](#5-business-objectives--success-criteria)
6. [Business Requirements](#6-business-requirements)
7. [Business Rules](#7-business-rules)
8. [Functional Scope](#8-functional-scope)
9. [Out of Scope](#9-out-of-scope)
10. [Constraints & Assumptions](#10-constraints--assumptions)
11. [Risk Analysis](#11-risk-analysis)
12. [ROI & Business Case](#12-roi--business-case)
13. [Compliance & Regulatory Requirements](#13-compliance--regulatory-requirements)
14. [Approval & Sign-Off](#14-approval--sign-off)

---

## 1. Executive Summary

### 1.1 Project Overview

The **LMS Chatbot Có Trí Nhớ** (AI20K-015) is a university-grade Learning Management System integrated with a persistent-memory AI agent. The system enables instructors to manage courses, assignments, and grades while giving students an AI assistant that remembers their learning history across sessions — providing personalized guidance, deadline reminders, and academic support without requiring students to re-explain their context each conversation.

### 1.2 Problem Statement in Numbers

| Pain Point | Data Point | Source |
|---|---|---|
| Students forget deadlines | 68% of late submissions caused by missed reminders | Internal survey, 2025 |
| Repetitive AI questions | Students repeat context in 70% of follow-up AI conversations | Survey of 150 students |
| Instructor grading bottleneck | Average 3.2 days to return grades on 30-student classes | Faculty interview |
| Information fragmentation | Students use avg. 4 different tools (Zalo, email, LMS, USB) per course | Usage audit |
| No 24/7 academic support | 82% of student questions arise outside business hours | Helpdesk log analysis |

### 1.3 Proposed Solution

A unified web platform with:
- **LMS layer**: Courses, assignments, file submissions, grade book, announcements
- **AI Agent layer**: Conversational AI with persistent memory (Mem0), tool-calling (reads real-time LMS data), document RAG (semantic search over course materials)
- **Proactive layer**: Automated reminders, weekly digest emails, personalized progress summaries

### 1.4 Key Differentiator

Unlike generic LMS platforms (Moodle, Canvas) or standalone AI chatbots (ChatGPT), this system bridges both: the AI agent has direct read access to the student's actual assignments, grades, and course documents — making responses contextually accurate rather than generic.

---

## 2. Business Context & Problem Statement

### 2.1 Organizational Background

The system is built for university use, targeting the Vietnamese higher-education sector where:
- Most universities use Moodle (2010-era UX), which students find difficult to navigate
- Instructors spend significant time answering repetitive student questions via Zalo/Facebook
- AI tools (ChatGPT) are widely used by students but not integrated with actual course data
- No existing solution combines LMS + persistent AI memory in Vietnamese higher education

### 2.2 Current State ("As-Is" Process)

```
CURRENT STUDENT WORKFLOW:
┌─────────────────────────────────────────────────────────────────┐
│  1. Student checks Moodle for assignments (confusing interface) │
│  2. Misses deadline → asks classmates on Zalo group            │
│  3. Opens ChatGPT → must re-explain subject context each time  │
│  4. Submits via email attachment (no tracking)                  │
│  5. Waits 5-7 days for grade, no notification                  │
│  6. Checks grade manually by logging into separate system      │
└─────────────────────────────────────────────────────────────────┘

CURRENT INSTRUCTOR WORKFLOW:
┌─────────────────────────────────────────────────────────────────┐
│  1. Posts assignment on Moodle                                  │
│  2. Receives 30+ individual Zalo messages with same questions  │
│  3. Collects email submissions → manually tracks in Excel      │
│  4. Grades in Word/Excel → manually enters into Moodle         │
│  5. Announces grades via Zalo group                            │
│  6. Re-explains same concepts to multiple students             │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Future State ("To-Be" Process)

```
FUTURE STUDENT WORKFLOW:
┌─────────────────────────────────────────────────────────────────┐
│  1. Dashboard shows all assignments + deadlines automatically  │
│  2. Receives email/in-app reminder 48h and 24h before deadline │
│  3. Asks AI: "Bài tập tuần này là gì?" → AI knows their data  │
│  4. Submits file through platform → instant confirmation email │
│  5. Receives notification when graded → views grade + feedback │
│  6. Asks AI about grade → AI remembers previous feedback       │
└─────────────────────────────────────────────────────────────────┘

FUTURE INSTRUCTOR WORKFLOW:
┌─────────────────────────────────────────────────────────────────┐
│  1. Creates assignment once → students notified automatically  │
│  2. Views submission dashboard → see who submitted/who hasn't  │
│  3. Downloads submission files in bulk                         │
│  4. Enters grade + feedback → student notified automatically   │
│  5. AI handles common student questions using course materials │
│  6. Reviews AI conversation quality via admin panel            │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 Strategic Alignment

| University Strategic Goal | System Contribution |
|---|---|
| Digital transformation of academic processes | Replaces manual grade tracking and email submissions |
| Improve student retention & satisfaction | Proactive reminders reduce late/missed submissions |
| Support 24/7 student services | AI agent available outside office hours |
| Data-driven academic quality improvement | Usage analytics, grade distribution reports |
| Reduce administrative burden on faculty | Automated notifications, submission tracking |

---

## 3. Market & Competitive Analysis

### 3.1 Competitive Landscape

| Solution | LMS Features | AI Integration | Memory | Vietnamese Support | Cost |
|---|---|---|---|---|---|
| **Moodle** | Full | None | None | Plugin (poor) | Open source |
| **Canvas** | Full | Basic (no memory) | None | English only | $$$$ |
| **Google Classroom** | Basic | Gemini (no memory) | None | Good | Free |
| **Microsoft Teams EDU** | Basic | Copilot (generic) | None | Good | $$$ |
| **ChatGPT EDU** | None | Full | Limited (per-session) | Good | $$ |
| **This System** | Full | Full + Tools | Persistent (Mem0) | Native | Open source |

### 3.2 Feature Gap Analysis

```
FEATURES NOT AVAILABLE IN ANY COMPETITOR:
✓ AI that knows student's actual grades, submissions, assignments
✓ Persistent memory across unlimited sessions (Mem0)
✓ Proactive weekly digest generated by AI per-student
✓ RAG over course-specific documents (not generic web)
✓ Native Vietnamese UX designed for university context
✓ Integrated grade book + AI discussion in one platform
```

### 3.3 Target User Segments

**Segment 1: Students (Primary)**
- Age: 18-25
- Tech literacy: High (smartphone-native)
- Pain: Overwhelmed by deadlines, want instant answers
- Behavior: Chat-first (WhatsApp/Zalo), reluctant to read PDFs

**Segment 2: Instructors (Primary)**
- Age: 30-55
- Tech literacy: Medium-High
- Pain: Repetitive student questions, manual grade workflows
- Behavior: Email-first, familiar with Excel/Word

**Segment 3: Administrators (Secondary)**
- Age: 35-50
- Tech literacy: Medium
- Pain: No visibility into AI usage costs, system health
- Behavior: Dashboard-first, monthly reporting

---

## 4. Stakeholder Analysis

### 4.1 Stakeholder Register

| ID | Stakeholder | Role | Organization Unit | Influence | Interest | Engagement |
|---|---|---|---|---|---|---|
| STK-01 | Students | End user (AI + LMS) | All faculties | High | High | Consult |
| STK-02 | Instructors | Course manager | Academic departments | High | High | Collaborate |
| STK-03 | System Admin | Platform admin | IT Department | High | Medium | Collaborate |
| STK-04 | Department Head | Decision maker | Academic management | Medium | Medium | Inform |
| STK-05 | IT Infrastructure Team | Deployment | IT Department | High | Low | Consult |
| STK-06 | Data Privacy Officer | Compliance | Legal/Compliance | Medium | High | Consult |
| STK-07 | Project Sponsor | Budget authority | University leadership | High | Low | Inform |
| STK-08 | Development Team | Builders | Capstone team | High | High | Collaborate |

### 4.2 Stakeholder Impact Analysis

#### STK-01: Students

**Needs:**
- Know all upcoming deadlines at a glance
- Get assignment feedback without waiting for office hours
- Ask academic questions in Vietnamese at any time
- Have AI remember their learning struggles without re-explaining

**Success Indicators:**
- Can find all assignments within 2 clicks from dashboard
- AI answers course-specific questions correctly using lecture slides
- Receives deadline reminder 48h before due date (automated)
- AI recalls "last time you had trouble with linked lists" in next session

**Resistance Points:**
- Privacy concern: "Does the AI store my conversations?"
- Trust gap: "Is the AI giving correct information?"
- Habit inertia: "I already use ChatGPT"

**Mitigation:**
- Clear data privacy notice on registration
- AI states its sources (RAG citation)
- Better than ChatGPT because it knows their actual grades

#### STK-02: Instructors

**Needs:**
- Create and manage assignments without technical complexity
- See at a glance who has/hasn't submitted
- Grade submissions with structured feedback
- Trust AI to handle routine student questions about syllabus

**Success Indicators:**
- Assignment creation takes < 5 minutes
- Single-view submission dashboard shows all students' status
- Grade entry and notification in one action
- Zero Zalo messages about "when is the deadline?" type questions

**Resistance Points:**
- Fear of AI replacing instructor role
- Distrust of AI accuracy ("what if it tells students wrong info?")
- Time investment to upload course documents for RAG

**Mitigation:**
- AI clearly positioned as study assistant, not replacement
- AI cites document source in answers (instructor can verify)
- Document upload is drag-and-drop, one-time per semester

#### STK-03: System Administrator

**Needs:**
- Create/manage/lock user accounts
- Monitor AI API cost per user to prevent abuse
- View system health and error logs
- Generate usage reports for management

**Success Indicators:**
- Full user management in admin panel (no direct database access needed)
- AI cost dashboard with per-user breakdown
- System health visible from admin dashboard

**Resistance Points:**
- Concern about system stability (Railway uptime)
- Worry about API key security

**Mitigation:**
- Health check endpoints for monitoring
- API keys in environment variables, never in code

#### STK-05: IT Infrastructure Team

**Needs:**
- Documented deployment procedures
- Reproducible environment setup (Docker Compose)
- Clear data backup/restore procedures
- No black-box dependencies

**Success Indicators:**
- Any developer can set up dev environment in < 30 minutes
- Docker Compose starts all services with one command
- CI/CD pipeline automates deployments

### 4.3 Stakeholder Communication Plan

| Stakeholder | Update Frequency | Method | Content |
|---|---|---|---|
| Project Sponsor | Monthly | Report email | Progress %, budget status |
| Department Head | Bi-weekly | Demo meeting | Feature showcase |
| IT Infrastructure | Per sprint | Deployment docs | New services, config changes |
| Students (pilot) | Per sprint | Feedback form | New features, UX issues |
| Data Privacy Officer | Once (pre-launch) | Compliance review | Data handling documentation |

---

## 5. Business Objectives & Success Criteria

### 5.1 Primary Business Objectives

**BO-01: Reduce Student Deadline Miss Rate**
- **Current State**: 32% of students miss at least one deadline per semester (based on survey)
- **Target**: Reduce to ≤ 10% within one semester of use
- **Measure**: Count of late submissions / total submissions × 100
- **Timeline**: End of Sprint 8 (Week 16)

**BO-02: Reduce Instructor Administrative Workload**
- **Current State**: Instructors spend avg. 4.5 hours/week on repetitive communication (Q&A, deadline reminders)
- **Target**: Reduce to ≤ 1.5 hours/week
- **Measure**: Self-reported time survey before/after
- **Timeline**: 1 month post-launch

**BO-03: Increase Student Engagement with Course Materials**
- **Current State**: 45% of students report never reading full lecture slides
- **Target**: ≥ 70% students use AI at least 3× per week to query course materials
- **Measure**: AI conversation count per user per week (from ai_usage_logs table)
- **Timeline**: End of semester 1 of deployment

**BO-04: Provide 24/7 Academic Support**
- **Current State**: Support only available Mon-Fri 8am-5pm (instructors)
- **Target**: AI handles ≥ 80% of after-hours academic questions without escalation
- **Measure**: % conversations with no subsequent instructor contact within 2 hours
- **Timeline**: From launch

**BO-05: Zero-Downtime Grade Delivery**
- **Current State**: Grade posting is manual, often delayed 3-7 days, no notification
- **Target**: Grade notification delivered to student within 60 seconds of instructor saving
- **Measure**: Timestamp difference between grade INSERT and notification email sent
- **Timeline**: From Sprint 5

### 5.2 Key Performance Indicators (KPIs)

#### User Adoption KPIs

| KPI | Formula | Baseline | Target (Week 16) | Data Source |
|---|---|---|---|---|
| Monthly Active Users (MAU) | Users with ≥1 login in 30 days | 0 | ≥ 80% of registered | users.last_login |
| AI Conversation Rate | Users with ≥1 conversation / MAU | 0 | ≥ 60% | conversations table |
| Daily Active Users (DAU) | Unique logins per day | 0 | ≥ 40% of MAU | auth_logs |
| Feature Adoption: Submission | Submissions via platform / total expected | 0% | ≥ 95% | submissions table |
| Feature Adoption: AI Memory | Conversations > 1 per user | 0% | ≥ 50% | memories table |

#### Quality KPIs

| KPI | Formula | Target | Data Source |
|---|---|---|---|
| Late Submission Rate | late submissions / total submissions | ≤ 10% | submissions.is_late |
| Grade Return Time | avg(grade.created_at - submission.submitted_at) | ≤ 48h | grades table |
| AI Response Accuracy | Correct answers / total rated answers | ≥ 85% | (user rating, Phase 2) |
| Notification Delivery Rate | Delivered / sent | ≥ 99% | email_logs table |
| System Uptime | Uptime hours / total hours | ≥ 99.5% | Railway metrics |

#### Efficiency KPIs

| KPI | Formula | Target | Data Source |
|---|---|---|---|
| Avg. Time to Submit Assignment | Click assignment → confirmation | ≤ 3 min | frontend analytics |
| Avg. AI Response Time | SSE first token | ≤ 2 sec | ai_usage_logs |
| Page Load Time (P95) | Core Web Vitals LCP | ≤ 2.5 sec | Lighthouse |
| AI Cost Per Conversation | total_tokens × price / conversations | ≤ $0.05 | ai_usage_logs |

### 5.3 Success Milestones

| Milestone | Sprint | Criteria |
|---|---|---|
| MVP Auth + Courses | Sprint 2 | Login, course creation, enrollment work end-to-end |
| Assignment Lifecycle | Sprint 4 | Create, submit, grade flow complete with notifications |
| AI Chat Basic | Sprint 5 | AI responds with LMS data (no memory yet) |
| Memory + RAG | Sprint 6 | Memory persists across sessions, RAG finds course docs |
| Proactive Features | Sprint 7 | Weekly digest email delivered to test users |
| Production Launch | Sprint 8 | All features stable, deployed to Railway |

---

## 6. Business Requirements

Business requirements describe WHAT the system must do from a business perspective, without specifying HOW. Each BR maps to one or more features in the PRD.

### 6.1 Authentication & Identity

| ID | Business Requirement | Priority | PRD Feature |
|---|---|---|---|
| BR-BIZ-001 | The system must securely authenticate university members (students and instructors) using email and password | Must | F-AUTH-001 |
| BR-BIZ-002 | Users must remain authenticated for a reasonable session duration without repeatedly re-entering credentials | Must | F-AUTH-002 |
| BR-BIZ-003 | Users who forget their password must be able to recover access via their registered email | Must | F-AUTH-003 |
| BR-BIZ-004 | Administrators must be able to create accounts for new users (batch registration for new semester) | Must | F-AUTH-005 |
| BR-BIZ-005 | Administrators must be able to disable accounts of departed students or instructors | Must | F-AUTH-006 |
| BR-BIZ-006 | The system must distinguish between student, instructor, and administrator roles with different access rights | Must | F-AUTH-007 |

### 6.2 Course Management

| ID | Business Requirement | Priority | PRD Feature |
|---|---|---|---|
| BR-BIZ-007 | Instructors must be able to create courses that students can enroll in | Must | F-COURSE-001 |
| BR-BIZ-008 | Courses must support descriptive content so students understand the subject matter | Must | F-COURSE-002 |
| BR-BIZ-009 | Students must be able to self-enroll in available courses using an enrollment code | Must | F-COURSE-003 |
| BR-BIZ-010 | Instructors must be able to upload course documents (slides, PDFs) for student reference | Must | F-COURSE-005 |
| BR-BIZ-011 | Instructors must be able to communicate announcements to all enrolled students | Should | F-COURSE-007 |
| BR-BIZ-012 | Instructors must be able to remove students who drop the course | Should | F-COURSE-004 |

### 6.3 Assignment & Submission Management

| ID | Business Requirement | Priority | PRD Feature |
|---|---|---|---|
| BR-BIZ-013 | Instructors must be able to create assignments with clear titles, descriptions, deadlines, and point values | Must | F-ASSIGN-001 |
| BR-BIZ-014 | Instructors must be able to control when assignments are visible to students (draft vs published) | Must | F-ASSIGN-002 |
| BR-BIZ-015 | Students must be able to submit assignments online (file or text), eliminating email submissions | Must | F-ASSIGN-004 |
| BR-BIZ-016 | The system must clearly indicate to students when they have/haven't submitted an assignment | Must | F-ASSIGN-006 |
| BR-BIZ-017 | The system must record whether a submission was submitted on time or late | Must | F-ASSIGN-007 |
| BR-BIZ-018 | Students must receive a confirmation that their submission was received | Must | F-ASSIGN-008 |
| BR-BIZ-019 | Instructors must be able to view all student submissions for an assignment in one place | Must | F-ASSIGN-009 |
| BR-BIZ-020 | Instructors must be able to download submitted files for offline review | Must | F-ASSIGN-010 |
| BR-BIZ-021 | Instructors may grant deadline extensions to specific students when circumstances warrant | Should | F-ASSIGN-003 |

### 6.4 Grading

| ID | Business Requirement | Priority | PRD Feature |
|---|---|---|---|
| BR-BIZ-022 | Instructors must be able to assign numeric grades and written feedback to submissions | Must | F-GRADE-001 |
| BR-BIZ-023 | Students must be notified immediately when their grade is available | Must | F-GRADE-002 |
| BR-BIZ-024 | Students must be able to view all their grades in a single grade book | Must | F-GRADE-003 |
| BR-BIZ-025 | The system must calculate and display a GPA or weighted course average for students | Should | F-GRADE-004 |
| BR-BIZ-026 | Instructors must be able to correct a grade entry after initial submission | Should | F-GRADE-005 |

### 6.5 Notifications & Communication

| ID | Business Requirement | Priority | PRD Feature |
|---|---|---|---|
| BR-BIZ-027 | Students must receive automated reminders before assignment deadlines | Must | F-NOTIF-001 |
| BR-BIZ-028 | All users must receive in-app notifications for relevant system events | Must | F-NOTIF-002 |
| BR-BIZ-029 | Users must be able to view a list of past notifications and mark them as read | Should | F-NOTIF-003 |
| BR-BIZ-030 | Users must be able to control which notifications they receive | Could | F-NOTIF-004 |

### 6.6 AI Agent — Core

| ID | Business Requirement | Priority | PRD Feature |
|---|---|---|---|
| BR-BIZ-031 | Students must be able to have natural-language conversations with an AI assistant in Vietnamese | Must | F-AI-001 |
| BR-BIZ-032 | The AI must be able to answer questions using the student's actual course data (assignments, grades) | Must | F-AI-002 |
| BR-BIZ-033 | The AI must stream responses token-by-token rather than requiring a full wait | Should | F-AI-003 |
| BR-BIZ-034 | The AI must be able to search course documents uploaded by instructors to answer content questions | Should | F-AI-004 |
| BR-BIZ-035 | Students must be able to manage their conversation history (view, delete) | Should | F-AI-005 |

### 6.7 AI Agent — Memory

| ID | Business Requirement | Priority | PRD Feature |
|---|---|---|---|
| BR-BIZ-036 | The AI must remember important facts from past conversations without requiring re-explanation | Must | F-MEM-001 |
| BR-BIZ-037 | Students must be able to view what information the AI has stored about them | Should | F-MEM-002 |
| BR-BIZ-038 | Students must be able to delete specific memories or all memories | Should | F-MEM-003 |

### 6.8 Proactive AI Features

| ID | Business Requirement | Priority | PRD Feature |
|---|---|---|---|
| BR-BIZ-039 | The system must automatically send weekly academic summaries to students (upcoming deadlines, grade summary) | Should | F-PRO-001 |
| BR-BIZ-040 | Proactive digests must be generated per-student based on their actual enrolled courses and grades | Should | F-PRO-002 |

### 6.9 Administration

| ID | Business Requirement | Priority | PRD Feature |
|---|---|---|---|
| BR-BIZ-041 | Administrators must have a dashboard showing system-wide statistics (users, courses, AI usage) | Should | F-ADMIN-001 |
| BR-BIZ-042 | Administrators must be able to monitor AI API costs to prevent budget overruns | Should | F-ADMIN-002 |
| BR-BIZ-043 | Administrators must be able to manage all user accounts from a central interface | Must | F-ADMIN-003 |

---

## 7. Business Rules

Business rules are constraints the system must enforce regardless of user actions. They encode policies, regulations, and domain logic.

### 7.1 Enrollment Rules

| ID | Rule | Enforcement | Rationale |
|---|---|---|---|
| BBR-001 | A student may not enroll in the same course twice | Database unique constraint + API validation | Prevent duplicate grade records |
| BBR-002 | A student may only enroll using a valid, active enrollment code | Server-side code validation | Control course access |
| BBR-003 | An instructor may not enroll as a student in their own course | Role + ownership check | Conflict of interest prevention |
| BBR-004 | An admin can enroll any user in any course regardless of enrollment code | Override for admin role | Admin onboarding capability |

### 7.2 Assignment Rules

| ID | Rule | Enforcement | Rationale |
|---|---|---|---|
| BBR-005 | An assignment cannot be published if it has no title, no deadline, and no point value | Pre-publish validation | Ensure complete information for students |
| BBR-006 | Once an assignment is published and a student has viewed it, the deadline cannot be moved earlier | Server-side check | Protect students' planning |
| BBR-007 | A student may only submit to assignments in courses they are enrolled in | Enrollment check in submission API | Data isolation |
| BBR-008 | A student may only have one submission per assignment (re-submission overwrites if before deadline) | Upsert logic | Prevent grade ambiguity |
| BBR-009 | A student may not submit after the deadline unless they have an active extension | Extension check in submission API | Academic integrity |
| BBR-010 | Extensions may only be granted by the course instructor (not another instructor) | Ownership check | Role boundary |

### 7.3 Grading Rules

| ID | Rule | Enforcement | Rationale |
|---|---|---|---|
| BBR-011 | A grade score cannot exceed the assignment's max_points | API validation (0 ≤ score ≤ max_points) | Data accuracy |
| BBR-012 | A grade can only be entered once a submission exists | Submission FK check | Cannot grade what wasn't submitted |
| BBR-013 | A student cannot see their grade until the instructor explicitly releases it | is_released flag in grade record | Instructor batch release workflow |
| BBR-014 | GPA calculation uses the weight formula: Σ(score/max_points × weight) / Σ(weight) | DB function `calculate_course_gpa()` | Consistent grade calculation |
| BBR-015 | An instructor may update a grade after release, but student is notified of the change | Update trigger | Transparency |

### 7.4 Notification Rules

| ID | Rule | Enforcement | Rationale |
|---|---|---|---|
| BBR-016 | Deadline reminder emails are sent at exactly T-48h and T-24h from the effective deadline | Celery beat schedule checking submissions | Timely reminders without flood |
| BBR-017 | No reminder is sent if the student has already submitted | Pre-send submission check | Avoid unnecessary noise |
| BBR-018 | No reminder is sent if the user has disabled that notification type in preferences | Preferences check before send | User control |
| BBR-019 | Email notifications use the Resend API; failures are logged and retried up to 3 times | Celery retry policy | Reliability |

### 7.5 AI / Memory Rules

| ID | Rule | Enforcement | Rationale |
|---|---|---|---|
| BBR-020 | AI memories are scoped per user; no user can access another user's memories | user_id FK on all memory operations | Privacy isolation |
| BBR-021 | AI conversations are scoped per user; no cross-user conversation access | Conversation ownership check in API | Privacy isolation |
| BBR-022 | The AI may only access LMS data for the authenticated user's own records (not other students' grades) | Internal tools API uses auth context | Privacy by design |
| BBR-023 | AI usage (tokens consumed) is logged per conversation message | Post-message hook in agent runtime | Cost accountability |
| BBR-024 | Weekly digest generation uses only the user's own data | Celery task receives user_id, queries scoped | Privacy |
| BBR-025 | If the primary LLM (Anthropic) is unavailable, the system falls back to OpenAI automatically | Try/except with fallback in agent runtime | Availability |

### 7.6 Data Retention Rules

| ID | Rule | Enforcement | Rationale |
|---|---|---|---|
| BBR-026 | Password reset tokens expire after 1 hour | Expiry check in API | Security |
| BBR-027 | Access tokens expire after 15 minutes | JWT exp claim | Security |
| BBR-028 | Refresh tokens expire after 7 days | Token TTL, rotation on use | Balance security/UX |
| BBR-029 | Email logs are retained for 90 days | Scheduled cleanup task | Storage management |
| BBR-030 | Submitted files are stored in server filesystem and accessible only via signed URL valid for 1 hour | File path not exposed, signed URL generation | Security |

---

## 8. Functional Scope

### 8.1 In-Scope Features

The following capability areas are in scope for the initial release (Sprint 1-8):

```
MODULE 1: Authentication & User Management
  ├── Email/password registration and login
  ├── JWT access token + refresh token (httpOnly cookie)
  ├── Forgot/reset password via Resend email
  ├── Change password (authenticated)
  ├── User profile management (name, avatar)
  └── Admin: create, list, lock/unlock users

MODULE 2: Course Management
  ├── Instructor: CRUD courses
  ├── Enrollment code generation
  ├── Student: enroll/drop with code
  ├── Instructor: view/remove enrolled students
  ├── Course: upload documents (PDF, DOCX, TXT) for RAG
  └── Instructor: post announcements

MODULE 3: Assignment Management
  ├── Instructor: CRUD assignments (draft/published/closed)
  ├── Instructor: grant per-student deadline extensions
  ├── Student: view all assignments per course
  ├── Student: submit (file attachment and/or text)
  ├── System: mark late submissions
  └── Instructor: view all submissions, download files

MODULE 4: Grading
  ├── Instructor: enter/edit grade + feedback per submission
  ├── System: send grade notification on release
  ├── Student: view grade book (all grades)
  └── System: calculate weighted course GPA

MODULE 5: Notifications
  ├── In-app notification center
  ├── Email notifications (grade, assignment, deadline, announcement)
  ├── Automated deadline reminders (T-48h, T-24h)
  └── User notification preferences

MODULE 6: AI Agent — Core
  ├── Conversational chat interface (SSE streaming)
  ├── Conversation history management
  ├── LMS data tools (grades, assignments, course info)
  └── LLM fallback (Anthropic → OpenAI)

MODULE 7: AI Agent — Memory
  ├── Mem0 memory extraction from conversations
  ├── Memory injection into AI context
  ├── Student: view memories
  └── Student: delete individual or all memories

MODULE 8: AI Agent — RAG
  ├── Document indexing via Celery (background)
  ├── Semantic search (pgvector cosine similarity)
  └── RAG-augmented AI answers with source citation

MODULE 9: Proactive Features
  ├── Weekly digest email (AI-generated per student)
  └── Announcement push notification

MODULE 10: Administration
  ├── Admin dashboard (user count, course count, AI cost)
  ├── User management panel
  └── AI usage cost tracking per user
```

### 8.2 Feature Priority Matrix

| Feature | Business Value | Implementation Effort | Priority |
|---|---|---|---|
| Auth (login/register/JWT) | Critical | Low | P0 - Sprint 1 |
| Course CRUD | Critical | Low | P0 - Sprint 2 |
| Assignment CRUD + submission | Critical | Medium | P0 - Sprint 3 |
| Grading + notifications | Critical | Medium | P0 - Sprint 4 |
| AI Chat basic (no memory) | High | High | P0 - Sprint 5 |
| Memory (Mem0 integration) | High | High | P0 - Sprint 6 |
| RAG (document search) | High | High | P1 - Sprint 6 |
| Deadline reminders (Celery) | High | Medium | P0 - Sprint 4 |
| Weekly digest email | Medium | Medium | P1 - Sprint 7 |
| Admin dashboard | Medium | Low | P1 - Sprint 7 |
| Notification preferences | Medium | Low | P1 - Sprint 7 |
| Avatar upload | Low | Low | P2 - Sprint 8 |
| File download signed URL | Medium | Low | P1 - Sprint 5 |

---

## 9. Out of Scope

The following are explicitly NOT included in the v1.0 release:

### 9.1 Features Excluded from v1.0

| Item | Reason Excluded | Potential Future Version |
|---|---|---|
| Mobile native app (iOS/Android) | Scope, responsive web covers mobile | v2.0 |
| Video content hosting/streaming | Infrastructure cost, scope | v2.0 |
| Real-time collaborative documents | Complexity (WebRTC/CRDTs) | v2.0 |
| Plagiarism detection | Third-party integration cost | v2.0 |
| LTI integration (with other LMS) | Not needed for greenfield | v3.0 |
| AI grading / auto-scoring | Academic integrity policy concerns | Requires policy approval |
| Student-to-student messaging | Scope | v2.0 |
| Course marketplace / payments | Not applicable for university | Out of roadmap |
| SSO / SAML integration | University IdP integration complexity | v2.0 if required |
| Multi-language UI (English) | Vietnamese-first, scope | v2.0 |
| Offline mode / PWA | Service worker complexity | v2.0 |
| Grade appeal workflow | Process not yet defined | Post-launch |
| AI content moderation | Not prioritized, low risk in closed system | v2.0 |
| Parent/guardian portal | Not applicable (university, adults) | N/A |
| Attendance tracking | Separate system concern | N/A |

### 9.2 Data Explicitly Excluded

- Historical data migration from Moodle (clean start)
- Student academic records from previous systems
- Financial/tuition data

---

## 10. Constraints & Assumptions

### 10.1 Business Constraints

| ID | Constraint | Impact | Mitigation |
|---|---|---|---|
| CON-001 | Development timeline: 16 weeks (8 sprints × 2 weeks) | Strict feature prioritization required | P0 only in first 6 sprints |
| CON-002 | Development team: capstone team (3-5 developers, students) | Limited bandwidth | Clear sprint scope, no scope creep |
| CON-003 | Budget: University project budget (limited) | Must use free tiers where possible | Railway, Resend free tier; pgvector open-source |
| CON-004 | No dedicated DevOps engineer | CI/CD must be simple and self-documenting | GitHub Actions with documented runbook |
| CON-005 | Must use Anthropic Claude API (project requirement) | AI vendor locked for LLM calls | OpenAI fallback designed in architecture |

### 10.2 Technical Constraints

| ID | Constraint | Impact |
|---|---|---|
| CON-006 | Database: PostgreSQL only (pgvector extension required) | No MongoDB, no separate vector DB |
| CON-007 | Deployment: Railway (chosen platform) | Must fit Railway's service model |
| CON-008 | File storage: Server local filesystem (Phase 1) | Not S3; files lost on container restart → use Docker volume |
| CON-009 | No CDN for static assets (Phase 1) | Next.js serves static files directly |

### 10.3 Assumptions

| ID | Assumption | If Wrong |
|---|---|---|
| ASM-001 | Users have reliable internet access (university campus WiFi) | Offline mode out of scope anyway |
| ASM-002 | Anthropic API is available during business hours | Fallback to OpenAI is implemented |
| ASM-003 | University users will be onboarded by admin (no self-serve student registration) | Registration is open by default; admin can lock |
| ASM-004 | Course documents are already in digital format (PDF/DOCX) | Physical document scanning is out of scope |
| ASM-005 | Email delivery via Resend will reach university email domains | University IT must whitelist Resend sender domain |
| ASM-006 | Students trust the AI with their academic data | Privacy notice on first login |
| ASM-007 | Instructors will invest 15-30 minutes to upload course materials | Onboarding guide + drag-and-drop UI |
| ASM-008 | Railway free tier is sufficient for pilot (< 100 concurrent users) | Upgrade to paid if needed post-pilot |

---

## 11. Risk Analysis

### 11.1 Risk Register

#### Technical Risks

| ID | Risk | Probability | Impact | Severity | Mitigation | Owner |
|---|---|---|---|---|---|---|
| RISK-T01 | Anthropic API outage during peak usage | Low | High | Medium | OpenAI fallback with tenacity retry; user-facing error message | Dev Team |
| RISK-T02 | pgvector performance degradation with large document corpus (> 10,000 chunks) | Low | Medium | Low | IVFFlat index with lists=100; can upgrade to HNSW if needed | Dev Team |
| RISK-T03 | File storage loss if Docker volume not persisted on Railway | Medium | High | High | Configure Railway volume mount; weekly backup script | Dev Team |
| RISK-T04 | Mem0 API changes breaking memory integration | Low | Medium | Low | Pin Mem0 version; monitor changelogs | Dev Team |
| RISK-T05 | SSE connection drops on long AI responses | Medium | Low | Low | Client-side reconnect logic; 30s keep-alive ping | Dev Team |
| RISK-T06 | JWT secret key rotation causing mass logout | Low | High | Medium | Document key rotation procedure; warn admin before rotation | Admin |

#### Business Risks

| ID | Risk | Probability | Impact | Severity | Mitigation | Owner |
|---|---|---|---|---|---|---|
| RISK-B01 | Low instructor adoption (won't upload documents) | Medium | Medium | Medium | Onboarding workshop; show AI capability demo | Project Lead |
| RISK-B02 | Students share AI responses as their own work | High | Medium | Medium | AI watermarks responses; academic integrity notice | Stakeholders |
| RISK-B03 | AI gives incorrect academic advice | Medium | High | High | AI cites sources; disclaimer on AI responses | Dev Team |
| RISK-B04 | API cost overrun (students abuse AI) | Medium | Medium | Medium | Rate limiting (20 req/min, 200/day); admin cost monitoring | Admin |
| RISK-B05 | Student data privacy complaint | Low | High | High | Privacy policy; data deletion capability; no PII in memories | Legal |

#### Schedule Risks

| ID | Risk | Probability | Impact | Severity | Mitigation |
|---|---|---|---|---|---|
| RISK-S01 | LangGraph complexity delays AI sprint | Medium | High | High | Spike in Sprint 1; fallback to simple API call if LangGraph too complex |
| RISK-S02 | Railway deployment issues delay testing | Low | Medium | Low | Local Docker Compose always works; Railway is supplementary |
| RISK-S03 | Exam period reduces team velocity | High | Medium | Medium | No sprints during exam period; plan around academic calendar |

### 11.2 Risk Response Summary

```
RISK RESPONSE MATRIX:
┌──────────────┬────────────────────────────────────────────────┐
│ RISK-T03     │ HIGHEST PRIORITY: File storage loss            │
│ (File loss)  │ → Configure Railway volume DAY 1               │
│              │ → Weekly backup cron job                       │
├──────────────┼────────────────────────────────────────────────┤
│ RISK-B03     │ HIGH PRIORITY: AI incorrect advice             │
│ (AI accuracy)│ → Add disclaimer to every AI response          │
│              │ → RAG cites document + page                    │
│              │ → AI trained to say "Tôi không chắc, hãy hỏi  │
│              │   giảng viên" when confidence is low           │
├──────────────┼────────────────────────────────────────────────┤
│ RISK-S01     │ HIGH PRIORITY: LangGraph complexity            │
│ (AI delay)   │ → Week 1: LangGraph proof-of-concept spike     │
│              │ → If fails: simple Claude API call is fallback │
└──────────────┴────────────────────────────────────────────────┘
```

---

## 12. ROI & Business Case

### 12.1 Cost-Benefit Analysis

#### Estimated Costs (Annual)

| Cost Item | Estimate | Notes |
|---|---|---|
| Anthropic Claude API | $50-200/month ($600-2,400/yr) | Based on 100 students × 10 conv/week × 1,000 tokens avg |
| Railway hosting | $20-50/month ($240-600/yr) | Scales with usage |
| Resend email | $0/month (free tier) | < 3,000 emails/month |
| Development (one-time) | Capstone = $0 | Student project |
| **Total Annual OpEx** | **$840-3,000/year** | |

#### Estimated Benefits (Annual, 100-student pilot)

| Benefit | Calculation | Value |
|---|---|---|
| Instructor time saved | 3 hr/week × 52 weeks × 5 instructors × $25/hr | $19,500/yr |
| Reduced IT helpdesk tickets | 50% of LMS-related tickets × 30 min avg × $20/hr | $2,600/yr |
| Improved grade submission rate | 22% fewer late submissions → less admin processing | $1,500/yr |
| **Total Annual Benefit** | | **$23,600/yr** |

#### ROI Calculation

```
ROI = (Annual Benefits - Annual Costs) / Annual Costs × 100
ROI = ($23,600 - $1,920) / $1,920 × 100 = 1,129%
Payback period: < 1 month
```

*Note: Development cost is $0 as a capstone project; post-graduation maintenance would add $5,000-15,000/yr for a developer.*

### 12.2 Intangible Benefits

- **Student satisfaction**: 24/7 support availability without instructor burden
- **Institutional reputation**: First university in region with LMS + persistent AI agent
- **Research value**: Usage data can be published as educational technology research
- **Scalability**: Architecture supports 10× growth without redesign
- **Competitive positioning**: Differentiates from universities using Moodle only

### 12.3 Break-Even Analysis

```
At 100 students:   Cost = $1,920/yr | Benefit = $23,600/yr → ROI = 1,129%
At 500 students:   Cost = $5,400/yr | Benefit = $58,000/yr → ROI =  974%
At 1,000 students: Cost = $9,600/yr | Benefit = $97,500/yr → ROI =  915%
```

The system is economically justified at any scale above 20 users.

---

## 13. Compliance & Regulatory Requirements

### 13.1 Data Privacy

| Requirement | How Addressed |
|---|---|
| Vietnamese Personal Data Protection Decree (Decree 13/2023/NĐ-CP) | Consent notice on registration; data deletion endpoint |
| Data minimization | Only collect name, email, role; no phone/address required |
| Right to erasure | User can delete memories; admin can delete account |
| Data breach notification | Incident response plan in DEPLOYMENT.md |
| Data locality | Railway can be configured to deploy in Singapore (nearest to Vietnam) |

### 13.2 Security Requirements

| Requirement | Implementation |
|---|---|
| Password storage | bcrypt cost factor 12 (OWASP recommended minimum) |
| Transport security | HTTPS everywhere via Caddy + Let's Encrypt |
| SQL injection prevention | SQLAlchemy ORM with parameterized queries only |
| XSS prevention | Next.js React (auto-escaping), Content-Security-Policy header |
| CSRF prevention | SameSite=Strict cookies for refresh token |
| Rate limiting | Redis-backed rate limiter on all API endpoints |
| API key security | All secrets in environment variables, never in code/git |

### 13.3 Academic Integrity

| Requirement | Implementation |
|---|---|
| AI transparency | Every AI response includes disclaimer: "Được hỗ trợ bởi AI - có thể có sai sót" |
| No AI auto-grading | All grades require instructor action (no automated grade insertion) |
| Submission integrity | One submission per student per assignment; overwrites tracked |
| Audit trail | All grade changes logged with timestamp and editor |

### 13.4 Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|---|---|
| Color contrast | AA ratio (4.5:1) for all text on background |
| Keyboard navigation | All interactive elements keyboard-accessible |
| Screen reader | Semantic HTML, ARIA labels on icons and interactive elements |
| Font sizing | Minimum 16px body, rem-based scaling |
| Focus indicators | Visible focus ring on all focusable elements |

---

## 14. Approval & Sign-Off

### 14.1 Document History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-01-15 | Team AI20K-015 | Initial draft |
| 2.0 | 2026-04-27 | Team AI20K-015 | Comprehensive expansion: stakeholder analysis, ROI, full business rules, competitive analysis |

### 14.2 Document Approvals

| Role | Name | Signature | Date |
|---|---|---|---|
| Project Lead | [Team Leader Name] | ____________ | ________ |
| Technical Lead | [Tech Lead Name] | ____________ | ________ |
| Academic Supervisor | [Supervisor Name] | ____________ | ________ |
| Department Head | [Dept Head Name] | ____________ | ________ |

### 14.3 Review Checklist

- [x] All business objectives have measurable KPIs
- [x] All stakeholders identified and engagement strategy defined
- [x] All business rules traceable to technical implementation
- [x] Scope clearly defines what is and isn't included
- [x] Risk register covers technical, business, and schedule risks
- [x] ROI calculation documented
- [x] Compliance requirements addressed
- [x] All functional requirements mapped to PRD features
- [ ] Stakeholder sign-offs collected (pending)

---

*This BRD is a living document. Major scope changes require stakeholder re-approval. Minor clarifications can be incorporated with version note and author signature.*

*Document Owner: Team AI20K-015 | Next Review: End of Sprint 4 (Week 8)*
