from pydantic import BaseModel

from app.core.roles import UserRole


class MetricCard(BaseModel):
    label: str
    value: str
    trend: str


class HeroCard(BaseModel):
    title: str
    subtitle: str
    cta_label: str
    cta_route: str


class DashboardSummaryResponse(BaseModel):
    role: UserRole
    header_title: str
    header_subtitle: str
    metrics: list[MetricCard]
    hero: HeroCard
    modules: list[dict[str, str]]
