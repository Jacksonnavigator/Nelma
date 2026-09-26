"""Last known driver position while on duty.

Revision ID: 202609260002
Revises: 202609260001
"""

import sqlalchemy as sa

from alembic import op

revision = "202609260002"
down_revision = "202609260001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("last_latitude", sa.Float(), nullable=True))
        batch.add_column(sa.Column("last_longitude", sa.Float(), nullable=True))
        batch.add_column(sa.Column("last_location_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.drop_column("last_location_at")
        batch.drop_column("last_longitude")
        batch.drop_column("last_latitude")
