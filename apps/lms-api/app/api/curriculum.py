"""Curriculum APIs for modules and lessons."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_roles
from app.db.database import get_db
from app.models.base import UserRole
from app.models.user import User
from app.schemas.course import LessonCreate, LessonRead, ModuleCreate, ModuleRead
from app.services import course_service

router = APIRouter(prefix="/curriculum", tags=["curriculum"])


@router.post(
    "/courses/{course_id}/modules",
    response_model=ModuleRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_module(
    course_id: UUID,
    payload: ModuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.LECTURER, UserRole.ADMIN)),
) -> ModuleRead:
    await course_service.ensure_course_owner(db, course_id, current_user)
    module = await course_service.create_module(db, course_id, payload)
    return ModuleRead.model_validate(module)


@router.get("/courses/{course_id}/modules", response_model=list[ModuleRead])
async def list_modules(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[ModuleRead]:
    modules = await course_service.list_modules(db, course_id)
    return [ModuleRead.model_validate(item) for item in modules]


@router.post(
    "/modules/{module_id}/lessons",
    response_model=LessonRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_lesson(
    module_id: UUID,
    payload: LessonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.LECTURER, UserRole.ADMIN)),
) -> LessonRead:
    module = await course_service.get_module_or_404(db, module_id)
    await course_service.ensure_course_owner(db, module.course_id, current_user)
    lesson = await course_service.create_lesson(db, module_id, payload)
    return LessonRead.model_validate(lesson)


@router.get("/modules/{module_id}/lessons", response_model=list[LessonRead])
async def list_lessons(
    module_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[LessonRead]:
    lessons = await course_service.list_lessons(db, module_id)
    return [LessonRead.model_validate(item) for item in lessons]
