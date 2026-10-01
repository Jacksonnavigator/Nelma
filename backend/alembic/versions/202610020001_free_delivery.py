"""Make delivery free (0 TZS) in the saved dashboard settings.

The fees can be changed again at any time on the dashboard's Products page. Only the stored fee values
change; zones, their place names and the delivery time windows are kept.

Revision ID: 202610020001
Revises: 202610010001
"""

import json

import sqlalchemy as sa

from alembic import op

revision = "202610020001"
down_revision = "202610010001"
branch_labels = None
depends_on = None

SETTINGS_KEY = "DASHBOARD_SETTINGS"


def upgrade() -> None:
    bind = op.get_bind()
    row = bind.execute(sa.text("SELECT value FROM app_settings WHERE key = :key"), {"key": SETTINGS_KEY}).first()
    if row is None:
        return  # Nothing saved yet: the built-in defaults are already 0 TZS.
    value = json.loads(row[0])
    delivery = value.get("delivery")
    if not isinstance(delivery, dict):
        return
    delivery["defaultFee"] = 0
    for zone in delivery.get("zones") or []:
        if isinstance(zone, dict):
            zone["fee"] = 0
    bind.execute(sa.text("UPDATE app_settings SET value = :value WHERE key = :key"), {"value": json.dumps(value), "key": SETTINGS_KEY})


def downgrade() -> None:
    # The previous fees are not recorded here; staff set them on the dashboard if needed.
    pass
