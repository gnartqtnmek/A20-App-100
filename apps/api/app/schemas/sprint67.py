from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from app.core.roles import UserRole


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int


class RoleOut(BaseModel):
    id: str
    code: UserRole
    name: str
    description: str


class PermissionOut(BaseModel):
    id: str
    code: str
    name: str
    module: str
    description: str


class RolePermissionUpdateRequest(BaseModel):
    permission_codes: list[str] = Field(default_factory=list)


class DepartmentCreate(BaseModel):
    code: str = Field(min_length=1, max_length=32)
    name: str = Field(min_length=1, max_length=120)
    description: str = ""


class DepartmentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class DepartmentOut(BaseModel):
    id: str
    code: str
    name: str
    description: str
    created_at: datetime


class ProgramCreate(BaseModel):
    code: str = Field(min_length=1, max_length=32)
    name: str = Field(min_length=1, max_length=120)
    department_id: str | None = None
    total_credits: int = Field(default=120, ge=1)


class ProgramUpdate(BaseModel):
    name: str | None = None
    department_id: str | None = None
    total_credits: int | None = Field(default=None, ge=1)


class ProgramOut(BaseModel):
    id: str
    code: str
    name: str
    department_id: str | None = None
    total_credits: int
    created_at: datetime


class CourseCreate(BaseModel):
    code: str = Field(min_length=1, max_length=32)
    name: str = Field(min_length=1, max_length=150)
    department_id: str | None = None
    credits: int = Field(default=3, ge=1)
    description: str = ""


class CourseUpdate(BaseModel):
    name: str | None = None
    department_id: str | None = None
    credits: int | None = Field(default=None, ge=1)
    description: str | None = None


class CourseOut(BaseModel):
    id: str
    code: str
    name: str
    department_id: str | None = None
    credits: int
    description: str
    created_at: datetime


class SemesterCreate(BaseModel):
    code: str = Field(min_length=1, max_length=32)
    name: str = Field(min_length=1, max_length=120)
    start_date: datetime
    end_date: datetime
    status: str = "planned"


class SemesterUpdate(BaseModel):
    name: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    status: str | None = None


class SemesterOut(BaseModel):
    id: str
    code: str
    name: str
    start_date: datetime
    end_date: datetime
    status: str
    created_at: datetime


class SectionCreate(BaseModel):
    course_id: str
    lecturer_id: str | None = None
    code: str = Field(min_length=1, max_length=32)
    semester: str = "2026A"
    max_students: int = Field(default=60, ge=1)
    status: str = "draft"


class SectionUpdate(BaseModel):
    lecturer_id: str | None = None
    semester: str | None = None
    max_students: int | None = Field(default=None, ge=1)
    status: str | None = None


class SectionOut(BaseModel):
    id: str
    course_id: str
    lecturer_id: str | None = None
    code: str
    semester: str
    max_students: int
    status: str
    created_at: datetime


class CurriculumEntryCreate(BaseModel):
    program_id: str
    course_id: str
    semester_no: int = Field(default=1, ge=1)
    is_required: bool = True


class CurriculumEntryOut(BaseModel):
    id: str
    program_id: str
    course_id: str
    semester_no: int
    is_required: bool
    created_at: datetime


class LecturerAssignmentCreate(BaseModel):
    section_id: str
    lecturer_id: str
    role: str = "primary_lecturer"


class LecturerAssignmentOut(BaseModel):
    id: str
    section_id: str
    lecturer_id: str
    assigned_by: str | None = None
    role: str
    created_at: datetime


class GradeApprovalCreate(BaseModel):
    section_id: str
    note: str = ""


class GradeApprovalAction(BaseModel):
    status: str = Field(pattern="^(approved|rejected)$")
    note: str = ""


class GradeApprovalOut(BaseModel):
    id: str
    section_id: str
    requested_by: str | None = None
    approved_by: str | None = None
    status: str
    note: str
    created_at: datetime


