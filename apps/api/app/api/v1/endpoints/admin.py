from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_current_user, require_roles
from app.core.roles import UserRole
from app.db.session import get_db
from app.models import User
from app.schemas.common import MessageResponse
from app.schemas.sprint67 import (
    CourseCreate,
    CourseUpdate,
    DepartmentCreate,
    DepartmentUpdate,
    ProgramCreate,
    ProgramUpdate,
    RolePermissionUpdateRequest,
    SectionCreate,
    SectionUpdate,
    SemesterCreate,
    SemesterUpdate,
)
from app.services.sprint67_service import (
    create_course,
    create_department,
    create_program,
    create_section,
    create_semester,
    delete_course,
    delete_department,
    delete_program,
    get_roles_and_permissions,
    get_system_report,
    list_courses,
    list_departments,
    list_programs,
    list_sections,
    list_semesters,
    update_course,
    update_department,
    update_program,
    update_role_permissions,
    update_section,
    update_semester,
)

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/roles", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def get_roles(db: AsyncSession = Depends(get_db)) -> dict[str, object]:
    roles, _ = await get_roles_and_permissions(db)
    return {"items": roles}


@router.get("/permissions", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def get_permissions(db: AsyncSession = Depends(get_db)) -> dict[str, object]:
    _, permissions = await get_roles_and_permissions(db)
    return {"items": permissions}


@router.put("/roles/{role_code}/permissions", dependencies=[Depends(require_roles(UserRole.ADMIN))], response_model=MessageResponse)
async def put_role_permissions(
    role_code: str,
    payload: RolePermissionUpdateRequest,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await update_role_permissions(role_code, payload.permission_codes, current_user.id, db)
    return MessageResponse(message="Role permissions updated")


@router.post("/departments", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def post_department(
    payload: DepartmentCreate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await create_department(payload, current_user.id, db)}


@router.get("/departments", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def get_departments(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    items, meta = await list_departments(page, limit, search, db)
    return {"items": items, "meta": meta}


@router.put("/departments/{department_id}", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def put_department(
    department_id: str,
    payload: DepartmentUpdate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await update_department(department_id, payload, current_user.id, db)}


@router.delete("/departments/{department_id}", dependencies=[Depends(require_roles(UserRole.ADMIN))], response_model=MessageResponse)
async def remove_department(
    department_id: str,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await delete_department(department_id, current_user.id, db)
    return MessageResponse(message="Department deleted")


@router.post("/programs", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def post_program(
    payload: ProgramCreate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await create_program(payload, current_user.id, db)}


@router.get("/programs", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def get_programs(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    items, meta = await list_programs(page, limit, search, db)
    return {"items": items, "meta": meta}


@router.put("/programs/{program_id}", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def put_program(
    program_id: str,
    payload: ProgramUpdate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await update_program(program_id, payload, current_user.id, db)}


@router.delete("/programs/{program_id}", dependencies=[Depends(require_roles(UserRole.ADMIN))], response_model=MessageResponse)
async def remove_program(
    program_id: str,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await delete_program(program_id, current_user.id, db)
    return MessageResponse(message="Program deleted")


@router.post("/courses", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def post_course(
    payload: CourseCreate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await create_course(payload, current_user.id, db)}


@router.get("/courses", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def get_courses(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    items, meta = await list_courses(page, limit, search, db)
    return {"items": items, "meta": meta}


@router.put("/courses/{course_id}", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def put_course(
    course_id: str,
    payload: CourseUpdate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await update_course(course_id, payload, current_user.id, db)}


@router.delete("/courses/{course_id}", dependencies=[Depends(require_roles(UserRole.ADMIN))], response_model=MessageResponse)
async def remove_course(
    course_id: str,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await delete_course(course_id, current_user.id, db)
    return MessageResponse(message="Course deleted")


@router.post("/semesters", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def post_semester(
    payload: SemesterCreate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await create_semester(payload, current_user.id, db)}


@router.get("/semesters", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def get_semesters(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    items, meta = await list_semesters(page, limit, db)
    return {"items": items, "meta": meta}


@router.put("/semesters/{semester_id}", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def put_semester(
    semester_id: str,
    payload: SemesterUpdate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await update_semester(semester_id, payload, current_user.id, db)}


@router.post("/sections", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def post_section(
    payload: SectionCreate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await create_section(payload, current_user.id, db)}


@router.get("/sections", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def get_sections(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    items, meta = await list_sections(page, limit, search, db)
    return {"items": items, "meta": meta}


@router.put("/sections/{section_id}", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def put_section(
    section_id: str,
    payload: SectionUpdate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await update_section(section_id, payload, current_user.id, db)}


@router.get("/reports/system", dependencies=[Depends(require_roles(UserRole.ADMIN))])
async def get_admin_system_report(db: AsyncSession = Depends(get_db)) -> dict[str, object]:
    return {"items": await get_system_report(db)}
