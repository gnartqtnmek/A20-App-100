from app.core.roles import UserRole
from app.schemas.dashboard import DashboardSummaryResponse, HeroCard, MetricCard
from app.services.role_catalog import ROLE_NAVIGATION


DASHBOARD_HEADLINES: dict[UserRole, tuple[str, str]] = {
    UserRole.STUDENT: ("Learning Momentum", "Stay on top of deadlines and build consistent progress."),
    UserRole.LECTURER: ("Teaching Command Center", "Manage classes, grading, and interventions in one place."),
    UserRole.ADMIN: ("System Control Tower", "Observe operations, governance, and platform reliability."),
    UserRole.ACADEMIC_STAFF: ("Academic Operations Hub", "Coordinate curriculum, sections, and teaching quality."),
    UserRole.ADVISOR: ("Student Success Radar", "Identify risks early and guide students with precision."),
}

DASHBOARD_METRICS: dict[UserRole, list[MetricCard]] = {
    UserRole.STUDENT: [
        MetricCard(label="Courses in Progress", value="6", trend="+1 this term"),
        MetricCard(label="Upcoming Deadlines", value="4", trend="2 due this week"),
        MetricCard(label="Average Grade", value="8.4/10", trend="+0.3 vs last month"),
    ],
    UserRole.LECTURER: [
        MetricCard(label="Active Sections", value="5", trend="42 students at risk"),
        MetricCard(label="Submissions to Grade", value="27", trend="-8 since yesterday"),
        MetricCard(label="Published Lessons", value="31", trend="+6 this month"),
    ],
    UserRole.ADMIN: [
        MetricCard(label="Active Users", value="4,210", trend="+112 this week"),
        MetricCard(label="Open Sections", value="168", trend="+9 new sections"),
        MetricCard(label="Critical Alerts", value="2", trend="Both under review"),
    ],
    UserRole.ACADEMIC_STAFF: [
        MetricCard(label="Sections Running", value="96", trend="91% on-track"),
        MetricCard(label="Pending Approvals", value="14", trend="7 quizzes, 7 grades"),
        MetricCard(label="Lecturer Load Risk", value="3", trend="-1 overloaded profile"),
    ],
    UserRole.ADVISOR: [
        MetricCard(label="Assigned Students", value="85", trend="+3 this intake"),
        MetricCard(label="High-Risk Cases", value="12", trend="-2 after intervention"),
        MetricCard(label="Counseling Sessions", value="9", trend="5 scheduled this week"),
    ],
}


def get_dashboard_summary(role: UserRole) -> DashboardSummaryResponse:
    header_title, header_subtitle = DASHBOARD_HEADLINES[role]
    return DashboardSummaryResponse(
        role=role,
        header_title=header_title,
        header_subtitle=header_subtitle,
        metrics=DASHBOARD_METRICS[role],
        hero=HeroCard(
            title=f"{role.value.replace('_', ' ').title()} Action Plan",
            subtitle="Use this week focus list to close critical academic tasks and communication loops.",
            cta_label="Open Priority Board",
            cta_route=f"/dashboard/{role.value}",
        ),
        modules=ROLE_NAVIGATION[role],
    )
