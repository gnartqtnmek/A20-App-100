from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.academic import router as academic_router
from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.advisor import router as advisor_router
from app.api.v1.endpoints.dashboards import router as dashboards_router
from app.api.v1.endpoints.modules import router as modules_router
from app.api.v1.endpoints.platform import router as platform_router
from app.api.v1.endpoints.profile import router as profile_router
from app.api.v1.endpoints.reports import router as reports_router
from app.api.v1.endpoints.student import router as student_router
from app.api.v1.endpoints.lecturer import router as lecturer_router
from app.api.v1.endpoints.users import router as users_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(modules_router)
api_router.include_router(dashboards_router)
api_router.include_router(profile_router)
api_router.include_router(users_router)
api_router.include_router(student_router)
api_router.include_router(lecturer_router)
api_router.include_router(admin_router)
api_router.include_router(academic_router)
api_router.include_router(advisor_router)
api_router.include_router(platform_router)
api_router.include_router(reports_router)
