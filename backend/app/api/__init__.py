"""API router modules."""

from app.api import assignments, auth, courses, curriculum, grades, health, notifications, users

__all__ = [
	"health",
	"auth",
	"users",
	"courses",
	"curriculum",
	"assignments",
	"grades",
	"notifications",
]
