from enum import Enum


class UserRole(str, Enum):
    STUDENT = "student"
    LECTURER = "lecturer"
    ADMIN = "admin"
    ACADEMIC_STAFF = "academic_staff"
    ADVISOR = "advisor"


ALL_ROLES: tuple[UserRole, ...] = (
    UserRole.STUDENT,
    UserRole.LECTURER,
    UserRole.ADMIN,
    UserRole.ACADEMIC_STAFF,
    UserRole.ADVISOR,
)
