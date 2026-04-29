"""Initial Brainio LMS schema

Revision ID: 20260429_0001
Revises:
Create Date: 2026-04-29
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260429_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "roles",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("code", sa.String(length=50), nullable=False, unique=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "permissions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("code", sa.String(length=120), nullable=False, unique=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("module", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "departments",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("code", sa.String(length=32), nullable=False, unique=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "programs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("department_id", sa.String(length=36), sa.ForeignKey("departments.id", ondelete="SET NULL")),
        sa.Column("code", sa.String(length=32), nullable=False, unique=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("total_credits", sa.Integer(), nullable=False, server_default="120"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("email", sa.String(length=150), nullable=False, unique=True),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("department_id", sa.String(length=36), sa.ForeignKey("departments.id", ondelete="SET NULL")),
        sa.Column("program_id", sa.String(length=36), sa.ForeignKey("programs.id", ondelete="SET NULL")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "courses",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("code", sa.String(length=32), nullable=False, unique=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("department_id", sa.String(length=36), sa.ForeignKey("departments.id", ondelete="SET NULL")),
        sa.Column("credits", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "course_sections",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("course_id", sa.String(length=36), sa.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("lecturer_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("code", sa.String(length=32), nullable=False, unique=True),
        sa.Column("semester", sa.String(length=32), nullable=False, server_default="2026A"),
        sa.Column("max_students", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "enrollments",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("student_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "section_id",
            sa.String(length=36),
            sa.ForeignKey("course_sections.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("enrollment_status", sa.String(length=32), nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "lessons",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column(
            "section_id",
            sa.String(length=36),
            sa.ForeignKey("course_sections.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=150), nullable=False),
        sa.Column("content", sa.Text(), nullable=False, server_default=""),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "assignments",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column(
            "section_id",
            sa.String(length=36),
            sa.ForeignKey("course_sections.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("due_at", sa.DateTime(timezone=True)),
        sa.Column("max_score", sa.Float(), nullable=False, server_default="10"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "submissions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("assignment_id", sa.String(length=36), sa.ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("student_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False, server_default=""),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="submitted"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "quizzes",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column(
            "section_id",
            sa.String(length=36),
            sa.ForeignKey("course_sections.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=150), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("max_score", sa.Float(), nullable=False, server_default="10"),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "grades",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("student_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "section_id",
            sa.String(length=36),
            sa.ForeignKey("course_sections.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("source_type", sa.String(length=32), nullable=False, server_default="assignment"),
        sa.Column("source_id", sa.String(length=36), nullable=False),
        sa.Column("score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("feedback", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "attendance_records",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("student_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "section_id",
            sa.String(length=36),
            sa.ForeignKey("course_sections.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("attendance_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="present"),
        sa.Column("note", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "notifications",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("channel", sa.String(length=32), nullable=False, server_default="in_app"),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "role_permissions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("role_id", sa.String(length=36), sa.ForeignKey("roles.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "permission_id",
            sa.String(length=36),
            sa.ForeignKey("permissions.id", ondelete="CASCADE"),
            nullable=False,
        ),
    )

    op.create_table(
        "user_roles",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role_id", sa.String(length=36), sa.ForeignKey("roles.id", ondelete="CASCADE"), nullable=False),
    )

    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_courses_code", "courses", ["code"])
    op.create_index("ix_course_sections_code", "course_sections", ["code"])


def downgrade() -> None:
    op.drop_index("ix_course_sections_code", table_name="course_sections")
    op.drop_index("ix_courses_code", table_name="courses")
    op.drop_index("ix_users_email", table_name="users")

    op.drop_table("user_roles")
    op.drop_table("role_permissions")
    op.drop_table("notifications")
    op.drop_table("attendance_records")
    op.drop_table("grades")
    op.drop_table("quizzes")
    op.drop_table("submissions")
    op.drop_table("assignments")
    op.drop_table("lessons")
    op.drop_table("enrollments")
    op.drop_table("course_sections")
    op.drop_table("courses")
    op.drop_table("users")
    op.drop_table("programs")
    op.drop_table("departments")
    op.drop_table("permissions")
    op.drop_table("roles")
