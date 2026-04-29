from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import and_, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.roles import UserRole
from app.models import (
    Assignment,
    AttendanceRecord,
    AttendanceSession,
    Course,
    CourseSection,
    Enrollment,
    Grade,
    Lesson,
    Quiz,
    QuizAttempt,
    QuizQuestion,
    Submission,
    User,
)
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
    QuizAttemptResult,
    QuizAttemptSubmit,
    QuizCreate,
    QuizOut,
    QuizQuestionCreate,
    QuizQuestionOut,
    QuizQuestionStudentOut,
    SectionStudentOut,
    SubmissionCreate,
    SubmissionGradeRequest,
    SubmissionOut,
)


async def _get_section(section_id: str, db: AsyncSession) -> CourseSection:
    section = await db.scalar(select(CourseSection).where(CourseSection.id == section_id))
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
    return section


async def _ensure_lecturer_owns_section(section_id: str, lecturer_id: str, db: AsyncSession) -> CourseSection:
    section = await _get_section(section_id, db)
    if section.lecturer_id != lecturer_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Section is not assigned to this lecturer")
    return section


async def _ensure_student_enrolled(section_id: str, student_id: str, db: AsyncSession) -> None:
    enrollment = await db.scalar(
        select(Enrollment).where(
            Enrollment.section_id == section_id,
            Enrollment.student_id == student_id,
            Enrollment.enrollment_status == "active",
        )
    )
    if not enrollment:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Student is not enrolled in this section")


def _map_course_summary(row: tuple[CourseSection, Course, User | None]) -> CourseSummary:
    section, course, lecturer = row
    return CourseSummary(
        course_id=course.id,
        section_id=section.id,
        course_code=course.code,
        course_name=course.name,
        section_code=section.code,
        semester=section.semester,
        lecturer_name=lecturer.full_name if lecturer else None,
    )


def _map_lesson(lesson: Lesson) -> LessonOut:
    return LessonOut(
        id=lesson.id,
        section_id=lesson.section_id,
        title=lesson.title,
        content=lesson.content,
        order_index=lesson.order_index,
        is_published=lesson.is_published,
        created_at=lesson.created_at,
    )


def _map_assignment(assignment: Assignment) -> AssignmentOut:
    return AssignmentOut(
        id=assignment.id,
        section_id=assignment.section_id,
        title=assignment.title,
        description=assignment.description,
        due_at=assignment.due_at,
        max_score=assignment.max_score,
        created_at=assignment.created_at,
    )


def _map_quiz(quiz: Quiz) -> QuizOut:
    return QuizOut(
        id=quiz.id,
        section_id=quiz.section_id,
        title=quiz.title,
        duration_minutes=quiz.duration_minutes,
        max_score=quiz.max_score,
        is_published=quiz.is_published,
        created_at=quiz.created_at,
    )


def _map_submission(submission: Submission, student_name: str | None, grade: Grade | None) -> SubmissionOut:
    return SubmissionOut(
        id=submission.id,
        assignment_id=submission.assignment_id,
        student_id=submission.student_id,
        student_name=student_name,
        content=submission.content,
        submitted_at=submission.submitted_at,
        status=submission.status,
        score=grade.score if grade else None,
        feedback=grade.feedback if grade else None,
    )


async def list_courses_for_student(student_id: str, db: AsyncSession) -> list[CourseSummary]:
    rows = await db.execute(
        select(CourseSection, Course, User)
        .join(Course, Course.id == CourseSection.course_id)
        .join(Enrollment, Enrollment.section_id == CourseSection.id)
        .outerjoin(User, User.id == CourseSection.lecturer_id)
        .where(Enrollment.student_id == student_id, Enrollment.enrollment_status == "active")
        .order_by(CourseSection.created_at.desc())
    )
    return [_map_course_summary(row) for row in rows.all()]


async def list_sections_for_lecturer(lecturer_id: str, db: AsyncSession) -> list[CourseSummary]:
    rows = await db.execute(
        select(CourseSection, Course, User)
        .join(Course, Course.id == CourseSection.course_id)
        .outerjoin(User, User.id == CourseSection.lecturer_id)
        .where(CourseSection.lecturer_id == lecturer_id)
        .order_by(CourseSection.created_at.desc())
    )
    return [_map_course_summary(row) for row in rows.all()]


