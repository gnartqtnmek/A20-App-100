from __future__ import annotations

import asyncio
from datetime import datetime, timedelta

from sqlalchemy import delete, select

from app.core.roles import UserRole
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import (
    AdvisorStudent,
    Announcement,
    Assignment,
    AttendanceRecord,
    AttendanceSession,
    ConsultationRecord,
    Course,
    CourseSection,
    CurriculumEntry,
    Department,
    Enrollment,
    Grade,
    GradeApproval,
    Lesson,
    LecturerAssignment,
    Notification,
    Permission,
    Program,
    Quiz,
    QuizAttempt,
    QuizQuestion,
    RiskAlert,
    Role,
    RolePermission,
    Semester,
    StudyPlan,
    Submission,
    SupportRequest,
    User,
    UserRoleLink,
)

ROLE_SEED = [
    (UserRole.STUDENT, "Student"),
    (UserRole.LECTURER, "Lecturer"),
    (UserRole.ADMIN, "Admin"),
    (UserRole.ACADEMIC_STAFF, "Academic Staff"),
    (UserRole.ADVISOR, "Advisor"),
]

PERMISSION_SEED = [
    ("users.read", "Read users", "users"),
    ("users.create", "Create users", "users"),
    ("users.update", "Update users", "users"),
    ("users.delete", "Delete users", "users"),
    ("profile.read", "Read own profile", "profile"),
    ("profile.update", "Update own profile", "profile"),
    ("courses.read", "Read courses", "courses"),
    ("sections.read", "Read course sections", "courses"),
]

ROLE_PERMISSION_MATRIX = {
    UserRole.ADMIN: {"users.read", "users.create", "users.update", "users.delete", "profile.read", "profile.update", "courses.read", "sections.read"},
    UserRole.ACADEMIC_STAFF: {"users.read", "profile.read", "profile.update", "courses.read", "sections.read"},
    UserRole.LECTURER: {"profile.read", "profile.update", "courses.read", "sections.read"},
    UserRole.ADVISOR: {"profile.read", "profile.update", "courses.read", "sections.read"},
    UserRole.STUDENT: {"profile.read", "profile.update", "courses.read", "sections.read"},
}

DEMO_USERS = [
    ("student@brainio.edu", "Demo Student", UserRole.STUDENT),
    ("lecturer@brainio.edu", "Demo Lecturer", UserRole.LECTURER),
    ("admin@brainio.edu", "Demo Admin", UserRole.ADMIN),
    ("staff@brainio.edu", "Demo Academic Staff", UserRole.ACADEMIC_STAFF),
    ("advisor@brainio.edu", "Demo Advisor", UserRole.ADVISOR),
]


async def run_seed() -> None:
    async with SessionLocal() as db:
        roles = await _seed_roles(db)
        permissions = await _seed_permissions(db)
        await _seed_role_permissions(db, roles, permissions)
        department, program = await _seed_department_program(db)
        users = await _seed_users(db, department.id, program.id)
        await _seed_user_roles(db, users, roles)
        section, assignment, quiz = await _seed_courses_and_sections(db, department.id, program.id, users)
        await _seed_learning_data(db, section.id, assignment.id, quiz.id, users)
        await _seed_sprint67_data(db, department.id, program.id, section.id, users)
        await db.commit()


async def _seed_roles(db):
    role_map: dict[UserRole, Role] = {}
    for role_code, role_name in ROLE_SEED:
        role = await db.scalar(select(Role).where(Role.code == role_code.value))
        if not role:
            role = Role(code=role_code.value, name=role_name, description=f"{role_name} role")
            db.add(role)
            await db.flush()
        role_map[role_code] = role
    return role_map


async def _seed_permissions(db):
    permission_map: dict[str, Permission] = {}
    for code, name, module in PERMISSION_SEED:
        permission = await db.scalar(select(Permission).where(Permission.code == code))
        if not permission:
            permission = Permission(code=code, name=name, module=module, description=f"{name} permission")
            db.add(permission)
            await db.flush()
        permission_map[code] = permission
    return permission_map


