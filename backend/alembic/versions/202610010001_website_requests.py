"""Messages and order requests sent from the public website.

Revision ID: 202610010001
Revises: 202609280001
"""

import sqlalchemy as sa

from alembic import op

revision = "202610010001"
down_revision = "202609280001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "website_requests",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("status", sa.String(16), nullable=False, server_default="new"),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(32), nullable=True),
        sa.Column("company", sa.String(160), nullable=True),
        sa.Column("customer_type", sa.String(16), nullable=True),
        sa.Column("city", sa.String(80), nullable=True),
        sa.Column("area", sa.String(120), nullable=True),
        sa.Column("product_code", sa.String(32), nullable=True),
        sa.Column("product_name", sa.String(120), nullable=True),
        sa.Column("quantity", sa.Integer(), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("handled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("handled_by_user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_website_requests_kind", "website_requests", ["kind"])
    op.create_index("ix_website_requests_status", "website_requests", ["status"])
    # Match the other app tables: FastAPI enforces access, the Supabase Data API gets nothing.
    if op.get_bind().dialect.name == "postgresql":
        op.execute("ALTER TABLE website_requests ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    op.drop_index("ix_website_requests_status", table_name="website_requests")
    op.drop_index("ix_website_requests_kind", table_name="website_requests")
    op.drop_table("website_requests")