async def get_course_detail_for_user(section_id: str, current_user: User, db: AsyncSession) -> CourseDetail:
    section = await _get_section(section_id, db)
    if current_user.role == UserRole.STUDENT.value:
        await _ensure_student_enrolled(section_id, current_user.id, db)
    elif current_user.role == UserRole.LECTURER.value and section.lecturer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access this section")

    course = await db.scalar(select(Course).where(Course.id == section.course_id))
    lecturer = None
    if section.lecturer_id:
        lecturer = await db.scalar(select(User).where(User.id == section.lecturer_id))
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")
    return CourseDetail(
        course_id=course.id,
        section_id=section.id,
        course_code=course.code,
        course_name=course.name,
        description=course.description,
        credits=course.credits,
        section_code=section.code,
        semester=section.semester,
        lecturer_name=lecturer.full_name if lecturer else None,
    )


async def list_lessons(section_id: str, current_user: User, db: AsyncSession) -> list[LessonOut]:
    section = await _get_section(section_id, db)
    stmt = select(Lesson).where(Lesson.section_id == section_id)
    if current_user.role == UserRole.STUDENT.value:
        await _ensure_student_enrolled(section_id, current_user.id, db)
        stmt = stmt.where(Lesson.is_published.is_(True))
    elif current_user.role == UserRole.LECTURER.value:
        if section.lecturer_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access lessons in this section")
    lessons = await db.scalars(stmt.order_by(Lesson.order_index.asc(), Lesson.created_at.asc()))
    return [_map_lesson(item) for item in lessons.all()]


async def create_lesson(section_id: str, lecturer_id: str, payload: LessonCreate, db: AsyncSession) -> LessonOut:
    await _ensure_lecturer_owns_section(section_id, lecturer_id, db)
    lesson = Lesson(
        section_id=section_id,
        title=payload.title,
        content=payload.content,
        order_index=payload.order_index,
        is_published=payload.is_published,
    )
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return _map_lesson(lesson)


async def update_lesson(lesson_id: str, lecturer_id: str, payload: LessonUpdate, db: AsyncSession) -> LessonOut:
    lesson = await db.scalar(select(Lesson).where(Lesson.id == lesson_id))
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    await _ensure_lecturer_owns_section(lesson.section_id, lecturer_id, db)
    if payload.title is not None:
        lesson.title = payload.title
    if payload.content is not None:
        lesson.content = payload.content
    if payload.order_index is not None:
        lesson.order_index = payload.order_index
    if payload.is_published is not None:
        lesson.is_published = payload.is_published
    await db.commit()
    await db.refresh(lesson)
    return _map_lesson(lesson)


async def delete_lesson(lesson_id: str, lecturer_id: str, db: AsyncSession) -> None:
    lesson = await db.scalar(select(Lesson).where(Lesson.id == lesson_id))
    if not lesson:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson not found")
    await _ensure_lecturer_owns_section(lesson.section_id, lecturer_id, db)
    await db.delete(lesson)
    await db.commit()


async def list_assignments(section_id: str, current_user: User, db: AsyncSession) -> list[AssignmentOut]:
    section = await _get_section(section_id, db)
    if current_user.role == UserRole.STUDENT.value:
        await _ensure_student_enrolled(section_id, current_user.id, db)
    elif current_user.role == UserRole.LECTURER.value and section.lecturer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access assignments")
    rows = await db.scalars(select(Assignment).where(Assignment.section_id == section_id).order_by(Assignment.created_at.desc()))
    return [_map_assignment(item) for item in rows.all()]