async def _seed_role_permissions(db, roles: dict[UserRole, Role], permissions: dict[str, Permission]) -> None:
    await db.execute(delete(RolePermission))
    await db.flush()
    for role_code, permission_codes in ROLE_PERMISSION_MATRIX.items():
        for permission_code in permission_codes:
            link = RolePermission(role_id=roles[role_code].id, permission_id=permissions[permission_code].id)
            db.add(link)
    await db.flush()


async def _seed_department_program(db):
    department = await db.scalar(select(Department).where(Department.code == "CSE"))
    if not department:
        department = Department(code="CSE", name="Computer Science and Engineering", description="Brainio CSE Faculty")
        db.add(department)
        await db.flush()

    program = await db.scalar(select(Program).where(Program.code == "SE2026"))
    if not program:
        program = Program(
            code="SE2026",
            name="Software Engineering 2026",
            department_id=department.id,
            total_credits=140,
        )
        db.add(program)
        await db.flush()

    extra_department = await db.scalar(select(Department).where(Department.code == "BUS"))
    if not extra_department:
        extra_department = Department(code="BUS", name="Business Administration", description="Brainio Business Faculty")
        db.add(extra_department)
        await db.flush()

    extra_program = await db.scalar(select(Program).where(Program.code == "BA2026"))
    if not extra_program:
        extra_program = Program(
            code="BA2026",
            name="Business Analytics 2026",
            department_id=extra_department.id,
            total_credits=130,
        )
        db.add(extra_program)
        await db.flush()
    return department, program


async def _seed_users(db, department_id: str, program_id: str):
    user_map: dict[UserRole, User] = {}
    for email, full_name, role in DEMO_USERS:
        user = await db.scalar(select(User).where(User.email == email))
        if not user:
            user = User(
                email=email,
                full_name=full_name,
                password_hash=hash_password("Brainio@123"),
                role=role.value,
                department_id=department_id,
                program_id=program_id,
                is_active=True,
            )
            db.add(user)
            await db.flush()
        else:
            user.full_name = full_name
            user.role = role.value
            user.department_id = department_id
            user.program_id = program_id
            user.is_active = True
            if not user.password_hash:
                user.password_hash = hash_password("Brainio@123")
        user_map[role] = user
    return user_map


async def _seed_user_roles(db, users: dict[UserRole, User], roles: dict[UserRole, Role]) -> None:
    await db.execute(delete(UserRoleLink))
    await db.flush()
    for role_code, user in users.items():
        db.add(UserRoleLink(user_id=user.id, role_id=roles[role_code].id))
    await db.flush()


