"""Add forum, live class, and quality survey tables

Revision ID: 20260430_0005
Revises: 20260429_0004
Create Date: 2026-04-30
"""

from alembic import op
import sqlalchemy as sa


revision = "20260430_0005"
down_revision = "20260429_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "forum_topics",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("section_id", sa.String(length=36), sa.ForeignKey("course_sections.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_by", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("content", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="open"),
        sa.Column("is_pinned", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("replies_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_forum_topics_section_id", "forum_topics", ["section_id"])
    op.create_index("ix_forum_topics_created_by", "forum_topics", ["created_by"])

    op.create_table(
        "live_class_sessions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("section_id", sa.String(length=36), sa.ForeignKey("course_sections.id", ondelete="CASCADE"), nullable=False),
        sa.Column("lecturer_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("platform", sa.String(length=64), nullable=False, server_default="zoom"),
        sa.Column("meeting_url", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("recording_url", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="scheduled"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_live_class_sessions_section_id", "live_class_sessions", ["section_id"])
    op.create_index("ix_live_class_sessions_lecturer_id", "live_class_sessions", ["lecturer_id"])

    op.create_table(
        "quality_surveys",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("category", sa.String(length=64), nullable=False, server_default="course"),
        sa.Column("department_id", sa.String(length=36), sa.ForeignKey("departments.id", ondelete="SET NULL")),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="open"),
        sa.Column("responses_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_quality_surveys_department_id", "quality_surveys", ["department_id"])


def downgrade() -> None:
    op.drop_index("ix_quality_surveys_department_id", table_name="quality_surveys")
    op.drop_table("quality_surveys")
    op.drop_index("ix_live_class_sessions_lecturer_id", table_name="live_class_sessions")
    op.drop_index("ix_live_class_sessions_section_id", table_name="live_class_sessions")
    op.drop_table("live_class_sessions")
    op.drop_index("ix_forum_topics_created_by", table_name="forum_topics")
    op.drop_index("ix_forum_topics_section_id", table_name="forum_topics")
    op.drop_table("forum_topics")