async def create_assignment(section_id: str, lecturer_id: str, payload: AssignmentCreate, db: AsyncSession) -> AssignmentOut:
    await _ensure_lecturer_owns_section(section_id, lecturer_id, db)
    assignment = Assignment(
        section_id=section_id,
        title=payload.title,
        description=payload.description,
        due_at=payload.due_at,
        max_score=payload.max_score,
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return _map_assignment(assignment)


async def update_assignment(assignment_id: str, lecturer_id: str, payload: AssignmentUpdate, db: AsyncSession) -> AssignmentOut:
    assignment = await db.scalar(select(Assignment).where(Assignment.id == assignment_id))
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    await _ensure_lecturer_owns_section(assignment.section_id, lecturer_id, db)
    if payload.title is not None:
        assignment.title = payload.title
    if payload.description is not None:
        assignment.description = payload.description
    if payload.due_at is not None:
        assignment.due_at = payload.due_at
    if payload.max_score is not None:
        assignment.max_score = payload.max_score
    await db.commit()
    await db.refresh(assignment)
    return _map_assignment(assignment)


async def delete_assignment(assignment_id: str, lecturer_id: str, db: AsyncSession) -> None:
    assignment = await db.scalar(select(Assignment).where(Assignment.id == assignment_id))
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    await _ensure_lecturer_owns_section(assignment.section_id, lecturer_id, db)
    await db.delete(assignment)
    await db.commit()


async def submit_assignment(assignment_id: str, student_id: str, payload: SubmissionCreate, db: AsyncSession) -> SubmissionOut:
    assignment = await db.scalar(select(Assignment).where(Assignment.id == assignment_id))
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    await _ensure_student_enrolled(assignment.section_id, student_id, db)

    submission = await db.scalar(
        select(Submission).where(Submission.assignment_id == assignment_id, Submission.student_id == student_id)
    )
    if submission:
        submission.content = payload.content
        submission.submitted_at = datetime.utcnow()
        submission.status = "resubmitted"
    else:
        submission = Submission(
            assignment_id=assignment_id,
            student_id=student_id,
            content=payload.content,
            submitted_at=datetime.utcnow(),
            status="submitted",
        )
        db.add(submission)
    await db.commit()
    await db.refresh(submission)
    student = await db.scalar(select(User).where(User.id == student_id))
    return _map_submission(submission, student.full_name if student else None, None)


async def list_submissions_for_assignment(assignment_id: str, lecturer_id: str, db: AsyncSession) -> list[SubmissionOut]:
    assignment = await db.scalar(select(Assignment).where(Assignment.id == assignment_id))
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    await _ensure_lecturer_owns_section(assignment.section_id, lecturer_id, db)

    rows = await db.execute(
        select(Submission, User, Grade)
        .join(User, User.id == Submission.student_id)
        .outerjoin(Grade, and_(Grade.source_type == "assignment", Grade.source_id == Submission.id))
        .where(Submission.assignment_id == assignment_id)
        .order_by(Submission.submitted_at.desc())
    )
    return [_map_submission(submission, student.full_name, grade) for submission, student, grade in rows.all()]


async def grade_submission(submission_id: str, lecturer_id: str, payload: SubmissionGradeRequest, db: AsyncSession) -> SubmissionOut:
    submission = await db.scalar(select(Submission).where(Submission.id == submission_id))
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Submission not found")
    assignment = await db.scalar(select(Assignment).where(Assignment.id == submission.assignment_id))
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    await _ensure_lecturer_owns_section(assignment.section_id, lecturer_id, db)
    if payload.score > assignment.max_score:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Score exceeds assignment max score")

    grade = await db.scalar(
        select(Grade).where(Grade.source_type == "assignment", Grade.source_id == submission.id, Grade.student_id == submission.student_id)
    )
    if not grade:
        grade = Grade(
            student_id=submission.student_id,
            section_id=assignment.section_id,
            source_type="assignment",
            source_id=submission.id,
            score=payload.score,
            feedback=payload.feedback,
        )
        db.add(grade)
    else:
        grade.score = payload.score
        grade.feedback = payload.feedback
    submission.status = "graded"
    await db.commit()
    await db.refresh(submission)
    student = await db.scalar(select(User).where(User.id == submission.student_id))
    return _map_submission(submission, student.full_name if student else None, grade)


async def list_quizzes(section_id: str, current_user: User, db: AsyncSession) -> list[QuizOut]:
    section = await _get_section(section_id, db)
    stmt = select(Quiz).where(Quiz.section_id == section_id)
    if current_user.role == UserRole.STUDENT.value:
        await _ensure_student_enrolled(section_id, current_user.id, db)
        stmt = stmt.where(Quiz.is_published.is_(True))
    elif current_user.role == UserRole.LECTURER.value and section.lecturer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access quizzes")
    quizzes = await db.scalars(stmt.order_by(Quiz.created_at.desc()))
    return [_map_quiz(item) for item in quizzes.all()]


async def create_quiz(section_id: str, lecturer_id: str, payload: QuizCreate, db: AsyncSession) -> QuizOut:
    await _ensure_lecturer_owns_section(section_id, lecturer_id, db)
    quiz = Quiz(
        section_id=section_id,
        title=payload.title,
        duration_minutes=payload.duration_minutes,
        max_score=payload.max_score,
        is_published=payload.is_published,
    )
    db.add(quiz)
    await db.commit()
    await db.refresh(quiz)
    return _map_quiz(quiz)


async def add_quiz_question(quiz_id: str, lecturer_id: str, payload: QuizQuestionCreate, db: AsyncSession) -> QuizQuestionOut:
    quiz = await db.scalar(select(Quiz).where(Quiz.id == quiz_id))
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    await _ensure_lecturer_owns_section(quiz.section_id, lecturer_id, db)
    if payload.correct_answer not in payload.options:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Correct answer must be one of options")
    question = QuizQuestion(
        quiz_id=quiz_id,
        prompt=payload.prompt,
        options=payload.options,
        correct_answer=payload.correct_answer,
        points=payload.points,
        order_index=payload.order_index,
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)
    return QuizQuestionOut(
        id=question.id,
        quiz_id=question.quiz_id,
        prompt=question.prompt,
        options=question.options or [],
        points=question.points,
        order_index=question.order_index,
    )


async def list_quiz_questions(quiz_id: str, current_user: User, db: AsyncSession) -> list[QuizQuestionOut | QuizQuestionStudentOut]:
    quiz = await db.scalar(select(Quiz).where(Quiz.id == quiz_id))
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    if current_user.role == UserRole.STUDENT.value:
        await _ensure_student_enrolled(quiz.section_id, current_user.id, db)
        if not quiz.is_published:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Quiz is not published")
    elif current_user.role == UserRole.LECTURER.value:
        section = await _get_section(quiz.section_id, db)
        if section.lecturer_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access quiz questions")
    questions = await db.scalars(select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id).order_by(QuizQuestion.order_index.asc()))
    if current_user.role == UserRole.STUDENT.value:
        return [
            QuizQuestionStudentOut(
                id=item.id,
                quiz_id=item.quiz_id,
                prompt=item.prompt,
                options=item.options or [],
                points=item.points,
                order_index=item.order_index,
            )
            for item in questions.all()
        ]
    return [
        QuizQuestionOut(
            id=item.id,
            quiz_id=item.quiz_id,
            prompt=item.prompt,
            options=item.options or [],
            points=item.points,
            order_index=item.order_index,
        )
        for item in questions.all()
    ]