async def _seed_courses_and_sections(
    db, department_id: str, program_id: str, users: dict[UserRole, User]
) -> tuple[CourseSection, Assignment, Quiz]:
    course = await db.scalar(select(Course).where(Course.code == "SE401"))
    if not course:
        course = Course(
            code="SE401",
            name="Modern LMS Architecture",
            department_id=department_id,
            credits=3,
            description="Core LMS architecture, workflows, and quality assurance.",
        )
        db.add(course)
        await db.flush()

    section = await db.scalar(select(CourseSection).where(CourseSection.code == "SE401-01"))
    if not section:
        section = CourseSection(
            course_id=course.id,
            lecturer_id=users[UserRole.LECTURER].id,
            code="SE401-01",
            semester="2026A",
            max_students=60,
            status="open",
        )
        db.add(section)
        await db.flush()

    enrollment = await db.scalar(
        select(Enrollment).where(
            Enrollment.section_id == section.id,
            Enrollment.student_id == users[UserRole.STUDENT].id,
        )
    )
    if not enrollment:
        db.add(
            Enrollment(
                student_id=users[UserRole.STUDENT].id,
                section_id=section.id,
                enrollment_status="active",
            )
        )
        await db.flush()

    lesson = await db.scalar(select(Lesson).where(Lesson.section_id == section.id, Lesson.title == "Sprint Kickoff: Learning Plan"))
    if not lesson:
        db.add(
            Lesson(
                section_id=section.id,
                title="Sprint Kickoff: Learning Plan",
                content="Understand Brainio LMS architecture and sprint execution workflow.",
                order_index=1,
                is_published=True,
            )
        )
        await db.flush()

    assignment = await db.scalar(
        select(Assignment).where(Assignment.section_id == section.id, Assignment.title == "Architecture Reflection")
    )
    if not assignment:
        assignment = Assignment(
            section_id=section.id,
            title="Architecture Reflection",
            description="Submit a short reflection on LMS architecture decisions and tradeoffs.",
            max_score=10.0,
        )
        db.add(assignment)
        await db.flush()

    quiz = await db.scalar(select(Quiz).where(Quiz.section_id == section.id, Quiz.title == "LMS Fundamentals Quiz"))
    if not quiz:
        quiz = Quiz(
            section_id=section.id,
            title="LMS Fundamentals Quiz",
            duration_minutes=20,
            max_score=10.0,
            is_published=True,
        )
        db.add(quiz)
        await db.flush()

    existing_questions = await db.scalar(select(QuizQuestion).where(QuizQuestion.quiz_id == quiz.id))
    if not existing_questions:
        db.add(
            QuizQuestion(
                quiz_id=quiz.id,
                prompt="Which role can grade submissions directly in Sprint 5?",
                options=["student", "lecturer", "advisor", "academic_staff"],
                correct_answer="lecturer",
                points=1.0,
                order_index=1,
            )
        )
        await db.flush()

    extra_course = await db.scalar(select(Course).where(Course.code == "SE402"))
    if not extra_course:
        extra_course = Course(
            code="SE402",
            name="Learning Analytics",
            department_id=department_id,
            credits=3,
            description="Data-informed student support and retention.",
        )
        db.add(extra_course)
        await db.flush()

    extra_section = await db.scalar(select(CourseSection).where(CourseSection.code == "SE402-01"))
    if not extra_section:
        extra_section = CourseSection(
            course_id=extra_course.id,
            lecturer_id=users[UserRole.LECTURER].id,
            code="SE402-01",
            semester="2026A",
            max_students=50,
            status="open",
        )
        db.add(extra_section)
        await db.flush()

    extra_enrollment = await db.scalar(
        select(Enrollment).where(
            Enrollment.section_id == extra_section.id,
            Enrollment.student_id == users[UserRole.STUDENT].id,
        )
    )
    if not extra_enrollment:
        db.add(Enrollment(student_id=users[UserRole.STUDENT].id, section_id=extra_section.id, enrollment_status="active"))
        await db.flush()
    return section, assignment, quiz


