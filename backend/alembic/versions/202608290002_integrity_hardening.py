"""integrity hardening

Revision ID: 202608290002
Revises: 202608290001
Create Date: 2026-08-29
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "202608290002"
down_revision: str | None = "202608290001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index("ix_payments_provider_reference", table_name="payments")
    op.create_index("ix_payments_provider_reference", "payments", ["provider_reference"], unique=True)
    op.create_index(
        "ux_addresses_one_default_per_user",
        "addresses",
        ["user_id"],
        unique=True,
        sqlite_where=sa.text("is_default = 1"),
        postgresql_where=sa.text("is_default = true"),
    )


def downgrade() -> None:
    op.drop_index("ux_addresses_one_default_per_user", table_name="addresses")
    op.drop_index("ix_payments_provider_reference", table_name="payments")
    op.create_index("ix_payments_provider_reference", "payments", ["provider_reference"], unique=False)
