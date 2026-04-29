from __future__ import annotations

from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.roles import UserRole
from app.models import (
    Announcement,
    AdvisorStudent,
    Assignment,
    AuditLog,
    AttendanceRecord,
    ConsultationRecord,
    Course,
    CourseSection,
    CurriculumEntry,
    Department,
    Enrollment,
    ExamApproval,
    Grade,
    GradeApproval,
    LecturerAssignment,
    Notification,
    Permission,
    Program,
    Quiz,
    RiskAlert,
    Role,
    RolePermission,
    Semester,
    StudyPlan,
    SupportRequest,
    UploadedFile,
    User,
)
from app.schemas.sprint67 import (
    AnnouncementCreate,
    AnnouncementOut,
    AdvisorStudentAssignRequest,
    AdvisorStudentOut,
    AuditLogOut,
    ConsultationCreate,
    ConsultationOut,
    CourseCreate,
    CourseOut,
    CourseUpdate,
    CurriculumEntryCreate,
    CurriculumEntryOut,
    DepartmentCreate,
    DepartmentOut,
    DepartmentUpdate,
    ExamApprovalAction,
    ExamApprovalCreate,
    ExamApprovalOut,
    GradeApprovalAction,
    GradeApprovalCreate,
    GradeApprovalOut,
    LecturerAssignmentCreate,
    LecturerAssignmentOut,
    NotificationCreate,
    NotificationOut,
    PaginationMeta,
    PermissionOut,
    ProgramCreate,
    ProgramOut,
    ProgramUpdate,
    RiskAlertCreate,
    RiskAlertOut,
    RiskAlertUpdate,
    RoleOut,
    SectionCreate,
    SectionOut,
    SectionUpdate,
    SemesterCreate,
    SemesterOut,
    SemesterUpdate,
    StudentProgressOut,
    StudentTrackingItem,
    StudyPlanCreate,
    StudyPlanOut,
    SupportRequestCreate,
    SupportRequestEscalate,
    SupportRequestOut,
    UploadedFileOut,
)


def _paginate(page: int, limit: int) -> tuple[int, int]:
    safe_page = max(1, page)
    safe_limit = max(1, min(limit, 100))
    return safe_page, safe_limit


async def log_audit(
    db: AsyncSession,
    actor_id: str | None,
    action: str,
    resource_type: str,
    resource_id: str = "",
    detail: dict[str, str] | None = None,
) -> None:
    db.add(
        AuditLog(
            actor_id=actor_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            detail=detail or {},
        )
    )
    await db.flush()


def map_role(role: Role) -> RoleOut:
    return RoleOut(id=role.id, code=UserRole(role.code), name=role.name, description=role.description)


def map_permission(permission: Permission) -> PermissionOut:
    return PermissionOut(
        id=permission.id,
        code=permission.code,
        name=permission.name,
        module=permission.module,
        description=permission.description,
    )


async def get_roles_and_permissions(db: AsyncSession) -> tuple[list[RoleOut], list[PermissionOut]]:
    roles = (await db.scalars(select(Role).order_by(Role.name.asc()))).all()
    permissions = (await db.scalars(select(Permission).order_by(Permission.code.asc()))).all()
    return [map_role(item) for item in roles], [map_permission(item) for item in permissions]


async def update_role_permissions(role_code: str, permission_codes: list[str], actor_id: str, db: AsyncSession) -> None:
    role = await db.scalar(select(Role).where(Role.code == role_code))
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")

    permissions = (
        await db.scalars(select(Permission).where(Permission.code.in_(permission_codes))) if permission_codes else []
    )
    selected = permissions.all() if permission_codes else []
    await db.execute(RolePermission.__table__.delete().where(RolePermission.role_id == role.id))
    for permission in selected:
        db.add(RolePermission(role_id=role.id, permission_id=permission.id))
    await log_audit(db, actor_id, "role_permissions_updated", "role", role.id, {"role_code": role_code})
    await db.commit()


def map_department(item: Department) -> DepartmentOut:
    return DepartmentOut(
        id=item.id,
        code=item.code,
        name=item.name,
        description=item.description,
        created_at=item.created_at,
    )


async def create_department(payload: DepartmentCreate, actor_id: str, db: AsyncSession) -> DepartmentOut:
    existing = await db.scalar(select(Department).where(Department.code == payload.code))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Department code already exists")
    item = Department(code=payload.code, name=payload.name, description=payload.description)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    await log_audit(db, actor_id, "department_created", "department", item.id, {"code": item.code})
    await db.commit()
    return map_department(item)


async def list_departments(page: int, limit: int, search: str | None, db: AsyncSession) -> tuple[list[DepartmentOut], PaginationMeta]:
    page, limit = _paginate(page, limit)
    stmt = select(Department)
    count_stmt = select(func.count()).select_from(Department)
    if search:
        pattern = f"%{search.strip()}%"
        filter_expr = or_(Department.code.ilike(pattern), Department.name.ilike(pattern))
        stmt = stmt.where(filter_expr)
        count_stmt = count_stmt.where(filter_expr)
    total = int((await db.scalar(count_stmt)) or 0)
    rows = await db.scalars(stmt.order_by(Department.created_at.desc()).offset((page - 1) * limit).limit(limit))
    return [map_department(item) for item in rows.all()], PaginationMeta(page=page, limit=limit, total=total)