async def submit_quiz_attempt(quiz_id: str, student_id: str, payload: QuizAttemptSubmit, db: AsyncSession) -> QuizAttemptResult:
    quiz = await db.scalar(select(Quiz).where(Quiz.id == quiz_id))
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    if not quiz.is_published:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Quiz is not published")
    await _ensure_student_enrolled(quiz.section_id, student_id, db)
    questions = await db.scalars(select(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id))
    items = questions.all()
    if not items:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Quiz has no questions")

    total_points = sum(item.points for item in items) or 1.0
    earned_points = 0.0
    for item in items:
        answer = payload.answers.get(item.id)
        if answer and answer == item.correct_answer:
            earned_points += item.points
    score = round((earned_points / total_points) * quiz.max_score, 2)

    attempt = await db.scalar(select(QuizAttempt).where(QuizAttempt.quiz_id == quiz_id, QuizAttempt.student_id == student_id))
    now = datetime.utcnow()
    if not attempt:
        attempt = QuizAttempt(
            quiz_id=quiz_id,
            student_id=student_id,
            answers=payload.answers,
            score=score,
            submitted_at=now,
        )
        db.add(attempt)
    else:
        attempt.answers = payload.answers
        attempt.score = score
        attempt.submitted_at = now

    grade = await db.scalar(
        select(Grade).where(Grade.source_type == "quiz", Grade.source_id == quiz.id, Grade.student_id == student_id)
    )
    feedback = "Auto graded multiple-choice quiz"
    if not grade:
        grade = Grade(
            student_id=student_id,
            section_id=quiz.section_id,
            source_type="quiz",
            source_id=quiz.id,
            score=score,
            feedback=feedback,
        )
        db.add(grade)
    else:
        grade.score = score
        grade.feedback = feedback

    await db.commit()
    await db.refresh(attempt)
    return QuizAttemptResult(
        attempt_id=attempt.id,
        quiz_id=attempt.quiz_id,
        score=attempt.score,
        max_score=quiz.max_score,
        submitted_at=attempt.submitted_at,
    )


