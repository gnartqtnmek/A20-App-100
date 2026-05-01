from app.core.roles import ALL_ROLES, UserRole

ROLE_NAVIGATION: dict[UserRole, list[dict[str, str]]] = {
    UserRole.STUDENT: [
        {"key": "my_courses", "title": "My Courses", "description": "Track enrolled sections", "route": "/dashboard/student"},
        {"key": "assignments", "title": "Assignments", "description": "Submit and review homework", "route": "/dashboard/student"},
        {"key": "quizzes", "title": "Quizzes", "description": "Take tests and check results", "route": "/dashboard/student"},
        {"key": "grades", "title": "Grades", "description": "View gradebook and feedback", "route": "/dashboard/student"},
        {"key": "attendance", "title": "Attendance", "description": "Follow attendance status", "route": "/dashboard/student"},
    ],
    UserRole.LECTURER: [
        {"key": "teaching_sections", "title": "Teaching Sections", "description": "Manage assigned classes", "route": "/dashboard/lecturer"},
        {"key": "lesson_manager", "title": "Lesson Manager", "description": "Publish and organize lessons", "route": "/dashboard/lecturer"},
        {"key": "assignment_review", "title": "Assignment Review", "description": "Grade submissions quickly", "route": "/dashboard/lecturer"},
        {"key": "quiz_center", "title": "Quiz Center", "description": "Control quiz publishing", "route": "/dashboard/lecturer"},
        {"key": "class_analytics", "title": "Class Analytics", "description": "Monitor class performance", "route": "/dashboard/lecturer"},
    ],
    UserRole.ADMIN: [
        {"key": "system_overview", "title": "System Overview", "description": "Monitor full LMS health", "route": "/dashboard/admin"},
        {"key": "user_management", "title": "User Management", "description": "Manage accounts and access", "route": "/dashboard/admin"},
        {"key": "rbac", "title": "Role & Permission", "description": "Control role capabilities", "route": "/dashboard/admin"},
        {"key": "academic_config", "title": "Academic Config", "description": "Maintain terms and structures", "route": "/dashboard/admin"},
        {"key": "audit_security", "title": "Audit & Security", "description": "Review critical events", "route": "/dashboard/admin"},
    ],
    UserRole.ACADEMIC_STAFF: [
        {"key": "faculty_dashboard", "title": "Faculty Dashboard", "description": "Track faculty training status", "route": "/dashboard/academic-staff"},
        {"key": "curriculum", "title": "Curriculum", "description": "Map program and outcomes", "route": "/dashboard/academic-staff"},
        {"key": "section_planning", "title": "Section Planning", "description": "Open and allocate sections", "route": "/dashboard/academic-staff"},
        {"key": "teaching_load", "title": "Teaching Load", "description": "Balance lecturer workload", "route": "/dashboard/academic-staff"},
        {"key": "academic_reports", "title": "Academic Reports", "description": "Publish quality reports", "route": "/dashboard/academic-staff"},
    ],
    UserRole.ADVISOR: [
        {"key": "student_success", "title": "Student Success", "description": "Monitor assigned students", "route": "/dashboard/advisor"},
        {"key": "risk_alerts", "title": "Risk Alerts", "description": "Handle warning and escalation", "route": "/dashboard/advisor"},
        {"key": "counseling", "title": "Counseling", "description": "Schedule advisory sessions", "route": "/dashboard/advisor"},
        {"key": "study_plan", "title": "Study Plan", "description": "Guide semester strategies", "route": "/dashboard/advisor"},
        {"key": "advisor_reports", "title": "Advisor Reports", "description": "Export intervention progress", "route": "/dashboard/advisor"},
    ],
}


def parse_role(role: str) -> UserRole:
    normalized = role.lower().strip()
    for known in ALL_ROLES:
        if known.value == normalized:
            return known
    raise ValueError(f"Unsupported role: {role}")
