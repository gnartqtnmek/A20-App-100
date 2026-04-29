from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_current_user, require_roles
from app.core.roles import UserRole
from app.db.session import get_db
from app.models import User
from app.schemas.common import MessageResponse
from app.schemas.sprint67 import (
    CurriculumEntryCreate,
    ExamApprovalAction,
    ExamApprovalCreate,
    GradeApprovalAction,
    GradeApprovalCreate,
    LecturerAssignmentCreate,
    SectionUpdate,
)
from app.services.sprint67_service import (
    action_exam_approval,
    action_grade_approval,
    assign_lecturer,
    create_curriculum_entry,
    create_exam_approval,
    create_grade_approval,
    get_academic_report,
    get_student_tracking,
    list_curriculum_entries,
    list_exam_approvals,
    list_grade_approvals,
    list_sections,
    update_section,
)

router = APIRouter(prefix="/academic", tags=["Academic Staff"])


@router.post("/curriculum", dependencies=[Depends(require_roles(UserRole.ACADEMIC_STAFF, UserRole.ADMIN))])
async def post_curriculum_entry(
    payload: CurriculumEntryCreate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    scope_department_id = current_user.department_id if current_user.role == UserRole.ACADEMIC_STAFF.value else None
    return {"item": await create_curriculum_entry(payload, current_user.id, db, scope_department_id=scope_department_id)}


@router.get("/curriculum", dependencies=[Depends(require_roles(UserRole.ACADEMIC_STAFF, UserRole.ADMIN))])
async def get_curriculum_entries(
    program_id: str | None = Query(default=None),
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    scope_department_id = current_user.department_id if current_user.role == UserRole.ACADEMIC_STAFF.value else None
    return {"items": await list_curriculum_entries(program_id, db, department_id=scope_department_id)}


@router.get("/sections", dependencies=[Depends(require_roles(UserRole.ACADEMIC_STAFF, UserRole.ADMIN))])
async def get_academic_sections(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    scope_department_id = current_user.department_id if current_user.role == UserRole.ACADEMIC_STAFF.value else None
    items, meta = await list_sections(page, limit, search, db, department_id=scope_department_id)
    return {"items": items, "meta": meta}


@router.put("/sections/{section_id}", dependencies=[Depends(require_roles(UserRole.ACADEMIC_STAFF, UserRole.ADMIN))])
async def put_academic_section(
    section_id: str,
    payload: SectionUpdate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    scope_department_id = current_user.department_id if current_user.role == UserRole.ACADEMIC_STAFF.value else None
    return {"item": await update_section(section_id, payload, current_user.id, db, scope_department_id=scope_department_id)}


@router.post("/lecturer-assignments", dependencies=[Depends(require_roles(UserRole.ACADEMIC_STAFF, UserRole.ADMIN))])
async def post_lecturer_assignment(
    payload: LecturerAssignmentCreate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    scope_department_id = current_user.department_id if current_user.role == UserRole.ACADEMIC_STAFF.value else None
    return {"item": await assign_lecturer(payload, current_user.id, db, scope_department_id=scope_department_id)}


@router.get("/student-tracking", dependencies=[Depends(require_roles(UserRole.ACADEMIC_STAFF, UserRole.ADMIN))])
async def get_student_tracking_data(
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    scope_department_id = current_user.department_id if current_user.role == UserRole.ACADEMIC_STAFF.value else None
    return {"items": await get_student_tracking(db, department_id=scope_department_id)}


@router.post("/grade-approvals", dependencies=[Depends(require_roles(UserRole.LECTURER, UserRole.ACADEMIC_STAFF, UserRole.ADMIN))])
async def post_grade_approval(
    payload: GradeApprovalCreate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    scope_department_id = current_user.department_id if current_user.role == UserRole.ACADEMIC_STAFF.value else None
    return {"item": await create_grade_approval(payload, current_user.id, db, scope_department_id=scope_department_id)}


@router.get("/grade-approvals", dependencies=[Depends(require_roles(UserRole.ACADEMIC_STAFF, UserRole.ADMIN))])
async def get_grade_approvals(db: AsyncSession = Depends(get_db)) -> dict[str, object]:
    return {"items": await list_grade_approvals(db)}


@router.patch("/grade-approvals/{approval_id}", dependencies=[Depends(require_roles(UserRole.ACADEMIC_STAFF, UserRole.ADMIN))])
async def patch_grade_approval(
    approval_id: str,
    payload: GradeApprovalAction,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await action_grade_approval(approval_id, payload, current_user.id, db)}


@router.post("/exam-approvals", dependencies=[Depends(require_roles(UserRole.LECTURER, UserRole.ACADEMIC_STAFF, UserRole.ADMIN))])
async def post_exam_approval(
    payload: ExamApprovalCreate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    scope_department_id = current_user.department_id if current_user.role == UserRole.ACADEMIC_STAFF.value else None
    return {"item": await create_exam_approval(payload, current_user.id, db, scope_department_id=scope_department_id)}


@router.get("/exam-approvals", dependencies=[Depends(require_roles(UserRole.ACADEMIC_STAFF, UserRole.ADMIN))])
async def get_exam_approvals(db: AsyncSession = Depends(get_db)) -> dict[str, object]:
    return {"items": await list_exam_approvals(db)}


@router.patch("/exam-approvals/{approval_id}", dependencies=[Depends(require_roles(UserRole.ACADEMIC_STAFF, UserRole.ADMIN))])
async def patch_exam_approval(
    approval_id: str,
    payload: ExamApprovalAction,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await action_exam_approval(approval_id, payload, current_user.id, db)}


@router.get("/reports/training", dependencies=[Depends(require_roles(UserRole.ACADEMIC_STAFF, UserRole.ADMIN))])
async def get_training_report(db: AsyncSession = Depends(get_db)) -> dict[str, object]:
    return {"items": await get_academic_report(db)}


@router.post("/sections/{section_id}/open", dependencies=[Depends(require_roles(UserRole.ACADEMIC_STAFF, UserRole.ADMIN))], response_model=MessageResponse)
async def open_section(
    section_id: str,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    scope_department_id = current_user.department_id if current_user.role == UserRole.ACADEMIC_STAFF.value else None
    await update_section(section_id, SectionUpdate(status="open"), current_user.id, db, scope_department_id=scope_department_id)
    return MessageResponse(message="Section opened")
