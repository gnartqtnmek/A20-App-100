from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_roles
from app.core.roles import UserRole
from app.db.session import get_db
from app.models import User
from app.schemas.common import MessageResponse
from app.schemas.lms import (
    AssignmentCreate,
    AssignmentOut,
    AssignmentUpdate,
    AttendanceMarkRequest,
    AttendanceRecordOut,
    AttendanceSessionCreate,
    AttendanceSessionOut,
    CourseDetail,
    CourseSummary,
    GradeItem,
    LessonCreate,
    LessonOut,
    LessonUpdate,
    QuizCreate,
    QuizOut,
    QuizQuestionCreate,
    QuizQuestionOut,
    SectionStudentOut,
    SubmissionGradeRequest,
    SubmissionOut,
)
from app.services.lms_service import (
    add_quiz_question,
    create_assignment,
    create_attendance_session,
    create_lesson,
    create_quiz,
    delete_assignment,
    delete_lesson,
    get_course_detail_for_user,
    grade_submission,
    list_assignments,
    list_attendance_for_section,
    list_attendance_sessions,
    list_gradebook_for_section,
    list_lessons,
    list_quiz_questions,
    list_quizzes,
    list_sections_for_lecturer,
    list_students_for_section,
    list_submissions_for_assignment,
    mark_attendance,
    update_assignment,
    update_lesson,
)

router = APIRouter(prefix="/lecturer", tags=["Lecturer LMS"])


@router.get("/sections", response_model=list[CourseSummary])
async def get_my_sections(
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> list[CourseSummary]:
    return await list_sections_for_lecturer(current_user.id, db)


@router.get("/sections/{section_id}", response_model=CourseDetail)
async def get_section_detail(
    section_id: str,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> CourseDetail:
    return await get_course_detail_for_user(section_id, current_user, db)


@router.get("/sections/{section_id}/lessons", response_model=list[LessonOut])
async def get_section_lessons(
    section_id: str,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> list[LessonOut]:
    return await list_lessons(section_id, current_user, db)


@router.post("/sections/{section_id}/lessons", response_model=LessonOut)
async def create_section_lesson(
    section_id: str,
    payload: LessonCreate,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> LessonOut:
    return await create_lesson(section_id, current_user.id, payload, db)


@router.put("/lessons/{lesson_id}", response_model=LessonOut)
async def update_section_lesson(
    lesson_id: str,
    payload: LessonUpdate,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> LessonOut:
    return await update_lesson(lesson_id, current_user.id, payload, db)


@router.delete("/lessons/{lesson_id}", response_model=MessageResponse)
async def delete_section_lesson(
    lesson_id: str,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await delete_lesson(lesson_id, current_user.id, db)
    return MessageResponse(message="Lesson deleted")


@router.get("/sections/{section_id}/assignments", response_model=list[AssignmentOut])
async def get_section_assignments(
    section_id: str,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> list[AssignmentOut]:
    return await list_assignments(section_id, current_user, db)


@router.post("/sections/{section_id}/assignments", response_model=AssignmentOut)
async def create_section_assignment(
    section_id: str,
    payload: AssignmentCreate,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> AssignmentOut:
    return await create_assignment(section_id, current_user.id, payload, db)


@router.put("/assignments/{assignment_id}", response_model=AssignmentOut)
async def update_section_assignment(
    assignment_id: str,
    payload: AssignmentUpdate,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> AssignmentOut:
    return await update_assignment(assignment_id, current_user.id, payload, db)


@router.delete("/assignments/{assignment_id}", response_model=MessageResponse)
async def delete_section_assignment(
    assignment_id: str,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    await delete_assignment(assignment_id, current_user.id, db)
    return MessageResponse(message="Assignment deleted")


@router.get("/assignments/{assignment_id}/submissions", response_model=list[SubmissionOut])
async def get_assignment_submissions(
    assignment_id: str,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> list[SubmissionOut]:
    return await list_submissions_for_assignment(assignment_id, current_user.id, db)


@router.post("/submissions/{submission_id}/grade", response_model=SubmissionOut)
async def grade_assignment_submission(
    submission_id: str,
    payload: SubmissionGradeRequest,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> SubmissionOut:
    return await grade_submission(submission_id, current_user.id, payload, db)


@router.get("/sections/{section_id}/quizzes", response_model=list[QuizOut])
async def get_section_quizzes(
    section_id: str,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> list[QuizOut]:
    return await list_quizzes(section_id, current_user, db)


@router.post("/sections/{section_id}/quizzes", response_model=QuizOut)
async def create_section_quiz(
    section_id: str,
    payload: QuizCreate,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> QuizOut:
    return await create_quiz(section_id, current_user.id, payload, db)


@router.post("/quizzes/{quiz_id}/questions", response_model=QuizQuestionOut)
async def create_quiz_question(
    quiz_id: str,
    payload: QuizQuestionCreate,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> QuizQuestionOut:
    return await add_quiz_question(quiz_id, current_user.id, payload, db)


@router.get("/quizzes/{quiz_id}/questions", response_model=list[QuizQuestionOut])
async def get_quiz_question_bank(
    quiz_id: str,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> list[QuizQuestionOut]:
    data = await list_quiz_questions(quiz_id, current_user, db)
    return [item for item in data if isinstance(item, QuizQuestionOut)]


@router.get("/sections/{section_id}/gradebook", response_model=list[GradeItem])
async def get_section_gradebook(
    section_id: str,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> list[GradeItem]:
    return await list_gradebook_for_section(section_id, current_user.id, db)


@router.get("/sections/{section_id}/students", response_model=list[SectionStudentOut])
async def get_section_students(
    section_id: str,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> list[SectionStudentOut]:
    return await list_students_for_section(section_id, current_user.id, db)


@router.post("/sections/{section_id}/attendance-sessions", response_model=AttendanceSessionOut)
async def create_section_attendance_session(
    section_id: str,
    payload: AttendanceSessionCreate,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> AttendanceSessionOut:
    return await create_attendance_session(section_id, current_user.id, payload, db)


@router.get("/sections/{section_id}/attendance-sessions", response_model=list[AttendanceSessionOut])
async def get_section_attendance_sessions(
    section_id: str,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> list[AttendanceSessionOut]:
    return await list_attendance_sessions(section_id, current_user, db)


@router.post("/attendance-sessions/{session_id}/mark", response_model=list[AttendanceRecordOut])
async def mark_section_attendance(
    session_id: str,
    payload: AttendanceMarkRequest,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> list[AttendanceRecordOut]:
    return await mark_attendance(session_id, current_user.id, payload, db)


@router.get("/sections/{section_id}/attendance", response_model=list[AttendanceRecordOut])
async def get_section_attendance_records(
    section_id: str,
    current_user: User = Depends(require_roles(UserRole.LECTURER)),
    db: AsyncSession = Depends(get_db),
) -> list[AttendanceRecordOut]:
    return await list_attendance_for_section(section_id, current_user.id, db)