async def _seed_learning_data(
    db,
    section_id: str,
    assignment_id: str,
    quiz_id: str,
    users: dict[UserRole, User],
) -> None:
    student_id = users[UserRole.STUDENT].id

    existing_submission = await db.scalar(
        select(Submission).where(Submission.assignment_id == assignment_id, Submission.student_id == student_id)
    )
    if not existing_submission:
        existing_submission = Submission(
            assignment_id=assignment_id,
            student_id=student_id,
            content="Seeded demo submission for stabilization QA.",
            status="graded",
        )
        db.add(existing_submission)
        await db.flush()

    existing_assignment_grade = await db.scalar(
        select(Grade).where(
            Grade.source_type == "assignment",
            Grade.source_id == existing_submission.id,
            Grade.student_id == student_id,
        )
    )
    if not existing_assignment_grade:
        db.add(
            Grade(
                student_id=student_id,
                section_id=section_id,
                source_type="assignment",
                source_id=existing_submission.id,
                score=8.5,
                feedback="Good structure and analysis depth.",
            )
        )
        await db.flush()

    existing_attempt = await db.scalar(select(QuizAttempt).where(QuizAttempt.quiz_id == quiz_id, QuizAttempt.student_id == student_id))
    if not existing_attempt:
        existing_attempt = QuizAttempt(
            quiz_id=quiz_id,
            student_id=student_id,
            answers={},
            score=9.0,
        )
        db.add(existing_attempt)
        await db.flush()

    existing_quiz_grade = await db.scalar(
        select(Grade).where(Grade.source_type == "quiz", Grade.source_id == quiz_id, Grade.student_id == student_id)
    )
    if not existing_quiz_grade:
        db.add(
            Grade(
                student_id=student_id,
                section_id=section_id,
                source_type="quiz",
                source_id=quiz_id,
                score=9.0,
                feedback="Auto graded multiple-choice quiz.",
            )
        )
        await db.flush()

    attendance_session = await db.scalar(select(AttendanceSession).where(AttendanceSession.section_id == section_id, AttendanceSession.title == "Week 1"))
    if not attendance_session:
        attendance_session = AttendanceSession(
            section_id=section_id,
            lecturer_id=users[UserRole.LECTURER].id,
            title="Week 1",
        )
        db.add(attendance_session)
        await db.flush()

    attendance_record = await db.scalar(
        select(AttendanceRecord).where(
            AttendanceRecord.section_id == section_id,
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.attendance_date == attendance_session.session_date,
        )
    )
    if not attendance_record:
        db.add(
            AttendanceRecord(
                section_id=section_id,
                student_id=student_id,
                attendance_date=attendance_session.session_date,
                status="present",
                note="On-time and active.",
            )
        )
        await db.flush()


