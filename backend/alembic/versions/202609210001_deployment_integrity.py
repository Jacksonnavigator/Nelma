"""Match model constraints and protect NELMA tables from direct Supabase Data API access.

Revision ID: 202609210001
Revises: 202609010001
"""

import sqlalchemy as sa

from alembic import op

revision = "202609210001"
down_revision = "202609010001"
branch_labels = None
depends_on = None

TABLES = (
    "addresses", "app_settings", "audit_logs", "device_push_tokens", "idempotency_keys",
    "notifications", "order_items", "order_messages", "orders", "password_reset_tokens",
    "payments", "refresh_sessions", "users",
)
ORDER_USER_COLUMNS = ("created_by_user_id", "assigned_driver_id", "customer_received_by_user_id")


def upgrade() -> None:
    with op.batch_alter_table("orders") as batch:
        for column in ORDER_USER_COLUMNS:
            batch.create_foreign_key(f"fk_orders_{column}", "users", [column], ["id"], ondelete="SET NULL")
    with op.batch_alter_table("users") as batch:
        batch.alter_column("role", existing_type=sa.String(24), type_=sa.String(13), existing_nullable=False)
    with op.batch_alter_table("refresh_sessions") as batch:
        batch.alter_column("audience", existing_type=sa.String(24), type_=sa.String(9), existing_nullable=False)
        batch.create_unique_constraint("uq_refresh_sessions_token_hash", ["token_hash"])
        batch.create_unique_constraint("uq_refresh_sessions_jti", ["jti"])
    with op.batch_alter_table("device_push_tokens") as batch:
        batch.create_unique_constraint("uq_device_push_tokens_token", ["token"])
    if op.get_bind().dialect.name == "postgresql":
        # No client policies: only the trusted table owner used by FastAPI can access these tables.
        for table in TABLES:
            op.execute(f'ALTER TABLE "{table}" ENABLE ROW LEVEL SECURITY')


def downgrade() -> None:
    if op.get_bind().dialect.name == "postgresql":
        for table in TABLES:
            op.execute(f'ALTER TABLE "{table}" DISABLE ROW LEVEL SECURITY')
    with op.batch_alter_table("device_push_tokens") as batch:
        batch.drop_constraint("uq_device_push_tokens_token", type_="unique")
    with op.batch_alter_table("refresh_sessions") as batch:
        batch.drop_constraint("uq_refresh_sessions_jti", type_="unique")
        batch.drop_constraint("uq_refresh_sessions_token_hash", type_="unique")
        batch.alter_column("audience", existing_type=sa.String(9), type_=sa.String(24), existing_nullable=False)
    with op.batch_alter_table("users") as batch:
        batch.alter_column("role", existing_type=sa.String(13), type_=sa.String(24), existing_nullable=False)
    with op.batch_alter_table("orders") as batch:
        for column in ORDER_USER_COLUMNS:
            batch.drop_constraint(f"fk_orders_{column}", type_="foreignkey")
