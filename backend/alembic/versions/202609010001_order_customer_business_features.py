"""order customer authorization foundation

Revision ID: 202609010001
Revises: 202608290002
Create Date: 2026-09-01
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "202609010001"
down_revision: str | None = "202608290002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("role", sa.String(length=24), nullable=False, server_default="USER"))
    op.add_column("users", sa.Column("preferred_language", sa.String(length=2), nullable=False, server_default="en"))
    op.add_column("users", sa.Column("address_location_preference", sa.String(length=12), nullable=False, server_default="single"))
    op.execute(
        "UPDATE users SET role = CASE "
        "WHEN role = 'DRIVER' THEN 'DRIVER' "
        "WHEN role = 'SALES_MANAGER' THEN 'SALES_MANAGER' "
        "WHEN role = 'SYSTEM_ADMIN' THEN 'SYSTEM_ADMIN' "
        "WHEN role = 'USER' THEN 'USER' "
        "ELSE 'USER' END"
    )

    op.add_column("refresh_sessions", sa.Column("audience", sa.String(length=24), nullable=False, server_default="mobile"))
    op.create_index("ix_refresh_sessions_user_audience", "refresh_sessions", ["user_id", "audience"])

    op.add_column("orders", sa.Column("created_by_user_id", sa.String(length=36), nullable=True))
    op.add_column("orders", sa.Column("source", sa.String(length=40), nullable=False, server_default="USER_MOBILE"))
    op.add_column("orders", sa.Column("assigned_driver_id", sa.String(length=36), nullable=True))
    op.add_column("orders", sa.Column("charges_snapshot", sa.JSON(), nullable=False, server_default=sa.text("'[]'")))
    op.add_column("orders", sa.Column("delivery_schedule_snapshot", sa.JSON(), nullable=True))
    op.add_column("orders", sa.Column("customer_remarks", sa.Text(), nullable=True))
    op.add_column("orders", sa.Column("customer_received_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("orders", sa.Column("customer_received_by_user_id", sa.String(length=36), nullable=True))
    op.execute("UPDATE orders SET created_by_user_id = user_id WHERE created_by_user_id IS NULL")
    op.create_index("ix_orders_created_by_user_id", "orders", ["created_by_user_id"])
    op.create_index("ix_orders_assigned_driver_id", "orders", ["assigned_driver_id"])

    op.create_table(
        "order_messages",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("order_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=True),
        sa.Column("sender", sa.String(length=24), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_order_messages_order_id", "order_messages", ["order_id"])
    op.create_index("ix_order_messages_created_at", "order_messages", ["created_at"])

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("actor_user_id", sa.String(length=36), nullable=True),
        sa.Column("actor_role", sa.String(length=32), nullable=True),
        sa.Column("event_type", sa.String(length=80), nullable=False),
        sa.Column("resource_type", sa.String(length=80), nullable=False),
        sa.Column("resource_id", sa.String(length=80), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_logs_actor_user_id", "audit_logs", ["actor_user_id"])
    op.create_index("ix_audit_logs_event_type", "audit_logs", ["event_type"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_audit_logs_created_at", table_name="audit_logs")
    op.drop_index("ix_audit_logs_event_type", table_name="audit_logs")
    op.drop_index("ix_audit_logs_actor_user_id", table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_index("ix_order_messages_created_at", table_name="order_messages")
    op.drop_index("ix_order_messages_order_id", table_name="order_messages")
    op.drop_table("order_messages")
    op.drop_index("ix_orders_assigned_driver_id", table_name="orders")
    op.drop_index("ix_orders_created_by_user_id", table_name="orders")
    op.drop_column("orders", "customer_received_by_user_id")
    op.drop_column("orders", "customer_received_at")
    op.drop_column("orders", "customer_remarks")
    op.drop_column("orders", "delivery_schedule_snapshot")
    op.drop_column("orders", "charges_snapshot")
    op.drop_column("orders", "assigned_driver_id")
    op.drop_column("orders", "source")
    op.drop_column("orders", "created_by_user_id")
    op.drop_index("ix_refresh_sessions_user_audience", table_name="refresh_sessions")
    op.drop_column("refresh_sessions", "audience")
    op.drop_column("users", "address_location_preference")
    op.drop_column("users", "preferred_language")
    op.drop_column("users", "role")