async def _seed_sprint67_data(
    db,
    department_id: str,
    program_id: str,
    section_id: str,
    users: dict[UserRole, User],
) -> None:
    semester = await db.scalar(select(Semester).where(Semester.code == "2026A"))
    if not semester:
        start_date = datetime.utcnow()
        end_date = start_date + timedelta(days=120)
        semester = Semester(
            code="2026A",
            name="Semester 2026A",
            start_date=start_date,
            end_date=end_date,
            status="active",
        )
        db.add(semester)
        await db.flush()
    else:
        semester.status = "active"

    curriculum = await db.scalar(
        select(CurriculumEntry).where(CurriculumEntry.program_id == program_id)
    )
    if not curriculum:
        section = await db.scalar(select(CourseSection).where(CourseSection.id == section_id))
        course = await db.scalar(select(Course).where(Course.id == section.course_id)) if section else None
        if course:
            db.add(
                CurriculumEntry(
                    program_id=program_id,
                    course_id=course.id,
                    semester_no=1,
                    is_required=True,
                )
            )
            await db.flush()

    assignment_link = await db.scalar(
        select(LecturerAssignment).where(LecturerAssignment.section_id == section_id, LecturerAssignment.lecturer_id == users[UserRole.LECTURER].id)
    )
    if not assignment_link:
        db.add(
            LecturerAssignment(
                section_id=section_id,
                lecturer_id=users[UserRole.LECTURER].id,
                assigned_by=users[UserRole.ACADEMIC_STAFF].id,
                role="primary_lecturer",
            )
        )
        await db.flush()

    advisor_link = await db.scalar(
        select(AdvisorStudent).where(
            AdvisorStudent.advisor_id == users[UserRole.ADVISOR].id,
            AdvisorStudent.student_id == users[UserRole.STUDENT].id,
        )
    )
    if not advisor_link:
        db.add(
            AdvisorStudent(
                advisor_id=users[UserRole.ADVISOR].id,
                student_id=users[UserRole.STUDENT].id,
            )
        )
        await db.flush()

    risk_alert = await db.scalar(
        select(RiskAlert).where(RiskAlert.student_id == users[UserRole.STUDENT].id)
    )
    if not risk_alert:
        db.add(
            RiskAlert(
                student_id=users[UserRole.STUDENT].id,
                advisor_id=users[UserRole.ADVISOR].id,
                risk_level="medium",
                reason="Needs stronger consistency in assignment submissions.",
                status="open",
                recommended_action="Weekly advisor follow-up.",
            )
        )
        await db.flush()

    consultation = await db.scalar(
        select(ConsultationRecord).where(ConsultationRecord.student_id == users[UserRole.STUDENT].id)
    )
    if not consultation:
        db.add(
            ConsultationRecord(
                advisor_id=users[UserRole.ADVISOR].id,
                student_id=users[UserRole.STUDENT].id,
                summary="Initial advising session completed.",
                action_plan="Maintain weekly practice and submit all graded work.",
            )
        )
        await db.flush()

    plan = await db.scalar(select(StudyPlan).where(StudyPlan.student_id == users[UserRole.STUDENT].id))
    if not plan:
        db.add(
            StudyPlan(
                advisor_id=users[UserRole.ADVISOR].id,
                student_id=users[UserRole.STUDENT].id,
                title="Sprint Continuity Plan",
                goals=["Submit all assignments before deadline", "Score >= 8.0 on quizzes"],
                tasks=[{"title": "Review lecture notes", "due_date": "2026-05-02"}],
            )
        )
        await db.flush()

    support = await db.scalar(select(SupportRequest).where(SupportRequest.student_id == users[UserRole.STUDENT].id))
    if not support:
        db.add(
            SupportRequest(
                advisor_id=users[UserRole.ADVISOR].id,
                student_id=users[UserRole.STUDENT].id,
                title="Need additional quiz support",
                description="Request short consultation before next quiz.",
                status="open",
            )
        )
        await db.flush()

    grade_approval = await db.scalar(select(GradeApproval).where(GradeApproval.section_id == section_id))
    if not grade_approval:
        db.add(
            GradeApproval(
                section_id=section_id,
                requested_by=users[UserRole.LECTURER].id,
                approved_by=users[UserRole.ACADEMIC_STAFF].id,
                status="approved",
                note="Seeded grade approval baseline.",
            )
        )
        await db.flush()

    notifications_seed = [
        (UserRole.STUDENT, "Welcome Student", "Your course and grade dashboard is ready."),
        (UserRole.LECTURER, "Welcome Lecturer", "You can now manage lessons, quizzes, and grading."),
        (UserRole.ADMIN, "Welcome Admin", "System management modules are enabled."),
        (UserRole.ACADEMIC_STAFF, "Welcome Academic Staff", "Curriculum and approval modules are enabled."),
        (UserRole.ADVISOR, "Welcome Advisor", "Student progress and consultation modules are enabled."),
    ]
    for role, title, message in notifications_seed:
        note = await db.scalar(
            select(Notification).where(
                Notification.user_id == users[role].id,
                Notification.title == title,
            )
        )
        if not note:
            db.add(
                Notification(
                    user_id=users[role].id,
                    title=title,
                    message=message,
                    channel="in_app",
                    is_read=False,
                )
            )
            await db.flush()

    ann = await db.scalar(select(Announcement).where(Announcement.title == "Sprint 6 Operational Kickoff"))
    if not ann:
        db.add(
            Announcement(
                title="Sprint 6 Operational Kickoff",
                content="Admin, academic staff, and advisor modules are enabled for review.",
                target_role="all",
                section_id=section_id,
                department_id=department_id,
                created_by=users[UserRole.ADMIN].id,
            )
        )
        await db.flush()


def main() -> None:
    asyncio.run(run_seed())
    print(
        "Seed completed: roles, permissions, demo users, departments, programs, courses, "
        "sections, lessons, assignments, submissions, quizzes, grades, attendance, notifications"
    )


if __name__ == "__main__":
    main()
