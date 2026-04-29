"""Sprint 5 learning tables for quiz and attendance sessions

Revision ID: 20260429_0003
Revises: 20260429_0002
Create Date: 2026-04-29
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260429_0003"
down_revision = "20260429_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "quiz_questions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("quiz_id", sa.String(length=36), sa.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("question_type", sa.String(length=32), nullable=False, server_default="multiple_choice"),
        sa.Column("options", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")),
        sa.Column("correct_answer", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("points", sa.Float(), nullable=False, server_default="1"),
        sa.Column("order_index", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_quiz_questions_quiz_id", "quiz_questions", ["quiz_id"])

    op.create_table(
        "quiz_attempts",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("quiz_id", sa.String(length=36), sa.ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("student_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("answers", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")),
        sa.Column("score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_quiz_attempts_quiz_id", "quiz_attempts", ["quiz_id"])
    op.create_index("ix_quiz_attempts_student_id", "quiz_attempts", ["student_id"])

    op.create_table(
        "attendance_sessions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("section_id", sa.String(length=36), sa.ForeignKey("course_sections.id", ondelete="CASCADE"), nullable=False),
        sa.Column("lecturer_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("session_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False, server_default="Attendance Session"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_attendance_sessions_section_id", "attendance_sessions", ["section_id"])


def downgrade() -> None:
    op.drop_index("ix_attendance_sessions_section_id", table_name="attendance_sessions")
    op.drop_table("attendance_sessions")

    op.drop_index("ix_quiz_attempts_student_id", table_name="quiz_attempts")
    op.drop_index("ix_quiz_attempts_quiz_id", table_name="quiz_attempts")
    op.drop_table("quiz_attempts")

    op.drop_index("ix_quiz_questions_quiz_id", table_name="quiz_questions")
    op.drop_table("quiz_questions")
