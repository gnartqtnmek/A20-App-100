from pydantic import BaseModel

from app.core.roles import UserRole


class RoleModuleItem(BaseModel):
    key: str
    title: str
    description: str
    route: str


class RoleModuleResponse(BaseModel):
    role: UserRole
    modules: list[RoleModuleItem]