class ExamApprovalCreate(BaseModel):
    quiz_id: str
    note: str = ""


class ExamApprovalAction(BaseModel):
    status: str = Field(pattern="^(approved|rejected)$")
    note: str = ""


class ExamApprovalOut(BaseModel):
    id: str
    quiz_id: str
    requested_by: str | None = None
    approved_by: str | None = None
    status: str
    note: str
    created_at: datetime


class StudentTrackingItem(BaseModel):
    student_id: str
    student_name: str
    student_email: str
    section_id: str
    section_code: str
    average_score: float
    attendance_present: int
    attendance_total: int


class AdvisorStudentAssignRequest(BaseModel):
    student_id: str
    advisor_id: str | None = None


class AdvisorStudentOut(BaseModel):
    id: str
    advisor_id: str
    student_id: str
    created_at: datetime


class StudentProgressOut(BaseModel):
    student_id: str
    student_name: str
    student_email: str
    total_grades: int
    average_score: float
    total_attendance: int
    present_attendance: int
    risk_alerts_open: int


class RiskAlertCreate(BaseModel):
    student_id: str
    risk_level: str = Field(pattern="^(low|medium|high)$")
    reason: str
    recommended_action: str = ""


class RiskAlertUpdate(BaseModel):
    status: str | None = None
    recommended_action: str | None = None


class RiskAlertOut(BaseModel):
    id: str
    student_id: str
    advisor_id: str | None = None
    risk_level: str
    reason: str
    status: str
    recommended_action: str
    created_at: datetime


class ConsultationCreate(BaseModel):
    student_id: str
    summary: str = ""
    action_plan: str = ""
    follow_up_at: datetime | None = None


class ConsultationOut(BaseModel):
    id: str
    advisor_id: str | None = None
    student_id: str
    summary: str
    action_plan: str
    follow_up_at: datetime | None = None
    created_at: datetime


class StudyPlanCreate(BaseModel):
    student_id: str
    title: str = Field(min_length=1, max_length=160)
    goals: list[str] = Field(default_factory=list)
    tasks: list[dict[str, str]] = Field(default_factory=list)


class StudyPlanOut(BaseModel):
    id: str
    student_id: str
    advisor_id: str | None = None
    title: str
    goals: list[str]
    tasks: list[dict[str, str]]
    created_at: datetime


class SupportRequestCreate(BaseModel):
    student_id: str
    title: str = Field(min_length=1, max_length=160)
    description: str = ""


class SupportRequestEscalate(BaseModel):
    status: str = "escalated"
    escalation_note: str = ""


class SupportRequestOut(BaseModel):
    id: str
    student_id: str
    advisor_id: str | None = None
    title: str
    description: str
    status: str
    escalation_note: str
    created_at: datetime


class NotificationCreate(BaseModel):
    user_id: str
    title: str = Field(min_length=1, max_length=160)
    message: str = Field(min_length=1)
    channel: str = "in_app"


class NotificationOut(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    channel: str
    is_read: bool
    created_at: datetime


class AnnouncementCreate(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    content: str = Field(min_length=1)
    target_role: str = "all"
    section_id: str | None = None
    department_id: str | None = None


class AnnouncementOut(BaseModel):
    id: str
    title: str
    content: str
    target_role: str
    section_id: str | None = None
    department_id: str | None = None
    created_by: str | None = None
    created_at: datetime


class AuditLogOut(BaseModel):
    id: str
    actor_id: str | None = None
    action: str
    resource_type: str
    resource_id: str
    detail: dict[str, str]
    created_at: datetime


class UploadedFileOut(BaseModel):
    id: str
    owner_id: str | None = None
    module: str
    original_name: str
    stored_name: str
    content_type: str
    file_size: int
    path: str
    created_at: datetime


class RoleReportItem(BaseModel):
    key: str
    value: str


class RoleReportOut(BaseModel):
    role: str
    title: str
    generated_at: datetime
    items: list[RoleReportItem]
