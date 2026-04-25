"""Pydantic schemas (request / response DTOs).

Naming convention: ``XCreate`` / ``XUpdate`` / ``XRead`` per resource.
"""

from app.schemas.assignment import (
	AssignmentCreate,
	AssignmentRead,
	GradeCreate,
	GradeRead,
	SubmissionCreate,
	SubmissionRead,
)
from app.schemas.auth import AuthResponse, RefreshRequest, RegisterRequest, TokenPairRead
from app.schemas.course import (
	CourseCreate,
	CourseRead,
	EnrollmentCreate,
	EnrollmentRead,
	LessonCreate,
	LessonRead,
	ModuleCreate,
	ModuleRead,
)
from app.schemas.notification import NotificationRead
from app.schemas.user import (
	LecturerProfileCreate,
	LecturerProfileRead,
	StudentProfileCreate,
	StudentProfileRead,
	UserCreate,
	UserRead,
)

__all__ = [
	"UserCreate",
	"UserRead",
	"StudentProfileCreate",
	"StudentProfileRead",
	"LecturerProfileCreate",
	"LecturerProfileRead",
	"CourseCreate",
	"CourseRead",
	"EnrollmentCreate",
	"EnrollmentRead",
	"ModuleCreate",
	"ModuleRead",
	"LessonCreate",
	"LessonRead",
	"AssignmentCreate",
	"AssignmentRead",
	"GradeCreate",
	"GradeRead",
	"SubmissionCreate",
	"SubmissionRead",
	"NotificationRead",
	"RegisterRequest",
	"RefreshRequest",
	"TokenPairRead",
	"AuthResponse",
]
