"""Business-logic layer.

Each service is a small class or set of functions that orchestrates models
and external clients. API routers should call services, never models directly.
"""

from app.services.assignment_service import (
	create_assignment,
	grade_submission,
	get_assignment_or_404,
	get_submission_or_404,
	list_assignments_by_course,
	list_grades_by_course,
	list_submissions,
	submit_assignment,
)
from app.services.auth_service import login, refresh_session, register, revoke_refresh_token
from app.services.course_service import (
	create_course,
	create_lesson,
	create_module,
	ensure_course_owner,
	enroll_student,
	get_course_or_404,
	get_module_or_404,
	list_course_enrollments,
	list_courses,
	list_lessons,
	list_modules,
)
from app.services.notification_service import (
	list_notifications_for_user,
	mark_notification_as_read,
)
from app.services.user_service import create_user, get_user_or_404, list_users

__all__ = [
	"create_user",
	"list_users",
	"get_user_or_404",
	"create_course",
	"list_courses",
	"get_course_or_404",
	"ensure_course_owner",
	"enroll_student",
	"list_course_enrollments",
	"create_module",
	"list_modules",
	"get_module_or_404",
	"create_lesson",
	"list_lessons",
	"create_assignment",
	"list_assignments_by_course",
	"get_assignment_or_404",
	"get_submission_or_404",
	"submit_assignment",
	"list_submissions",
	"grade_submission",
	"list_grades_by_course",
	"list_notifications_for_user",
	"mark_notification_as_read",
	"register",
	"login",
	"refresh_session",
	"revoke_refresh_token",
]
