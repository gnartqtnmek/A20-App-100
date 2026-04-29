from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles
from app.core.roles import UserRole
from app.db.session import get_db
from app.models import User
from app.schemas.lms import (
    AssignmentOut,
    AttendanceRecordOut,
    CourseDetail,
    CourseSummary,
    GradeItem,
    LessonOut,
    QuizAttemptResult,
    QuizAttemptSubmit,
    QuizOut,
    QuizQuestionStudentOut,
    SubmissionCreate,
    SubmissionOut,
)
from app.services.lms_service import (
    get_course_detail_for_user,
    list_assignments,
    list_attendance_for_student,
    list_courses_for_student,
    list_grades_for_student,
    list_lessons,
    list_quiz_questions,
    list_quizzes,
    submit_assignment,
    submit_quiz_attempt,
)

router = APIRouter(prefix="/student", tags=["Student LMS"])


@router.get("/courses", response_model=list[CourseSummary])
async def get_my_courses(
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db),
) -> list[CourseSummary]:
    return await list_courses_for_student(current_user.id, db)


@router.get("/courses/{section_id}", response_model=CourseDetail)
async def get_my_course_detail(
    section_id: str,
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db),
) -> CourseDetail:
    return await get_course_detail_for_user(section_id, current_user, db)


@router.get("/courses/{section_id}/lessons", response_model=list[LessonOut])
async def get_my_lessons(
    section_id: str,
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db),
) -> list[LessonOut]:
    return await list_lessons(section_id, current_user, db)


@router.get("/courses/{section_id}/assignments", response_model=list[AssignmentOut])
async def get_my_assignments(
    section_id: str,
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db),
) -> list[AssignmentOut]:
    return await list_assignments(section_id, current_user, db)


@router.post("/assignments/{assignment_id}/submit", response_model=SubmissionOut)
async def submit_my_assignment(
    assignment_id: str,
    payload: SubmissionCreate,
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db),
) -> SubmissionOut:
    return await submit_assignment(assignment_id, current_user.id, payload, db)


@router.get("/courses/{section_id}/quizzes", response_model=list[QuizOut])
async def get_my_quizzes(
    section_id: str,
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db),
) -> list[QuizOut]:
    return await list_quizzes(section_id, current_user, db)


@router.get("/quizzes/{quiz_id}/questions", response_model=list[QuizQuestionStudentOut])
async def get_quiz_questions(
    quiz_id: str,
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db),
) -> list[QuizQuestionStudentOut]:
    data = await list_quiz_questions(quiz_id, current_user, db)
    return [item for item in data if isinstance(item, QuizQuestionStudentOut)]


@router.post("/quizzes/{quiz_id}/submit", response_model=QuizAttemptResult)
async def submit_my_quiz(
    quiz_id: str,
    payload: QuizAttemptSubmit,
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db),
) -> QuizAttemptResult:
    return await submit_quiz_attempt(quiz_id, current_user.id, payload, db)


@router.get("/grades", response_model=list[GradeItem])
async def get_my_grades(
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db),
) -> list[GradeItem]:
    return await list_grades_for_student(current_user.id, db)


@router.get("/attendance", response_model=list[AttendanceRecordOut])
async def get_my_attendance(
    section_id: str | None = Query(default=None),
    current_user: User = Depends(require_roles(UserRole.STUDENT)),
    db: AsyncSession = Depends(get_db),
) -> list[AttendanceRecordOut]:
    return await list_attendance_for_student(current_user.id, section_id, db)