async def update_department(department_id: str, payload: DepartmentUpdate, actor_id: str, db: AsyncSession) -> DepartmentOut:
    item = await db.scalar(select(Department).where(Department.id == department_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
    if payload.name is not None:
        item.name = payload.name
    if payload.description is not None:
        item.description = payload.description
    await db.commit()
    await db.refresh(item)
    await log_audit(db, actor_id, "department_updated", "department", item.id)
    await db.commit()
    return map_department(item)


async def delete_department(department_id: str, actor_id: str, db: AsyncSession) -> None:
    item = await db.scalar(select(Department).where(Department.id == department_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Department not found")
    await db.delete(item)
    await log_audit(db, actor_id, "department_deleted", "department", department_id)
    await db.commit()


def map_program(item: Program) -> ProgramOut:
    return ProgramOut(
        id=item.id,
        code=item.code,
        name=item.name,
        department_id=item.department_id,
        total_credits=item.total_credits,
        created_at=item.created_at,
    )


async def create_program(payload: ProgramCreate, actor_id: str, db: AsyncSession) -> ProgramOut:
    existing = await db.scalar(select(Program).where(Program.code == payload.code))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Program code already exists")
    item = Program(
        code=payload.code,
        name=payload.name,
        department_id=payload.department_id,
        total_credits=payload.total_credits,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    await log_audit(db, actor_id, "program_created", "program", item.id, {"code": item.code})
    await db.commit()
    return map_program(item)


async def list_programs(page: int, limit: int, search: str | None, db: AsyncSession) -> tuple[list[ProgramOut], PaginationMeta]:
    page, limit = _paginate(page, limit)
    stmt = select(Program)
    count_stmt = select(func.count()).select_from(Program)
    if search:
        pattern = f"%{search.strip()}%"
        filter_expr = or_(Program.code.ilike(pattern), Program.name.ilike(pattern))
        stmt = stmt.where(filter_expr)
        count_stmt = count_stmt.where(filter_expr)
    total = int((await db.scalar(count_stmt)) or 0)
    rows = await db.scalars(stmt.order_by(Program.created_at.desc()).offset((page - 1) * limit).limit(limit))
    return [map_program(item) for item in rows.all()], PaginationMeta(page=page, limit=limit, total=total)


async def update_program(program_id: str, payload: ProgramUpdate, actor_id: str, db: AsyncSession) -> ProgramOut:
    item = await db.scalar(select(Program).where(Program.id == program_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program not found")
    if payload.name is not None:
        item.name = payload.name
    if payload.department_id is not None:
        item.department_id = payload.department_id
    if payload.total_credits is not None:
        item.total_credits = payload.total_credits
    await db.commit()
    await db.refresh(item)
    await log_audit(db, actor_id, "program_updated", "program", item.id)
    await db.commit()
    return map_program(item)


async def delete_program(program_id: str, actor_id: str, db: AsyncSession) -> None:
    item = await db.scalar(select(Program).where(Program.id == program_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Program not found")
    await db.delete(item)
    await log_audit(db, actor_id, "program_deleted", "program", program_id)
    await db.commit()


def map_course(item: Course) -> CourseOut:
    return CourseOut(
        id=item.id,
        code=item.code,
        name=item.name,
        department_id=item.department_id,
        credits=item.credits,
        description=item.description,
        created_at=item.created_at,
    )


async def create_course(payload: CourseCreate, actor_id: str, db: AsyncSession) -> CourseOut:
    existing = await db.scalar(select(Course).where(Course.code == payload.code))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Course code already exists")
    item = Course(
        code=payload.code,
        name=payload.name,
        department_id=payload.department_id,
        credits=payload.credits,
        description=payload.description,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    await log_audit(db, actor_id, "course_created", "course", item.id, {"code": item.code})
    await db.commit()
    return map_course(item)


async def list_courses(page: int, limit: int, search: str | None, db: AsyncSession) -> tuple[list[CourseOut], PaginationMeta]:
    page, limit = _paginate(page, limit)
    stmt = select(Course)
    count_stmt = select(func.count()).select_from(Course)
    if search:
        pattern = f"%{search.strip()}%"
        filter_expr = or_(Course.code.ilike(pattern), Course.name.ilike(pattern))
        stmt = stmt.where(filter_expr)
        count_stmt = count_stmt.where(filter_expr)
    total = int((await db.scalar(count_stmt)) or 0)
    rows = await db.scalars(stmt.order_by(Course.created_at.desc()).offset((page - 1) * limit).limit(limit))
    return [map_course(item) for item in rows.all()], PaginationMeta(page=page, limit=limit, total=total)


async def update_course(course_id: str, payload: CourseUpdate, actor_id: str, db: AsyncSession) -> CourseOut:
    item = await db.scalar(select(Course).where(Course.id == course_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    if payload.name is not None:
        item.name = payload.name
    if payload.department_id is not None:
        item.department_id = payload.department_id
    if payload.credits is not None:
        item.credits = payload.credits
    if payload.description is not None:
        item.description = payload.description
    await db.commit()
    await db.refresh(item)
    await log_audit(db, actor_id, "course_updated", "course", item.id)
    await db.commit()
    return map_course(item)


async def delete_course(course_id: str, actor_id: str, db: AsyncSession) -> None:
    item = await db.scalar(select(Course).where(Course.id == course_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    await db.delete(item)
    await log_audit(db, actor_id, "course_deleted", "course", course_id)
    await db.commit()


def map_semester(item: Semester) -> SemesterOut:
    return SemesterOut(
        id=item.id,
        code=item.code,
        name=item.name,
        start_date=item.start_date,
        end_date=item.end_date,
        status=item.status,
        created_at=item.created_at,
    )


async def create_semester(payload: SemesterCreate, actor_id: str, db: AsyncSession) -> SemesterOut:
    existing = await db.scalar(select(Semester).where(Semester.code == payload.code))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Semester code already exists")
    item = Semester(
        code=payload.code,
        name=payload.name,
        start_date=payload.start_date,
        end_date=payload.end_date,
        status=payload.status,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    await log_audit(db, actor_id, "semester_created", "semester", item.id, {"code": item.code})
    await db.commit()
    return map_semester(item)


async def list_semesters(page: int, limit: int, db: AsyncSession) -> tuple[list[SemesterOut], PaginationMeta]:
    page, limit = _paginate(page, limit)
    total = int((await db.scalar(select(func.count()).select_from(Semester))) or 0)
    rows = await db.scalars(select(Semester).order_by(Semester.start_date.desc()).offset((page - 1) * limit).limit(limit))
    return [map_semester(item) for item in rows.all()], PaginationMeta(page=page, limit=limit, total=total)


async def update_semester(semester_id: str, payload: SemesterUpdate, actor_id: str, db: AsyncSession) -> SemesterOut:
    item = await db.scalar(select(Semester).where(Semester.id == semester_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Semester not found")
    if payload.name is not None:
        item.name = payload.name
    if payload.start_date is not None:
        item.start_date = payload.start_date
    if payload.end_date is not None:
        item.end_date = payload.end_date
    if payload.status is not None:
        item.status = payload.status
    await db.commit()
    await db.refresh(item)
    await log_audit(db, actor_id, "semester_updated", "semester", item.id)
    await db.commit()
    return map_semester(item)


def map_section(item: CourseSection) -> SectionOut:
    return SectionOut(
        id=item.id,
        course_id=item.course_id,
        lecturer_id=item.lecturer_id,
        code=item.code,
        semester=item.semester,
        max_students=item.max_students,
        status=item.status,
        created_at=item.created_at,
    )


async def create_section(payload: SectionCreate, actor_id: str, db: AsyncSession) -> SectionOut:
    existing = await db.scalar(select(CourseSection).where(CourseSection.code == payload.code))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Section code already exists")
    section = CourseSection(
        course_id=payload.course_id,
        lecturer_id=payload.lecturer_id,
        code=payload.code,
        semester=payload.semester,
        max_students=payload.max_students,
        status=payload.status,
    )
    db.add(section)
    await db.flush()
    if payload.lecturer_id:
        db.add(
            LecturerAssignment(
                section_id=section.id,
                lecturer_id=payload.lecturer_id,
                assigned_by=actor_id,
                role="primary_lecturer",
            )
        )
    await log_audit(db, actor_id, "section_created", "course_section", section.id, {"code": section.code})
    await db.commit()
    await db.refresh(section)
    return map_section(section)


async def list_sections(
    page: int,
    limit: int,
    search: str | None,
    db: AsyncSession,
    department_id: str | None = None,
) -> tuple[list[SectionOut], PaginationMeta]:
    page, limit = _paginate(page, limit)
    stmt = select(CourseSection)
    count_stmt = select(func.count()).select_from(CourseSection)
    if department_id:
        stmt = stmt.join(Course, Course.id == CourseSection.course_id).where(Course.department_id == department_id)
        count_stmt = count_stmt.join(Course, Course.id == CourseSection.course_id).where(Course.department_id == department_id)
    if search:
        pattern = f"%{search.strip()}%"
        filter_expr = CourseSection.code.ilike(pattern)
        stmt = stmt.where(filter_expr)
        count_stmt = count_stmt.where(filter_expr)
    total = int((await db.scalar(count_stmt)) or 0)
    rows = await db.scalars(
        stmt.order_by(CourseSection.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    return [map_section(item) for item in rows.all()], PaginationMeta(page=page, limit=limit, total=total)


async def update_section(
    section_id: str,
    payload: SectionUpdate,
    actor_id: str,
    db: AsyncSession,
    scope_department_id: str | None = None,
) -> SectionOut:
    section = await db.scalar(select(CourseSection).where(CourseSection.id == section_id))
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
    if scope_department_id:
        course = await db.scalar(select(Course).where(Course.id == section.course_id))
        if not course or course.department_id != scope_department_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Section outside academic staff scope")
    if payload.lecturer_id is not None:
        section.lecturer_id = payload.lecturer_id
        if payload.lecturer_id:
            db.add(
                LecturerAssignment(
                    section_id=section.id,
                    lecturer_id=payload.lecturer_id,
                    assigned_by=actor_id,
                    role="primary_lecturer",
                )
            )
    if payload.semester is not None:
        section.semester = payload.semester
    if payload.max_students is not None:
        section.max_students = payload.max_students
    if payload.status is not None:
        section.status = payload.status
    await log_audit(db, actor_id, "section_updated", "course_section", section.id)
    await db.commit()
    await db.refresh(section)
    return map_section(section)


async def get_system_report(db: AsyncSession) -> list[dict[str, str]]:
    users = int((await db.scalar(select(func.count()).select_from(User))) or 0)
    courses = int((await db.scalar(select(func.count()).select_from(Course))) or 0)
    sections = int((await db.scalar(select(func.count()).select_from(CourseSection))) or 0)
    enrollments = int((await db.scalar(select(func.count()).select_from(Enrollment))) or 0)
    open_alerts = int((await db.scalar(select(func.count()).select_from(RiskAlert).where(RiskAlert.status == "open"))) or 0)
    return [
        {"key": "total_users", "value": str(users)},
        {"key": "total_courses", "value": str(courses)},
        {"key": "total_sections", "value": str(sections)},
        {"key": "total_enrollments", "value": str(enrollments)},
        {"key": "open_risk_alerts", "value": str(open_alerts)},
    ]


def map_curriculum(item: CurriculumEntry) -> CurriculumEntryOut:
    return CurriculumEntryOut(
        id=item.id,
        program_id=item.program_id,
        course_id=item.course_id,
        semester_no=item.semester_no,
        is_required=item.is_required,
        created_at=item.created_at,
    )


async def create_curriculum_entry(
    payload: CurriculumEntryCreate,
    actor_id: str,
    db: AsyncSession,
    scope_department_id: str | None = None,
) -> CurriculumEntryOut:
    if scope_department_id:
        course = await db.scalar(select(Course).where(Course.id == payload.course_id))
        if not course or course.department_id != scope_department_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Course outside academic staff scope")
        program = await db.scalar(select(Program).where(Program.id == payload.program_id))
        if not program or program.department_id != scope_department_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Program outside academic staff scope")
    item = CurriculumEntry(
        program_id=payload.program_id,
        course_id=payload.course_id,
        semester_no=payload.semester_no,
        is_required=payload.is_required,
    )
    db.add(item)
    await log_audit(db, actor_id, "curriculum_entry_created", "curriculum_entry", item.id)
    await db.commit()
    await db.refresh(item)
    return map_curriculum(item)


async def list_curriculum_entries(
    program_id: str | None,
    db: AsyncSession,
    department_id: str | None = None,
) -> list[CurriculumEntryOut]:
    stmt = select(CurriculumEntry)
    if program_id:
        stmt = stmt.where(CurriculumEntry.program_id == program_id)
    if department_id:
        stmt = (
            stmt.join(Course, Course.id == CurriculumEntry.course_id)
            .join(Program, Program.id == CurriculumEntry.program_id)
            .where(Course.department_id == department_id, Program.department_id == department_id)
        )
    rows = await db.scalars(stmt.order_by(CurriculumEntry.created_at.desc()))
    return [map_curriculum(item) for item in rows.all()]


def map_lecturer_assignment(item: LecturerAssignment) -> LecturerAssignmentOut:
    return LecturerAssignmentOut(
        id=item.id,
        section_id=item.section_id,
        lecturer_id=item.lecturer_id,
        assigned_by=item.assigned_by,
        role=item.role,
        created_at=item.created_at,
    )


async def assign_lecturer(
    payload: LecturerAssignmentCreate,
    actor_id: str,
    db: AsyncSession,
    scope_department_id: str | None = None,
) -> LecturerAssignmentOut:
    section = await db.scalar(select(CourseSection).where(CourseSection.id == payload.section_id))
    lecturer = await db.scalar(select(User).where(User.id == payload.lecturer_id, User.role == UserRole.LECTURER.value))
    if not section or not lecturer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section or lecturer not found")
    if scope_department_id:
        course = await db.scalar(select(Course).where(Course.id == section.course_id))
        if not course or course.department_id != scope_department_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Section outside academic staff scope")
    section.lecturer_id = payload.lecturer_id
    item = LecturerAssignment(
        section_id=payload.section_id,
        lecturer_id=payload.lecturer_id,
        assigned_by=actor_id,
        role=payload.role,
    )
    db.add(item)
    await log_audit(db, actor_id, "lecturer_assigned", "course_section", payload.section_id)
    await db.commit()
    await db.refresh(item)
    return map_lecturer_assignment(item)


async def get_student_tracking(db: AsyncSession, department_id: str | None = None) -> list[StudentTrackingItem]:
    stmt = (
        select(User, CourseSection, Enrollment)
        .join(Enrollment, Enrollment.student_id == User.id)
        .join(CourseSection, CourseSection.id == Enrollment.section_id)
        .where(User.role == UserRole.STUDENT.value, Enrollment.enrollment_status == "active")
    )
    if department_id:
        stmt = stmt.join(Course, Course.id == CourseSection.course_id).where(Course.department_id == department_id)
    rows = await db.execute(stmt)
    result: list[StudentTrackingItem] = []
    for student, section, enrollment in rows.all():
        avg_score = float(
            (await db.scalar(select(func.avg(Grade.score)).where(Grade.student_id == student.id, Grade.section_id == section.id)))
            or 0.0
        )
        present = int(
            (
                await db.scalar(
                    select(func.count()).select_from(AttendanceRecord).where(
                        AttendanceRecord.student_id == student.id,
                        AttendanceRecord.section_id == section.id,
                        AttendanceRecord.status == "present",
                    )
                )
            )
            or 0
        )
        total_attendance = int(
            (
                await db.scalar(
                    select(func.count()).select_from(AttendanceRecord).where(
                        AttendanceRecord.student_id == student.id,
                        AttendanceRecord.section_id == section.id,
                    )
                )
            )
            or 0
        )
        result.append(
            StudentTrackingItem(
                student_id=student.id,
                student_name=student.full_name,
                student_email=student.email,
                section_id=section.id,
                section_code=section.code,
                average_score=round(avg_score, 2),
                attendance_present=present,
                attendance_total=total_attendance,
            )
        )
    return result


def map_grade_approval(item: GradeApproval) -> GradeApprovalOut:
    return GradeApprovalOut(
        id=item.id,
        section_id=item.section_id,
        requested_by=item.requested_by,
        approved_by=item.approved_by,
        status=item.status,
        note=item.note,
        created_at=item.created_at,
    )


async def create_grade_approval(
    payload: GradeApprovalCreate,
    requester_id: str,
    db: AsyncSession,
    scope_department_id: str | None = None,
) -> GradeApprovalOut:
    if scope_department_id:
        section = await db.scalar(select(CourseSection).where(CourseSection.id == payload.section_id))
        if not section:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
        course = await db.scalar(select(Course).where(Course.id == section.course_id))
        if not course or course.department_id != scope_department_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Section outside academic staff scope")
    item = GradeApproval(section_id=payload.section_id, requested_by=requester_id, status="pending", note=payload.note)
    db.add(item)
    await log_audit(db, requester_id, "grade_approval_requested", "grade_approval", item.id)
    await db.commit()
    await db.refresh(item)
    return map_grade_approval(item)


async def list_grade_approvals(db: AsyncSession) -> list[GradeApprovalOut]:
    rows = await db.scalars(select(GradeApproval).order_by(GradeApproval.created_at.desc()))
    return [map_grade_approval(item) for item in rows.all()]


async def action_grade_approval(approval_id: str, payload: GradeApprovalAction, actor_id: str, db: AsyncSession) -> GradeApprovalOut:
    item = await db.scalar(select(GradeApproval).where(GradeApproval.id == approval_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Grade approval not found")
    item.status = payload.status
    item.note = payload.note
    item.approved_by = actor_id
    await log_audit(db, actor_id, "grade_approval_actioned", "grade_approval", item.id, {"status": payload.status})
    await db.commit()
    await db.refresh(item)
    return map_grade_approval(item)


def map_exam_approval(item: ExamApproval) -> ExamApprovalOut:
    return ExamApprovalOut(
        id=item.id,
        quiz_id=item.quiz_id,
        requested_by=item.requested_by,
        approved_by=item.approved_by,
        status=item.status,
        note=item.note,
        created_at=item.created_at,
    )


async def create_exam_approval(
    payload: ExamApprovalCreate,
    requester_id: str,
    db: AsyncSession,
    scope_department_id: str | None = None,
) -> ExamApprovalOut:
    if scope_department_id:
        quiz = await db.scalar(select(Quiz).where(Quiz.id == payload.quiz_id))
        if not quiz:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
        section = await db.scalar(select(CourseSection).where(CourseSection.id == quiz.section_id))
        if not section:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
        course = await db.scalar(select(Course).where(Course.id == section.course_id))
        if not course or course.department_id != scope_department_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Quiz outside academic staff scope")
    item = ExamApproval(quiz_id=payload.quiz_id, requested_by=requester_id, status="pending", note=payload.note)
    db.add(item)
    await log_audit(db, requester_id, "exam_approval_requested", "exam_approval", item.id)
    await db.commit()
    await db.refresh(item)
    return map_exam_approval(item)


async def list_exam_approvals(db: AsyncSession) -> list[ExamApprovalOut]:
    rows = await db.scalars(select(ExamApproval).order_by(ExamApproval.created_at.desc()))
    return [map_exam_approval(item) for item in rows.all()]


async def action_exam_approval(approval_id: str, payload: ExamApprovalAction, actor_id: str, db: AsyncSession) -> ExamApprovalOut:
    item = await db.scalar(select(ExamApproval).where(ExamApproval.id == approval_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam approval not found")
    item.status = payload.status
    item.note = payload.note
    item.approved_by = actor_id
    await log_audit(db, actor_id, "exam_approval_actioned", "exam_approval", item.id, {"status": payload.status})
    await db.commit()
    await db.refresh(item)
    return map_exam_approval(item)


async def get_academic_report(db: AsyncSession) -> list[dict[str, str]]:
    curriculum_count = int((await db.scalar(select(func.count()).select_from(CurriculumEntry))) or 0)
    pending_grade_approvals = int(
        (await db.scalar(select(func.count()).select_from(GradeApproval).where(GradeApproval.status == "pending"))) or 0
    )
    pending_exam_approvals = int(
        (await db.scalar(select(func.count()).select_from(ExamApproval).where(ExamApproval.status == "pending"))) or 0
    )
    tracked_students = int((await db.scalar(select(func.count()).select_from(Enrollment))) or 0)
    return [
        {"key": "curriculum_entries", "value": str(curriculum_count)},
        {"key": "pending_grade_approvals", "value": str(pending_grade_approvals)},
        {"key": "pending_exam_approvals", "value": str(pending_exam_approvals)},
        {"key": "tracked_students", "value": str(tracked_students)},
    ]


def map_advisor_student(item: AdvisorStudent) -> AdvisorStudentOut:
    return AdvisorStudentOut(id=item.id, advisor_id=item.advisor_id, student_id=item.student_id, created_at=item.created_at)


async def _ensure_advisor_student_access(
    student_id: str,
    current_user: User,
    db: AsyncSession,
) -> None:
    if current_user.role == UserRole.ADMIN.value:
        return
    link = await db.scalar(
        select(AdvisorStudent).where(
            AdvisorStudent.advisor_id == current_user.id,
            AdvisorStudent.student_id == student_id,
        )
    )
    if not link:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student is not assigned to this advisor")


async def assign_student_to_advisor(payload: AdvisorStudentAssignRequest, current_user: User, db: AsyncSession) -> AdvisorStudentOut:
    student = await db.scalar(select(User).where(User.id == payload.student_id, User.role == UserRole.STUDENT.value))
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    advisor_id = current_user.id
    if current_user.role == UserRole.ADMIN.value:
        advisor_id = payload.advisor_id or ""
        if not advisor_id:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="advisor_id is required for admin assignment")
    advisor = await db.scalar(select(User).where(User.id == advisor_id, User.role == UserRole.ADVISOR.value))
    if not advisor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Advisor not found")
    existing = await db.scalar(
        select(AdvisorStudent).where(AdvisorStudent.advisor_id == advisor_id, AdvisorStudent.student_id == payload.student_id)
    )
    if existing:
        return map_advisor_student(existing)
    item = AdvisorStudent(advisor_id=advisor_id, student_id=payload.student_id)
    db.add(item)
    await log_audit(db, current_user.id, "advisor_student_assigned", "advisor_student", item.id)
    await db.commit()
    await db.refresh(item)
    return map_advisor_student(item)


async def list_advisor_students(current_user: User, db: AsyncSession) -> list[AdvisorStudentOut]:
    stmt = select(AdvisorStudent)
    if current_user.role != UserRole.ADMIN.value:
        stmt = stmt.where(AdvisorStudent.advisor_id == current_user.id)
    rows = await db.scalars(stmt.order_by(AdvisorStudent.created_at.desc()))
    return [map_advisor_student(item) for item in rows.all()]


async def get_student_progress(student_id: str, current_user: User, db: AsyncSession) -> StudentProgressOut:
    await _ensure_advisor_student_access(student_id, current_user, db)
    student = await db.scalar(select(User).where(User.id == student_id, User.role == UserRole.STUDENT.value))
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    total_grades = int((await db.scalar(select(func.count()).select_from(Grade).where(Grade.student_id == student_id))) or 0)
    average_score = float((await db.scalar(select(func.avg(Grade.score)).where(Grade.student_id == student_id))) or 0.0)
    total_attendance = int(
        (await db.scalar(select(func.count()).select_from(AttendanceRecord).where(AttendanceRecord.student_id == student_id))) or 0
    )
    present_attendance = int(
        (
            await db.scalar(
                select(func.count())
                .select_from(AttendanceRecord)
                .where(AttendanceRecord.student_id == student_id, AttendanceRecord.status == "present")
            )
        )
        or 0
    )
    risk_open = int(
        (
            await db.scalar(
                select(func.count()).select_from(RiskAlert).where(RiskAlert.student_id == student_id, RiskAlert.status == "open")
            )
        )
        or 0
    )
    return StudentProgressOut(
        student_id=student.id,
        student_name=student.full_name,
        student_email=student.email,
        total_grades=total_grades,
        average_score=round(average_score, 2),
        total_attendance=total_attendance,
        present_attendance=present_attendance,
        risk_alerts_open=risk_open,
    )


def map_risk_alert(item: RiskAlert) -> RiskAlertOut:
    return RiskAlertOut(
        id=item.id,
        student_id=item.student_id,
        advisor_id=item.advisor_id,
        risk_level=item.risk_level,
        reason=item.reason,
        status=item.status,
        recommended_action=item.recommended_action,
        created_at=item.created_at,
    )


async def create_risk_alert(payload: RiskAlertCreate, current_user: User, db: AsyncSession) -> RiskAlertOut:
    await _ensure_advisor_student_access(payload.student_id, current_user, db)
    item = RiskAlert(
        student_id=payload.student_id,
        advisor_id=current_user.id if current_user.role == UserRole.ADVISOR.value else None,
        risk_level=payload.risk_level,
        reason=payload.reason,
        recommended_action=payload.recommended_action,
        status="open",
    )
    db.add(item)
    await log_audit(db, current_user.id, "risk_alert_created", "risk_alert", item.id)
    await db.commit()
    await db.refresh(item)
    return map_risk_alert(item)


async def list_risk_alerts(current_user: User, db: AsyncSession) -> list[RiskAlertOut]:
    stmt = select(RiskAlert)
    if current_user.role != UserRole.ADMIN.value:
        stmt = stmt.where(RiskAlert.advisor_id == current_user.id)
    rows = await db.scalars(stmt.order_by(RiskAlert.created_at.desc()))
    return [map_risk_alert(item) for item in rows.all()]


async def update_risk_alert(alert_id: str, payload: RiskAlertUpdate, current_user: User, db: AsyncSession) -> RiskAlertOut:
    item = await db.scalar(select(RiskAlert).where(RiskAlert.id == alert_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risk alert not found")
    await _ensure_advisor_student_access(item.student_id, current_user, db)
    if payload.status is not None:
        item.status = payload.status
    if payload.recommended_action is not None:
        item.recommended_action = payload.recommended_action
    if current_user.role == UserRole.ADVISOR.value:
        item.advisor_id = current_user.id
    await log_audit(db, current_user.id, "risk_alert_updated", "risk_alert", item.id)
    await db.commit()
    await db.refresh(item)
    return map_risk_alert(item)


def map_consultation(item: ConsultationRecord) -> ConsultationOut:
    return ConsultationOut(
        id=item.id,
        advisor_id=item.advisor_id,
        student_id=item.student_id,
        summary=item.summary,
        action_plan=item.action_plan,
        follow_up_at=item.follow_up_at,
        created_at=item.created_at,
    )


async def create_consultation(payload: ConsultationCreate, current_user: User, db: AsyncSession) -> ConsultationOut:
    await _ensure_advisor_student_access(payload.student_id, current_user, db)
    item = ConsultationRecord(
        advisor_id=current_user.id if current_user.role == UserRole.ADVISOR.value else None,
        student_id=payload.student_id,
        summary=payload.summary,
        action_plan=payload.action_plan,
        follow_up_at=payload.follow_up_at,
    )
    db.add(item)
    await log_audit(db, current_user.id, "consultation_created", "consultation", item.id)
    await db.commit()
    await db.refresh(item)
    return map_consultation(item)


async def list_consultations(current_user: User, db: AsyncSession) -> list[ConsultationOut]:
    stmt = select(ConsultationRecord)
    if current_user.role != UserRole.ADMIN.value:
        stmt = stmt.where(ConsultationRecord.advisor_id == current_user.id)
    rows = await db.scalars(stmt.order_by(ConsultationRecord.created_at.desc()))
    return [map_consultation(item) for item in rows.all()]


def map_study_plan(item: StudyPlan) -> StudyPlanOut:
    return StudyPlanOut(
        id=item.id,
        student_id=item.student_id,
        advisor_id=item.advisor_id,
        title=item.title,
        goals=item.goals or [],
        tasks=item.tasks or [],
        created_at=item.created_at,
    )


async def create_study_plan(payload: StudyPlanCreate, current_user: User, db: AsyncSession) -> StudyPlanOut:
    await _ensure_advisor_student_access(payload.student_id, current_user, db)
    item = StudyPlan(
        student_id=payload.student_id,
        advisor_id=current_user.id if current_user.role == UserRole.ADVISOR.value else None,
        title=payload.title,
        goals=payload.goals,
        tasks=payload.tasks,
    )
    db.add(item)
    await log_audit(db, current_user.id, "study_plan_created", "study_plan", item.id)
    await db.commit()
    await db.refresh(item)
    return map_study_plan(item)


async def list_study_plans(current_user: User, db: AsyncSession) -> list[StudyPlanOut]:
    stmt = select(StudyPlan)
    if current_user.role != UserRole.ADMIN.value:
        stmt = stmt.where(StudyPlan.advisor_id == current_user.id)
    rows = await db.scalars(stmt.order_by(StudyPlan.created_at.desc()))
    return [map_study_plan(item) for item in rows.all()]


def map_support_request(item: SupportRequest) -> SupportRequestOut:
    return SupportRequestOut(
        id=item.id,
        student_id=item.student_id,
        advisor_id=item.advisor_id,
        title=item.title,
        description=item.description,
        status=item.status,
        escalation_note=item.escalation_note,
        created_at=item.created_at,
    )


async def create_support_request(payload: SupportRequestCreate, current_user: User, db: AsyncSession) -> SupportRequestOut:
    await _ensure_advisor_student_access(payload.student_id, current_user, db)
    item = SupportRequest(
        student_id=payload.student_id,
        advisor_id=current_user.id if current_user.role == UserRole.ADVISOR.value else None,
        title=payload.title,
        description=payload.description,
        status="open",
    )
    db.add(item)
    await log_audit(db, current_user.id, "support_request_created", "support_request", item.id)
    await db.commit()
    await db.refresh(item)
    return map_support_request(item)


async def escalate_support_request(
    support_id: str, payload: SupportRequestEscalate, current_user: User, db: AsyncSession
) -> SupportRequestOut:
    item = await db.scalar(select(SupportRequest).where(SupportRequest.id == support_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Support request not found")
    await _ensure_advisor_student_access(item.student_id, current_user, db)
    item.status = payload.status
    item.escalation_note = payload.escalation_note
    if current_user.role == UserRole.ADVISOR.value:
        item.advisor_id = current_user.id
    await log_audit(db, current_user.id, "support_request_escalated", "support_request", item.id)
    await db.commit()
    await db.refresh(item)
    return map_support_request(item)


async def list_support_requests(current_user: User, db: AsyncSession) -> list[SupportRequestOut]:
    stmt = select(SupportRequest)
    if current_user.role != UserRole.ADMIN.value:
        stmt = stmt.where(SupportRequest.advisor_id == current_user.id)
    rows = await db.scalars(stmt.order_by(SupportRequest.created_at.desc()))
    return [map_support_request(item) for item in rows.all()]


async def get_advisor_report(current_user: User, db: AsyncSession) -> list[dict[str, str]]:
    if current_user.role == UserRole.ADMIN.value:
        assigned = int((await db.scalar(select(func.count()).select_from(AdvisorStudent))) or 0)
        open_alerts = int((await db.scalar(select(func.count()).select_from(RiskAlert).where(RiskAlert.status == "open"))) or 0)
        consultations = int((await db.scalar(select(func.count()).select_from(ConsultationRecord))) or 0)
        plans = int((await db.scalar(select(func.count()).select_from(StudyPlan))) or 0)
    else:
        assigned = int(
            (await db.scalar(select(func.count()).select_from(AdvisorStudent).where(AdvisorStudent.advisor_id == current_user.id))) or 0
        )
        open_alerts = int(
            (
                await db.scalar(
                    select(func.count()).select_from(RiskAlert).where(
                        RiskAlert.advisor_id == current_user.id,
                        RiskAlert.status == "open",
                    )
                )
            )
            or 0
        )
        consultations = int(
            (await db.scalar(select(func.count()).select_from(ConsultationRecord).where(ConsultationRecord.advisor_id == current_user.id)))
            or 0
        )
        plans = int((await db.scalar(select(func.count()).select_from(StudyPlan).where(StudyPlan.advisor_id == current_user.id))) or 0)
    return [
        {"key": "assigned_students", "value": str(assigned)},
        {"key": "open_risk_alerts", "value": str(open_alerts)},
        {"key": "consultation_records", "value": str(consultations)},
        {"key": "study_plans", "value": str(plans)},
    ]


def map_notification(item: Notification) -> NotificationOut:
    return NotificationOut(
        id=item.id,
        user_id=item.user_id,
        title=item.title,
        message=item.message,
        channel=item.channel,
        is_read=item.is_read,
        created_at=item.created_at,
    )


async def create_notification(payload: NotificationCreate, actor_id: str, db: AsyncSession) -> NotificationOut:
    item = Notification(user_id=payload.user_id, title=payload.title, message=payload.message, channel=payload.channel, is_read=False)
    db.add(item)
    await log_audit(db, actor_id, "notification_created", "notification", item.id)
    await db.commit()
    await db.refresh(item)
    return map_notification(item)


async def list_notifications(user_id: str, page: int, limit: int, db: AsyncSession) -> tuple[list[NotificationOut], PaginationMeta]:
    page, limit = _paginate(page, limit)
    total = int((await db.scalar(select(func.count()).select_from(Notification).where(Notification.user_id == user_id))) or 0)
    rows = await db.scalars(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    return [map_notification(item) for item in rows.all()], PaginationMeta(page=page, limit=limit, total=total)


async def mark_notification_read(notification_id: str, user_id: str, db: AsyncSession) -> NotificationOut:
    item = await db.scalar(select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    item.is_read = True
    await db.commit()
    await db.refresh(item)
    return map_notification(item)


def map_announcement(item: Announcement) -> AnnouncementOut:
    return AnnouncementOut(
        id=item.id,
        title=item.title,
        content=item.content,
        target_role=item.target_role,
        section_id=item.section_id,
        department_id=item.department_id,
        created_by=item.created_by,
        created_at=item.created_at,
    )


async def create_announcement(payload: AnnouncementCreate, actor_id: str, db: AsyncSession) -> AnnouncementOut:
    item = Announcement(
        title=payload.title,
        content=payload.content,
        target_role=payload.target_role,
        section_id=payload.section_id,
        department_id=payload.department_id,
        created_by=actor_id,
    )
    db.add(item)
    await log_audit(db, actor_id, "announcement_created", "announcement", item.id)
    await db.commit()
    await db.refresh(item)
    return map_announcement(item)


async def list_announcements(role: str, db: AsyncSession) -> list[AnnouncementOut]:
    rows = await db.scalars(
        select(Announcement)
        .where(or_(Announcement.target_role == "all", Announcement.target_role == role))
        .order_by(Announcement.created_at.desc())
    )
    return [map_announcement(item) for item in rows.all()]


def map_audit(item: AuditLog) -> AuditLogOut:
    detail = item.detail if isinstance(item.detail, dict) else {}
    normalized: dict[str, str] = {str(key): str(value) for key, value in detail.items()}
    return AuditLogOut(
        id=item.id,
        actor_id=item.actor_id,
        action=item.action,
        resource_type=item.resource_type,
        resource_id=item.resource_id,
        detail=normalized,
        created_at=item.created_at,
    )


async def list_audit_logs(page: int, limit: int, action: str | None, db: AsyncSession) -> tuple[list[AuditLogOut], PaginationMeta]:
    page, limit = _paginate(page, limit)
    stmt = select(AuditLog)
    count_stmt = select(func.count()).select_from(AuditLog)
    if action:
        stmt = stmt.where(AuditLog.action == action)
        count_stmt = count_stmt.where(AuditLog.action == action)
    total = int((await db.scalar(count_stmt)) or 0)
    rows = await db.scalars(stmt.order_by(AuditLog.created_at.desc()).offset((page - 1) * limit).limit(limit))
    return [map_audit(item) for item in rows.all()], PaginationMeta(page=page, limit=limit, total=total)


def map_uploaded_file(item: UploadedFile) -> UploadedFileOut:
    return UploadedFileOut(
        id=item.id,
        owner_id=item.owner_id,
        module=item.module,
        original_name=item.original_name,
        stored_name=item.stored_name,
        content_type=item.content_type,
        file_size=item.file_size,
        path=item.path,
        created_at=item.created_at,
    )


async def upload_file(owner_id: str, module: str, file: UploadFile, db: AsyncSession) -> UploadedFileOut:
    root = Path(__file__).resolve().parents[2] / "uploads"
    root.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "upload.bin").suffix
    stored_name = f"{uuid4()}{suffix}"
    target = root / stored_name
    content = await file.read()
    target.write_bytes(content)

    item = UploadedFile(
        owner_id=owner_id,
        module=module,
        original_name=file.filename or stored_name,
        stored_name=stored_name,
        content_type=file.content_type or "application/octet-stream",
        file_size=len(content),
        path=str(target),
    )
    db.add(item)
    await log_audit(db, owner_id, "file_uploaded", "uploaded_file", item.id, {"module": module})
    await db.commit()
    await db.refresh(item)
    return map_uploaded_file(item)


async def list_uploaded_files(owner_id: str, page: int, limit: int, db: AsyncSession) -> tuple[list[UploadedFileOut], PaginationMeta]:
    page, limit = _paginate(page, limit)
    total = int((await db.scalar(select(func.count()).select_from(UploadedFile).where(UploadedFile.owner_id == owner_id))) or 0)
    rows = await db.scalars(
        select(UploadedFile)
        .where(UploadedFile.owner_id == owner_id)
        .order_by(UploadedFile.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    return [map_uploaded_file(item) for item in rows.all()], PaginationMeta(page=page, limit=limit, total=total)


async def build_role_report(role: str, current_user: User, db: AsyncSession) -> list[dict[str, str]]:
    if role == UserRole.STUDENT.value:
        if current_user.role == UserRole.ADMIN.value:
            grade_count = int((await db.scalar(select(func.count()).select_from(Grade))) or 0)
            avg_score = float((await db.scalar(select(func.avg(Grade.score)))) or 0.0)
        else:
            grade_count = int((await db.scalar(select(func.count()).select_from(Grade).where(Grade.student_id == current_user.id))) or 0)
            avg_score = float((await db.scalar(select(func.avg(Grade.score)).where(Grade.student_id == current_user.id))) or 0.0)
        return [{"key": "grade_items", "value": str(grade_count)}, {"key": "average_score", "value": f"{avg_score:.2f}"}]
    if role == UserRole.LECTURER.value:
        if current_user.role == UserRole.ADMIN.value:
            section_count = int((await db.scalar(select(func.count()).select_from(CourseSection))) or 0)
            submission_count = int((await db.scalar(select(func.count()).select_from(Assignment))) or 0)
        else:
            section_count = int(
                (await db.scalar(select(func.count()).select_from(CourseSection).where(CourseSection.lecturer_id == current_user.id)))
                or 0
            )
            submission_count = int(
                (
                    await db.scalar(
                        select(func.count()).select_from(Assignment).join(CourseSection, CourseSection.id == Assignment.section_id).where(
                            CourseSection.lecturer_id == current_user.id
                        )
                    )
                )
                or 0
            )
        return [{"key": "teaching_sections", "value": str(section_count)}, {"key": "managed_assignments", "value": str(submission_count)}]
    if role == UserRole.ADMIN.value:
        return await get_system_report(db)
    if role == UserRole.ACADEMIC_STAFF.value:
        return await get_academic_report(db)
    if role == UserRole.ADVISOR.value:
        return await get_advisor_report(current_user, db)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unsupported role report")
