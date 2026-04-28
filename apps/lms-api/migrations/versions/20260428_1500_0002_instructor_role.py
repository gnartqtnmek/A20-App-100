"""Rename legacy lecturer role to instructor.

Revision ID: 0002
Revises: 0001
Create Date: 2026-04-28 15:00:00
"""
from __future__ import annotations

from typing import Sequence

from alembic import op

revision: str = "0002"
down_revision: str | Sequence[str] | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("UPDATE users SET role = 'instructor' WHERE role = 'lecturer'")
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_users_user_role")
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check")
    op.execute("ALTER TABLE users ADD CONSTRAINT ck_users_user_role CHECK (role IN ('student','instructor','admin'))")


def downgrade() -> None:
    op.execute("UPDATE users SET role = 'lecturer' WHERE role = 'instructor'")
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_users_user_role")
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check")
    op.execute("ALTER TABLE users ADD CONSTRAINT ck_users_user_role CHECK (role IN ('student','lecturer','admin'))")
