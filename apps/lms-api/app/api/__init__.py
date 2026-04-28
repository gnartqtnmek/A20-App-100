"""API router modules."""

from app.api import (
    admin,
    agent_tools,
    assignments,
    auth,
    courses,
    curriculum,
    grades,
    health,
    notifications,
    users,
)

__all__ = [
    "health",
    "auth",
    "admin",
    "users",
    "courses",
    "curriculum",
    "assignments",
    "grades",
    "notifications",
    "agent_tools",
]
