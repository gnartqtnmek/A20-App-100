from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_current_user, require_roles
from app.core.roles import UserRole
from app.db.session import get_db
from app.models import User
from app.schemas.sprint67 import (
    AdvisorStudentAssignRequest,
    ConsultationCreate,
    RiskAlertCreate,
    RiskAlertUpdate,
    StudyPlanCreate,
    SupportRequestCreate,
    SupportRequestEscalate,
)
from app.services.sprint67_service import (
    assign_student_to_advisor,
    create_consultation,
    create_risk_alert,
    create_study_plan,
    create_support_request,
    escalate_support_request,
    get_advisor_report,
    get_student_progress,
    list_advisor_students,
    list_consultations,
    list_risk_alerts,
    list_study_plans,
    list_support_requests,
    update_risk_alert,
)

router = APIRouter(prefix="/advisor", tags=["Advisor"])


@router.post("/students", dependencies=[Depends(require_roles(UserRole.ADVISOR, UserRole.ADMIN))])
async def post_advisor_student(
    payload: AdvisorStudentAssignRequest,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await assign_student_to_advisor(payload, current_user, db)}


@router.get("/students", dependencies=[Depends(require_roles(UserRole.ADVISOR, UserRole.ADMIN))])
async def get_advisor_students(
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"items": await list_advisor_students(current_user, db)}


@router.get("/students/{student_id}/progress", dependencies=[Depends(require_roles(UserRole.ADVISOR, UserRole.ADMIN))])
async def get_advisor_student_progress(
    student_id: str,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await get_student_progress(student_id, current_user, db)}


@router.post("/risk-alerts", dependencies=[Depends(require_roles(UserRole.ADVISOR, UserRole.ADMIN))])
async def post_risk_alert(
    payload: RiskAlertCreate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await create_risk_alert(payload, current_user, db)}


@router.get("/risk-alerts", dependencies=[Depends(require_roles(UserRole.ADVISOR, UserRole.ADMIN))])
async def get_risk_alerts(
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"items": await list_risk_alerts(current_user, db)}


@router.patch("/risk-alerts/{alert_id}", dependencies=[Depends(require_roles(UserRole.ADVISOR, UserRole.ADMIN))])
async def patch_risk_alert(
    alert_id: str,
    payload: RiskAlertUpdate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await update_risk_alert(alert_id, payload, current_user, db)}


@router.post("/consultations", dependencies=[Depends(require_roles(UserRole.ADVISOR, UserRole.ADMIN))])
async def post_consultation(
    payload: ConsultationCreate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await create_consultation(payload, current_user, db)}


@router.get("/consultations", dependencies=[Depends(require_roles(UserRole.ADVISOR, UserRole.ADMIN))])
async def get_consultations(
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"items": await list_consultations(current_user, db)}


@router.post("/study-plans", dependencies=[Depends(require_roles(UserRole.ADVISOR, UserRole.ADMIN))])
async def post_study_plan(
    payload: StudyPlanCreate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await create_study_plan(payload, current_user, db)}


@router.get("/study-plans", dependencies=[Depends(require_roles(UserRole.ADVISOR, UserRole.ADMIN))])
async def get_study_plans(
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"items": await list_study_plans(current_user, db)}


@router.post("/support-requests", dependencies=[Depends(require_roles(UserRole.ADVISOR, UserRole.ADMIN))])
async def post_support_request(
    payload: SupportRequestCreate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await create_support_request(payload, current_user, db)}


@router.get("/support-requests", dependencies=[Depends(require_roles(UserRole.ADVISOR, UserRole.ADMIN))])
async def get_support_requests(
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"items": await list_support_requests(current_user, db)}


@router.patch("/support-requests/{support_id}/escalate", dependencies=[Depends(require_roles(UserRole.ADVISOR, UserRole.ADMIN))])
async def patch_support_request_escalation(
    support_id: str,
    payload: SupportRequestEscalate,
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"item": await escalate_support_request(support_id, payload, current_user, db)}


@router.get("/reports/summary", dependencies=[Depends(require_roles(UserRole.ADVISOR, UserRole.ADMIN))])
async def get_advisor_summary_report(
    current_user: User = Depends(require_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return {"items": await get_advisor_report(current_user, db)}
