"""The business settings staff edit on the dashboard: contacts, payments, alerts and delivery.

They live in one JSON app setting. Reading always goes through the schema, so settings saved by an
older version (for example with the retired fee_rule_source field) still load with safe defaults.
"""

import json

from sqlalchemy.orm import Session

from app.models.app_setting import AppSetting
from app.schemas.dashboard import DashboardSettings

SETTINGS_KEY = "DASHBOARD_SETTINGS"

DEFAULT_SETTINGS = {
    "business": {
        "name": "NELMA Drinking Water",
        "supportPhone": "+255700000000",
        "supportEmail": "support@nelma.co.tz",
        "address": "Arusha, Tanzania",
        "operatingHours": "Every day, 07:00 - 20:00",
    },
    "payments": {"cashEnabled": True, "mobileMoneyEnabled": False},
    "notifications": {"newOrderAlerts": True, "deliveryAlerts": True, "paymentAlerts": True},
    "delivery": {
        "defaultTimeWindows": ["09:00 - 12:00", "12:00 - 16:00", "16:00 - 19:00"],
        # Matched against the delivery address the customer types. Keep keywords specific:
        # a generic word such as "hostel" would give that zone's fee to addresses anywhere.
        "zones": [
            {"id": "nmaist", "name": "NM-AIST campus", "fee": 0, "keywords": ["nm-aist", "nmaist", "nelson mandela"]},
            {"id": "tengeru", "name": "Tengeru", "fee": 1000, "keywords": ["tengeru"]},
        ],
        "defaultZoneName": "Arusha",
        "defaultFee": 1500,
    },
}

RETIRED_KEYS = {"delivery": {"feeRuleSource"}}


def _merge(stored: dict) -> dict:
    merged = {}
    for section, defaults in DEFAULT_SETTINGS.items():
        values = stored.get(section) if isinstance(stored.get(section), dict) else {}
        values = {key: value for key, value in values.items() if key not in RETIRED_KEYS.get(section, set())}
        merged[section] = {**defaults, **values}
    return merged


def read_settings(db: Session) -> dict:
    entry = db.get(AppSetting, SETTINGS_KEY)
    stored = json.loads(entry.value) if entry else {}
    return DashboardSettings.model_validate(_merge(stored)).model_dump(by_alias=True)


def write_settings(db: Session, value: dict) -> dict:
    value = DashboardSettings.model_validate(_merge(value)).model_dump(by_alias=True)
    entry = db.get(AppSetting, SETTINGS_KEY)
    if entry is None:
        db.add(AppSetting(key=SETTINGS_KEY, value=json.dumps(value), is_public=False))
    else:
        entry.value = json.dumps(value)
    return value
