"""Business logic for course and enrollment operations."""
from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import EnrollmentStatus, UserRole
from app.models.course import Course, CourseEnrollment, Lesson, Module
from app.models.user import User
from app.schemas.course import CourseCreate, EnrollmentCreate, LessonCreate, ModuleCreate
from app.services.user_service import get_user_or_404


async def get_course_or_404(db: AsyncSession, course_id: UUID) -> Course:
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return course


async def create_course(db: AsyncSession, payload: CourseCreate) -> Course:
    if payload.lecturer_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="lecturer_id is required",
        )

    lecturer = await get_user_or_404(db, payload.lecturer_id)
    if lecturer.role not in {UserRole.LECTURER, UserRole.ADMIN}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only lecturer/admin can own a course",
        )

    course = Course(
        code=payload.code.strip().upper(),
        name=payload.name.strip(),
        description=payload.description,
        syllabus_md=payload.syllabus_md,
        lecturer_id=payload.lecturer_id,
        semester=payload.semester,
        is_published=payload.is_published,
        invite_code=payload.invite_code,
        cover_image_url=payload.cover_image_url,
    )
    db.add(course)

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Course code/invite code must be unique",
        ) from exc

    await db.refresh(course)
    return course


async def list_courses(
    db: AsyncSession,
    lecturer_id: UUID | None = None,
    published_only: bool | None = None,
) -> list[Course]:
    statement = select(Course).order_by(Course.created_at.desc())

    if lecturer_id is not None:
        statement = statement.where(Course.lecturer_id == lecturer_id)
    if published_only is True:
        statement = statement.where(Course.is_published.is_(True))

    result = await db.execute(statement)
    return list(result.scalars().all())


async def enroll_student(
    db: AsyncSession,
    course_id: UUID,
    payload: EnrollmentCreate,
) -> CourseEnrollment:
    await get_course_or_404(db, course_id)
    student = await get_user_or_404(db, payload.student_id)

    if student.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only student accounts can be enrolled",
        )

    existing_stmt = select(CourseEnrollment).where(
        CourseEnrollment.course_id == course_id,
        CourseEnrollment.student_id == payload.student_id,
    )
    existing_result = await db.execute(existing_stmt)
    enrollment = existing_result.scalar_one_or_none()

    if enrollment is None:
        enrollment = CourseEnrollment(
            course_id=course_id,
            student_id=payload.student_id,
            status=payload.status,
        )
        db.add(enrollment)
    else:
        enrollment.status = payload.status
        if payload.status == EnrollmentStatus.ACTIVE:
            enrollment.student_id = payload.student_id

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid enrollment data",
        ) from exc

    await db.refresh(enrollment)
    return enrollment


async def list_course_enrollments(db: AsyncSession, course_id: UUID) -> list[CourseEnrollment]:
    await get_course_or_404(db, course_id)
    statement = select(CourseEnrollment).where(
        CourseEnrollment.course_id == course_id
    ).order_by(CourseEnrollment.created_at.desc())
    result = await db.execute(statement)
    return list(result.scalars().all())


async def enroll_by_invite_code(
    db: AsyncSession,
    invite_code: str,
    student: User,
) -> CourseEnrollment:
    from app.models.base import UserRole

    if student.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only student accounts can enroll with an invite code",
        )

    stmt = select(Course).where(Course.invite_code == invite_code.strip())
    result = await db.execute(stmt)
    course = result.scalar_one_or_none()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invite code",
        )
    if not course.is_published:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This course is not open for enrollment",
        )

    existing_stmt = select(CourseEnrollment).where(
        CourseEnrollment.course_id == course.id,
        CourseEnrollment.student_id == student.id,
    )
    existing_result = await db.execute(existing_stmt)
    enrollment = existing_result.scalar_one_or_none()
    if enrollment is not None:
        return enrollment

    enrollment = CourseEnrollment(
        course_id=course.id,
        student_id=student.id,
        status=EnrollmentStatus.ACTIVE,
    )
    db.add(enrollment)
    await db.commit()
    await db.refresh(enrollment)
    return enrollment


async def ensure_course_owner(db: AsyncSession, course_id: UUID, actor: User) -> Course:
    course = await get_course_or_404(db, course_id)
    if actor.role == UserRole.ADMIN:
        return course
    if actor.role == UserRole.LECTURER and course.lecturer_id == actor.id:
        return course

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to manage this course",
    )


async def create_module(db: AsyncSession, course_id: UUID, payload: ModuleCreate) -> Module:
    await get_course_or_404(db, course_id)
    module = Module(
        course_id=course_id,
        title=payload.title.strip(),
        description=payload.description,
        order_index=payload.order_index,
    )
    db.add(module)
    await db.commit()
    await db.refresh(module)
    return module


async def list_modules(db: AsyncSession, course_id: UUID) -> list[Module]:
    await get_course_or_404(db, course_id)
    statement = select(Module).where(Module.course_id == course_id).order_by(Module.order_index.asc())
    result = await db.execute(statement)
    return list(result.scalars().all())


async def get_module_or_404(db: AsyncSession, module_id: UUID) -> Module:
    module = await db.get(Module, module_id)
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Module not found")
    return module


async def create_lesson(db: AsyncSession, module_id: UUID, payload: LessonCreate) -> Lesson:
    await get_module_or_404(db, module_id)
    lesson = Lesson(
        module_id=module_id,
        title=payload.title.strip(),
        content_md=payload.content_md,
        video_url=payload.video_url,
        attachments=payload.attachments,
        order_index=payload.order_index,
        duration_minutes=payload.duration_minutes,
    )
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson


async def list_lessons(db: AsyncSession, module_id: UUID) -> list[Lesson]:
    await get_module_or_404(db, module_id)
    statement = select(Lesson).where(Lesson.module_id == module_id).order_by(Lesson.order_index.asc())
    result = await db.execute(statement)
    return list(result.scalars().all())
