from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CourseSummary(BaseModel):
    course_id: str
    section_id: str
    course_code: str
    course_name: str
    section_code: str
    semester: str
    lecturer_name: str | None = None


class CourseDetail(BaseModel):
    course_id: str
    section_id: str
    course_code: str
    course_name: str
    description: str
    credits: int
    section_code: str
    semester: str
    lecturer_name: str | None = None


class LessonCreate(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    content: str = ""
    order_index: int = Field(default=1, ge=1)
    is_published: bool = False


class LessonUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=150)
    content: str | None = None
    order_index: int | None = Field(default=None, ge=1)
    is_published: bool | None = None


class LessonOut(BaseModel):
    id: str
    section_id: str
    title: str
    content: str
    order_index: int
    is_published: bool
    created_at: datetime


class AssignmentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    description: str = ""
    due_at: datetime | None = None
    max_score: float = Field(default=10.0, gt=0)


class AssignmentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None
    due_at: datetime | None = None
    max_score: float | None = Field(default=None, gt=0)


class AssignmentOut(BaseModel):
    id: str
    section_id: str
    title: str
    description: str
    due_at: datetime | None = None
    max_score: float
    created_at: datetime


class SubmissionCreate(BaseModel):
    content: str = Field(min_length=1)


class SubmissionGradeRequest(BaseModel):
    score: float = Field(ge=0)
    feedback: str = ""


class SubmissionOut(BaseModel):
    id: str
    assignment_id: str
    student_id: str
    student_name: str | None = None
    content: str
    submitted_at: datetime
    status: str
    score: float | None = None
    feedback: str | None = None


class QuizCreate(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    duration_minutes: int = Field(default=30, ge=1, le=240)
    max_score: float = Field(default=10.0, gt=0)
    is_published: bool = False


class QuizOut(BaseModel):
    id: str
    section_id: str
    title: str
    duration_minutes: int
    max_score: float
    is_published: bool
    created_at: datetime


class QuizQuestionCreate(BaseModel):
    prompt: str = Field(min_length=1)
    options: list[str] = Field(min_length=2)
    correct_answer: str = Field(min_length=1)
    points: float = Field(default=1.0, gt=0)
    order_index: int = Field(default=1, ge=1)


class QuizQuestionOut(BaseModel):
    id: str
    quiz_id: str
    prompt: str
    options: list[str]
    points: float
    order_index: int


class QuizQuestionStudentOut(BaseModel):
    id: str
    quiz_id: str
    prompt: str
    options: list[str]
    points: float
    order_index: int


class QuizAttemptSubmit(BaseModel):
    answers: dict[str, str]


class QuizAttemptResult(BaseModel):
    attempt_id: str
    quiz_id: str
    score: float
    max_score: float
    submitted_at: datetime


class GradeItem(BaseModel):
    id: str
    source_type: str
    source_id: str
    source_title: str
    score: float
    feedback: str
    section_id: str
    student_id: str
    student_name: str | None = None
    created_at: datetime


class AttendanceSessionCreate(BaseModel):
    session_date: datetime
    title: str = "Attendance Session"


class AttendanceSessionOut(BaseModel):
    id: str
    section_id: str
    session_date: datetime
    title: str
    lecturer_id: str | None = None


class AttendanceMarkItem(BaseModel):
    student_id: str
    status: str = Field(pattern="^(present|absent|late)$")
    note: str = ""


class AttendanceMarkRequest(BaseModel):
    records: list[AttendanceMarkItem] = Field(min_length=1)


class AttendanceRecordOut(BaseModel):
    id: str
    section_id: str
    student_id: str
    student_name: str | None = None
    attendance_date: datetime
    status: str
    note: str


class SectionStudentOut(BaseModel):
    student_id: str
    full_name: str
    email: str
