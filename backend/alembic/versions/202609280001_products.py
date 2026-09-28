"""Product catalog managed from the dashboard.

The two original products are created by settings_service.seed_defaults, which runs on every deploy,
so their prices carry over from the existing FIRST_PURCHASE_PRICE and REFILL_PRICE settings.

Revision ID: 202609280001
Revises: 202609260002
"""

import sqlalchemy as sa

from alembic import op

revision = "202609280001"
down_revision = "202609260002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "products",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("code", sa.String(32), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("description", sa.String(300), nullable=True),
        sa.Column("unit_price", sa.Integer(), nullable=False),
        sa.Column("image_url", sa.String(600), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_products_code", "products", ["code"], unique=True)
    # Match the other app tables: FastAPI enforces access, the Supabase Data API gets nothing.
    if op.get_bind().dialect.name == "postgresql":
        op.execute("ALTER TABLE products ENABLE ROW LEVEL SECURITY")


def downgrade() -> None:
    op.drop_index("ix_products_code", table_name="products")
    op.drop_table("products")