async def list_grades_for_student(student_id: str, db: AsyncSession) -> list[GradeItem]:
    rows = await db.execute(
        select(Grade, Assignment.title, Quiz.title, User.full_name)
        .outerjoin(Assignment, and_(Grade.source_type == "assignment", Grade.source_id == Assignment.id))
        .outerjoin(Quiz, and_(Grade.source_type == "quiz", Grade.source_id == Quiz.id))
        .join(User, User.id == Grade.student_id)
        .where(Grade.student_id == student_id)
        .order_by(Grade.created_at.desc())
    )
    result: list[GradeItem] = []
    for grade, assignment_title, quiz_title, student_name in rows.all():
        result.append(
            GradeItem(
                id=grade.id,
                source_type=grade.source_type,
                source_id=grade.source_id,
                source_title=assignment_title or quiz_title or grade.source_type,
                score=grade.score,
                feedback=grade.feedback,
                section_id=grade.section_id,
                student_id=grade.student_id,
                student_name=student_name,
                created_at=grade.created_at,
            )
        )
    return result


async def list_gradebook_for_section(section_id: str, lecturer_id: str, db: AsyncSession) -> list[GradeItem]:
    await _ensure_lecturer_owns_section(section_id, lecturer_id, db)
    rows = await db.execute(
        select(Grade, Assignment.title, Quiz.title, User.full_name)
        .outerjoin(Assignment, and_(Grade.source_type == "assignment", Grade.source_id == Assignment.id))
        .outerjoin(Quiz, and_(Grade.source_type == "quiz", Grade.source_id == Quiz.id))
        .join(User, User.id == Grade.student_id)
        .where(Grade.section_id == section_id)
        .order_by(Grade.created_at.desc())
    )
    result: list[GradeItem] = []
    for grade, assignment_title, quiz_title, student_name in rows.all():
        result.append(
            GradeItem(
                id=grade.id,
                source_type=grade.source_type,
                source_id=grade.source_id,
                source_title=assignment_title or quiz_title or grade.source_type,
                score=grade.score,
                feedback=grade.feedback,
                section_id=grade.section_id,
                student_id=grade.student_id,
                student_name=student_name,
                created_at=grade.created_at,
            )
        )
    return result


