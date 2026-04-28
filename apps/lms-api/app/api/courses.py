"""Course and enrollment API routes."""
from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, require_roles
from app.db.database import get_db
from app.models.base import UserRole
from app.models.user import User
from app.schemas.course import CourseCreate, CourseRead, EnrollmentCreate, EnrollmentRead
from app.services import course_service

router = APIRouter(prefix="/courses", tags=["courses"])


@router.post("", response_model=CourseRead, status_code=status.HTTP_201_CREATED)
async def create_course(
    payload: CourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.LECTURER, UserRole.ADMIN)),
) -> CourseRead:
    if current_user.role == UserRole.LECTURER:
        payload.lecturer_id = current_user.id
    elif payload.lecturer_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="lecturer_id is required for admin-created courses",
        )
    course = await course_service.create_course(db, payload)
    return CourseRead.model_validate(course)


@router.get("", response_model=list[CourseRead])
async def list_courses(
    lecturer_id: UUID | None = None,
    published_only: bool | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[CourseRead]:
    courses = await course_service.list_courses(db, lecturer_id=lecturer_id, published_only=published_only)
    return [CourseRead.model_validate(item) for item in courses]


@router.get("/{course_id}", response_model=CourseRead)
async def get_course(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
) -> CourseRead:
    course = await course_service.get_course_or_404(db, course_id)
    return CourseRead.model_validate(course)


@router.post("/enroll", response_model=EnrollmentRead, status_code=status.HTTP_201_CREATED)
async def enroll_with_invite_code(
    invite_code: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EnrollmentRead:
    enrollment = await course_service.enroll_by_invite_code(db, invite_code, current_user)
    return EnrollmentRead.model_validate(enrollment)


@router.post("/{course_id}/enrollments", response_model=EnrollmentRead, status_code=status.HTTP_201_CREATED)
async def enroll_student(
    course_id: UUID,
    payload: EnrollmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.LECTURER, UserRole.ADMIN)),
) -> EnrollmentRead:
    await course_service.ensure_course_owner(db, course_id, current_user)
    enrollment = await course_service.enroll_student(db, course_id, payload)
    return EnrollmentRead.model_validate(enrollment)


@router.get("/{course_id}/enrollments", response_model=list[EnrollmentRead])
async def list_course_enrollments(
    course_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.LECTURER, UserRole.ADMIN)),
) -> list[EnrollmentRead]:
    await course_service.ensure_course_owner(db, course_id, current_user)
    enrollments = await course_service.list_course_enrollments(db, course_id)
    return [EnrollmentRead.model_validate(item) for item in enrollments]
