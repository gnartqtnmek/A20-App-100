"""Sprint 4 auth and rbac hardening

Revision ID: 20260429_0002
Revises: 20260429_0001
Create Date: 2026-04-29
"""

from alembic import op
import sqlalchemy as sa

revision = "20260429_0002"
down_revision = "20260429_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("password_hash", sa.String(length=255), nullable=False, server_default=""),
    )
    op.create_unique_constraint("uq_user_role", "user_roles", ["user_id", "role_id"])
    op.create_unique_constraint("uq_role_permission", "role_permissions", ["role_id", "permission_id"])


def downgrade() -> None:
    op.drop_constraint("uq_role_permission", "role_permissions", type_="unique")
    op.drop_constraint("uq_user_role", "user_roles", type_="unique")
    op.drop_column("users", "password_hash")
