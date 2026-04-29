"""Sprint 6-7 platform and operations tables

Revision ID: 20260429_0004
Revises: 20260429_0003
Create Date: 2026-04-29
"""

from alembic import op
import sqlalchemy as sa


revision = "20260429_0004"
down_revision = "20260429_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "semesters",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("code", sa.String(length=32), nullable=False, unique=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="planned"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "announcements",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("target_role", sa.String(length=50), nullable=False, server_default="all"),
        sa.Column("section_id", sa.String(length=36), sa.ForeignKey("course_sections.id", ondelete="SET NULL")),
        sa.Column("department_id", sa.String(length=36), sa.ForeignKey("departments.id", ondelete="SET NULL")),
        sa.Column("created_by", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )

    op.create_table(
        "curriculum_entries",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("program_id", sa.String(length=36), sa.ForeignKey("programs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("course_id", sa.String(length=36), sa.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("semester_no", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("is_required", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_curriculum_entries_program_id", "curriculum_entries", ["program_id"])
    op.create_index("ix_curriculum_entries_course_id", "curriculum_entries", ["course_id"])

    op.create_table(
        "lecturer_assignments",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("section_id", sa.String(length=36), sa.ForeignKey("course_sections.id", ondelete="CASCADE"), nullable=False),
        sa.Column("lecturer_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("assigned_by", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("role", sa.String(length=50), nullable=False, server_default="primary_lecturer"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_lecturer_assignments_section_id", "lecturer_assignments", ["section_id"])
    op.create_index("ix_lecturer_assignments_lecturer_id", "lecturer_assignments", ["lecturer_id"])

    op.create_table(
        "grade_approvals",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("section_id", sa.String(length=36), sa.ForeignKey("course_sections.id", ondelete="CASCADE"), nullable=False),
        sa.Column("requested_by", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("approved_by", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("note", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_grade_approvals_section_id", "grade_approvals", ["section_id"])

    op.create_table(
        "exam_approvals",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("quiz_id", sa.String(length=36), sa.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("requested_by", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("approved_by", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("note", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_exam_approvals_quiz_id", "exam_approvals", ["quiz_id"])

    op.create_table(
        "advisor_students",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("advisor_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("student_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("advisor_id", "student_id", name="uq_advisor_student"),
    )
    op.create_index("ix_advisor_students_advisor_id", "advisor_students", ["advisor_id"])
    op.create_index("ix_advisor_students_student_id", "advisor_students", ["student_id"])

    op.create_table(
        "risk_alerts",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("student_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("advisor_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("risk_level", sa.String(length=32), nullable=False, server_default="medium"),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="open"),
        sa.Column("recommended_action", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_risk_alerts_student_id", "risk_alerts", ["student_id"])

    op.create_table(
        "consultation_records",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("advisor_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("student_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("action_plan", sa.Text(), nullable=False, server_default=""),
        sa.Column("follow_up_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_consultation_records_advisor_id", "consultation_records", ["advisor_id"])
    op.create_index("ix_consultation_records_student_id", "consultation_records", ["student_id"])

    op.create_table(
        "study_plans",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("student_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("advisor_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("goals", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("tasks", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_study_plans_student_id", "study_plans", ["student_id"])
    op.create_index("ix_study_plans_advisor_id", "study_plans", ["advisor_id"])

    op.create_table(
        "support_requests",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("student_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("advisor_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="open"),
        sa.Column("escalation_note", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_support_requests_student_id", "support_requests", ["student_id"])
    op.create_index("ix_support_requests_advisor_id", "support_requests", ["advisor_id"])

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("actor_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("action", sa.String(length=120), nullable=False),
        sa.Column("resource_type", sa.String(length=120), nullable=False),
        sa.Column("resource_id", sa.String(length=36), nullable=False, server_default=""),
        sa.Column("detail", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_audit_logs_actor_id", "audit_logs", ["actor_id"])
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])

    op.create_table(
        "uploaded_files",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("owner_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("module", sa.String(length=120), nullable=False, server_default="general"),
        sa.Column("original_name", sa.String(length=255), nullable=False),
        sa.Column("stored_name", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=120), nullable=False, server_default="application/octet-stream"),
        sa.Column("file_size", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("path", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_uploaded_files_owner_id", "uploaded_files", ["owner_id"])


def downgrade() -> None:
    op.drop_index("ix_uploaded_files_owner_id", table_name="uploaded_files")
    op.drop_table("uploaded_files")
    op.drop_index("ix_audit_logs_action", table_name="audit_logs")
    op.drop_index("ix_audit_logs_actor_id", table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_index("ix_support_requests_advisor_id", table_name="support_requests")
    op.drop_index("ix_support_requests_student_id", table_name="support_requests")
    op.drop_table("support_requests")
    op.drop_index("ix_study_plans_advisor_id", table_name="study_plans")
    op.drop_index("ix_study_plans_student_id", table_name="study_plans")
    op.drop_table("study_plans")
    op.drop_index("ix_consultation_records_student_id", table_name="consultation_records")
    op.drop_index("ix_consultation_records_advisor_id", table_name="consultation_records")
    op.drop_table("consultation_records")
    op.drop_index("ix_risk_alerts_student_id", table_name="risk_alerts")
    op.drop_table("risk_alerts")
    op.drop_index("ix_advisor_students_student_id", table_name="advisor_students")
    op.drop_index("ix_advisor_students_advisor_id", table_name="advisor_students")
    op.drop_table("advisor_students")
    op.drop_index("ix_exam_approvals_quiz_id", table_name="exam_approvals")
    op.drop_table("exam_approvals")
    op.drop_index("ix_grade_approvals_section_id", table_name="grade_approvals")
    op.drop_table("grade_approvals")
    op.drop_index("ix_lecturer_assignments_lecturer_id", table_name="lecturer_assignments")
    op.drop_index("ix_lecturer_assignments_section_id", table_name="lecturer_assignments")
    op.drop_table("lecturer_assignments")
    op.drop_index("ix_curriculum_entries_course_id", table_name="curriculum_entries")
    op.drop_index("ix_curriculum_entries_program_id", table_name="curriculum_entries")
    op.drop_table("curriculum_entries")
    op.drop_table("announcements")
    op.drop_table("semesters")
