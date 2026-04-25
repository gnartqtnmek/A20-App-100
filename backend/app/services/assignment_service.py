"""Business logic for assignments and submissions."""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assignment import Assignment, Grade, Submission
from app.models.base import AssignmentType, EnrollmentStatus, SubmissionStatus, UserRole
from app.models.course import CourseEnrollment
from app.schemas.assignment import AssignmentCreate, GradeCreate, SubmissionCreate
from app.services.course_service import get_course_or_404
from app.services.user_service import get_user_or_404


async def get_assignment_or_404(db: AsyncSession, assignment_id: UUID) -> Assignment:
    assignment = await db.get(Assignment, assignment_id)
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return assignment


def _validate_submission_payload(
    assignment_type: AssignmentType,
    payload: SubmissionCreate,
) -> None:
    if assignment_type == AssignmentType.ESSAY and not payload.content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Essay submission requires content",
        )
    if assignment_type == AssignmentType.FILE and (not payload.file_url or not payload.file_name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File submission requires file_url and file_name",
        )
    if assignment_type == AssignmentType.QUIZ and not payload.quiz_answers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz submission requires quiz_answers",
        )


async def create_assignment(db: AsyncSession, payload: AssignmentCreate) -> Assignment:
    await get_course_or_404(db, payload.course_id)

    assignment = Assignment(
        course_id=payload.course_id,
        title=payload.title.strip(),
        description=payload.description,
        type=payload.type,
        due_at=payload.due_at,
        max_score=payload.max_score,
        weight=payload.weight,
        rubric=payload.rubric,
        attachments=payload.attachments,
        time_limit_minutes=payload.time_limit_minutes,
        allow_late=payload.allow_late,
        is_published=payload.is_published,
    )
    db.add(assignment)

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid assignment data",
        ) from exc

    await db.refresh(assignment)
    return assignment


async def list_assignments_by_course(
    db: AsyncSession,
    course_id: UUID,
    published_only: bool | None = None,
) -> list[Assignment]:
    await get_course_or_404(db, course_id)

    statement = select(Assignment).where(Assignment.course_id == course_id)
    if published_only is True:
        statement = statement.where(Assignment.is_published.is_(True))
    statement = statement.order_by(Assignment.created_at.desc())

    result = await db.execute(statement)
    return list(result.scalars().all())


async def submit_assignment(
    db: AsyncSession,
    assignment_id: UUID,
    payload: SubmissionCreate,
) -> Submission:
    assignment = await get_assignment_or_404(db, assignment_id)
    student = await get_user_or_404(db, payload.student_id)

    if student.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only student accounts can submit assignments",
        )

    enrollment_stmt = select(CourseEnrollment).where(
        CourseEnrollment.course_id == assignment.course_id,
        CourseEnrollment.student_id == payload.student_id,
        CourseEnrollment.status == EnrollmentStatus.ACTIVE,
    )
    enrollment_result = await db.execute(enrollment_stmt)
    enrollment = enrollment_result.scalar_one_or_none()
    if enrollment is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student is not actively enrolled in this course",
        )

    _validate_submission_payload(assignment.type, payload)

    now = datetime.now(timezone.utc)
    if assignment.due_at and now > assignment.due_at and not assignment.allow_late:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Deadline has passed and late submissions are disabled",
        )

    submission_stmt = select(Submission).where(
        Submission.assignment_id == assignment_id,
        Submission.student_id == payload.student_id,
    )
    submission_result = await db.execute(submission_stmt)
    submission = submission_result.scalar_one_or_none()

    status_value = SubmissionStatus.SUBMITTED
    if assignment.due_at and now > assignment.due_at:
        status_value = SubmissionStatus.LATE

    if submission is None:
        submission = Submission(
            assignment_id=assignment_id,
            student_id=payload.student_id,
            attempt_count=1,
        )
        db.add(submission)
    else:
        submission.attempt_count += 1

    submission.content = payload.content if assignment.type == AssignmentType.ESSAY else None
    submission.file_url = payload.file_url if assignment.type == AssignmentType.FILE else None
    submission.file_name = payload.file_name if assignment.type == AssignmentType.FILE else None
    submission.quiz_answers = payload.quiz_answers if assignment.type == AssignmentType.QUIZ else None
    submission.status = status_value
    submission.submitted_at = now

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submission data is invalid",
        ) from exc

    await db.refresh(submission)
    return submission


async def list_submissions(
    db: AsyncSession,
    assignment_id: UUID,
    student_id: UUID | None = None,
) -> list[Submission]:
    await get_assignment_or_404(db, assignment_id)

    statement = select(Submission).where(Submission.assignment_id == assignment_id)
    if student_id is not None:
        statement = statement.where(Submission.student_id == student_id)
    statement = statement.order_by(Submission.updated_at.desc())

    result = await db.execute(statement)
    return list(result.scalars().all())


async def get_submission_or_404(db: AsyncSession, submission_id: UUID) -> Submission:
    submission = await db.get(Submission, submission_id)
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    return submission


async def grade_submission(
    db: AsyncSession,
    submission_id: UUID,
    payload: GradeCreate,
    grader_id: UUID,
) -> Grade:
    submission = await get_submission_or_404(db, submission_id)
    assignment = await get_assignment_or_404(db, submission.assignment_id)

    if payload.score > assignment.max_score:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Score cannot exceed assignment max_score",
        )

    now = datetime.now(timezone.utc)
    submission.score = payload.score
    submission.feedback = payload.feedback
    submission.graded_at = now
    submission.graded_by = grader_id
    submission.status = SubmissionStatus.GRADED

    grade = Grade(
        student_id=submission.student_id,
        course_id=assignment.course_id,
        assignment_id=assignment.id,
        score=payload.score,
        max_score=assignment.max_score,
        weight=assignment.weight,
    )
    db.add(grade)
    await db.commit()
    await db.refresh(grade)
    return grade


async def list_grades_by_course(
    db: AsyncSession,
    course_id: UUID,
    student_id: UUID | None = None,
) -> list[Grade]:
    statement = select(Grade).where(Grade.course_id == course_id)
    if student_id is not None:
        statement = statement.where(Grade.student_id == student_id)
    statement = statement.order_by(Grade.recorded_at.desc())
    result = await db.execute(statement)
    return list(result.scalars().all())
