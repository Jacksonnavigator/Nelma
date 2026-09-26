"""Driver acknowledgement, duty status and the cash hand-in ledger.

Revision ID: 202609260001
Revises: 202609210001
"""

import sqlalchemy as sa

from alembic import op

revision = "202609260001"
down_revision = "202609210001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("orders") as batch:
        batch.add_column(sa.Column("driver_assigned_at", sa.DateTime(timezone=True), nullable=True))
        batch.add_column(sa.Column("driver_accepted_at", sa.DateTime(timezone=True), nullable=True))
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("is_on_duty", sa.Boolean(), server_default=sa.true(), nullable=False))
    with op.batch_alter_table("payments") as batch:
        batch.add_column(sa.Column("collected_by_user_id", sa.String(36), nullable=True))
        batch.add_column(sa.Column("handed_in_at", sa.DateTime(timezone=True), nullable=True))
        batch.add_column(sa.Column("handed_in_by_user_id", sa.String(36), nullable=True))
        batch.create_foreign_key("fk_payments_collected_by_user_id", "users", ["collected_by_user_id"], ["id"], ondelete="SET NULL")
        batch.create_foreign_key("fk_payments_handed_in_by_user_id", "users", ["handed_in_by_user_id"], ["id"], ondelete="SET NULL")
        batch.create_index("ix_payments_collected_by_handed_in", ["collected_by_user_id", "handed_in_at"])

    # Start from a clean slate: existing assignments count as accepted and existing
    # cash as already handed in, so the Operations view only shows new activity.
    op.execute("UPDATE orders SET driver_assigned_at = updated_at, driver_accepted_at = updated_at WHERE assigned_driver_id IS NOT NULL")
    op.execute(
        "UPDATE payments SET collected_by_user_id = (SELECT orders.assigned_driver_id FROM orders WHERE orders.id = payments.order_id), "
        "handed_in_at = paid_at WHERE provider = 'cash' AND status = 'paid'"
    )


def downgrade() -> None:
    with op.batch_alter_table("payments") as batch:
        batch.drop_index("ix_payments_collected_by_handed_in")
        batch.drop_constraint("fk_payments_handed_in_by_user_id", type_="foreignkey")
        batch.drop_constraint("fk_payments_collected_by_user_id", type_="foreignkey")
        batch.drop_column("handed_in_by_user_id")
        batch.drop_column("handed_in_at")
        batch.drop_column("collected_by_user_id")
    with op.batch_alter_table("users") as batch:
        batch.drop_column("is_on_duty")
    with op.batch_alter_table("orders") as batch:
        batch.drop_column("driver_accepted_at")
        batch.drop_column("driver_assigned_at")