async def create_attendance_session(
    section_id: str, lecturer_id: str, payload: AttendanceSessionCreate, db: AsyncSession
) -> AttendanceSessionOut:
    await _ensure_lecturer_owns_section(section_id, lecturer_id, db)
    session = AttendanceSession(
        section_id=section_id,
        lecturer_id=lecturer_id,
        session_date=payload.session_date,
        title=payload.title,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return AttendanceSessionOut(
        id=session.id,
        section_id=session.section_id,
        session_date=session.session_date,
        title=session.title,
        lecturer_id=session.lecturer_id,
    )


async def list_attendance_sessions(section_id: str, current_user: User, db: AsyncSession) -> list[AttendanceSessionOut]:
    section = await _get_section(section_id, db)
    if current_user.role == UserRole.STUDENT.value:
        await _ensure_student_enrolled(section_id, current_user.id, db)
    elif current_user.role == UserRole.LECTURER.value and section.lecturer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot access attendance sessions")
    rows = await db.scalars(
        select(AttendanceSession).where(AttendanceSession.section_id == section_id).order_by(AttendanceSession.session_date.desc())
    )
    return [
        AttendanceSessionOut(
            id=item.id,
            section_id=item.section_id,
            session_date=item.session_date,
            title=item.title,
            lecturer_id=item.lecturer_id,
        )
        for item in rows.all()
    ]


async def mark_attendance(
    session_id: str, lecturer_id: str, payload: AttendanceMarkRequest, db: AsyncSession
) -> list[AttendanceRecordOut]:
    session = await db.scalar(select(AttendanceSession).where(AttendanceSession.id == session_id))
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attendance session not found")
    await _ensure_lecturer_owns_section(session.section_id, lecturer_id, db)

    enrolled_student_ids = set(
        (
            await db.scalars(
                select(Enrollment.student_id).where(
                    Enrollment.section_id == session.section_id, Enrollment.enrollment_status == "active"
                )
            )
        ).all()
    )
    result: list[AttendanceRecordOut] = []
    for item in payload.records:
        if item.student_id not in enrolled_student_ids:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Student is not enrolled in section")

        record = await db.scalar(
            select(AttendanceRecord).where(
                AttendanceRecord.section_id == session.section_id,
                AttendanceRecord.student_id == item.student_id,
                AttendanceRecord.attendance_date == session.session_date,
            )
        )
        if not record:
            record = AttendanceRecord(
                section_id=session.section_id,
                student_id=item.student_id,
                attendance_date=session.session_date,
                status=item.status,
                note=item.note,
            )
            db.add(record)
        else:
            record.status = item.status
            record.note = item.note
    await db.commit()

    rows = await db.execute(
        select(AttendanceRecord, User)
        .join(User, User.id == AttendanceRecord.student_id)
        .where(AttendanceRecord.section_id == session.section_id, AttendanceRecord.attendance_date == session.session_date)
    )
    for record, student in rows.all():
        result.append(
            AttendanceRecordOut(
                id=record.id,
                section_id=record.section_id,
                student_id=record.student_id,
                student_name=student.full_name,
                attendance_date=record.attendance_date,
                status=record.status,
                note=record.note,
            )
        )
    return result


async def list_attendance_for_student(student_id: str, section_id: str | None, db: AsyncSession) -> list[AttendanceRecordOut]:
    stmt = (
        select(AttendanceRecord, User)
        .join(User, User.id == AttendanceRecord.student_id)
        .where(AttendanceRecord.student_id == student_id)
    )
    if section_id:
        await _ensure_student_enrolled(section_id, student_id, db)
        stmt = stmt.where(AttendanceRecord.section_id == section_id)
    rows = await db.execute(stmt.order_by(AttendanceRecord.attendance_date.desc()))
    return [
        AttendanceRecordOut(
            id=record.id,
            section_id=record.section_id,
            student_id=record.student_id,
            student_name=student.full_name,
            attendance_date=record.attendance_date,
            status=record.status,
            note=record.note,
        )
        for record, student in rows.all()
    ]


async def list_attendance_for_section(section_id: str, lecturer_id: str, db: AsyncSession) -> list[AttendanceRecordOut]:
    await _ensure_lecturer_owns_section(section_id, lecturer_id, db)
    rows = await db.execute(
        select(AttendanceRecord, User)
        .join(User, User.id == AttendanceRecord.student_id)
        .where(AttendanceRecord.section_id == section_id)
        .order_by(AttendanceRecord.attendance_date.desc())
    )
    return [
        AttendanceRecordOut(
            id=record.id,
            section_id=record.section_id,
            student_id=record.student_id,
            student_name=student.full_name,
            attendance_date=record.attendance_date,
            status=record.status,
            note=record.note,
        )
        for record, student in rows.all()
    ]


async def list_students_for_section(section_id: str, lecturer_id: str, db: AsyncSession) -> list[SectionStudentOut]:
    await _ensure_lecturer_owns_section(section_id, lecturer_id, db)
    rows = await db.execute(
        select(User)
        .join(Enrollment, Enrollment.student_id == User.id)
        .where(Enrollment.section_id == section_id, Enrollment.enrollment_status == "active")
        .order_by(User.full_name.asc())
    )
    return [SectionStudentOut(student_id=item.id, full_name=item.full_name, email=item.email) for item in rows.scalars().all()]


async def remove_quiz_questions(quiz_id: str, lecturer_id: str, db: AsyncSession) -> None:
    quiz = await db.scalar(select(Quiz).where(Quiz.id == quiz_id))
    if not quiz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found")
    await _ensure_lecturer_owns_section(quiz.section_id, lecturer_id, db)
    await db.execute(delete(QuizQuestion).where(QuizQuestion.quiz_id == quiz_id))
    await db.commit()


async def section_submission_count(section_id: str, db: AsyncSession) -> int:
    count = await db.scalar(
        select(func.count(Submission.id))
        .join(Assignment, Assignment.id == Submission.assignment_id)
        .where(Assignment.section_id == section_id)
    )
    return int(count or 0)
