"""Delivery fees and time slots, driven by the settings staff edit on the dashboard.

The mobile app shows the same quote from the public settings, but the server's result is the one
charged: the fee is always recomputed here from the address saved on the order.
"""

import re
from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.core.http_status import HTTP_422_UNPROCESSABLE_CONTENT
from app.schemas.order import DeliveryScheduleRead
from app.services.business_settings import read_settings

ASAP = ("As soon as possible", "Next available delivery")


def default_delivery_schedule() -> dict[str, str]:
    today = datetime.now(UTC).date().isoformat()
    label, window = ASAP
    return {"date": today, "slot": "asap", "label": f"Today, {label}", "window": window}


def schedule_snapshot(db: Session, schedule: DeliveryScheduleRead | None) -> dict[str, str]:
    if schedule is None:
        return default_delivery_schedule()
    if schedule.slot != "asap":
        windows = read_settings(db)["delivery"]["defaultTimeWindows"]
        if schedule.window not in windows:
            raise AppException(
                "INVALID_DELIVERY_WINDOW",
                "That delivery time is no longer offered. Choose another time.",
                HTTP_422_UNPROCESSABLE_CONTENT,
            )
    return schedule.model_dump(by_alias=True)


def _address_text(snapshot: dict) -> str:
    values = [snapshot.get("area"), snapshot.get("full_address"), snapshot.get("fullAddress"), snapshot.get("deliveryAddress")]
    return " ".join(str(value) for value in values if value).lower()


def _mentions(text: str, keyword: str) -> bool:
    # Whole words only, so "tengeru" matches "Tengeru market" but a keyword never matches inside another word.
    return re.search(r"(?<![a-z0-9])" + re.escape(keyword) + r"(?![a-z0-9])", text) is not None


def delivery_quote(delivery: dict, snapshot: dict) -> dict:
    text = _address_text(snapshot)
    for zone in delivery["zones"]:
        if any(_mentions(text, keyword) for keyword in zone["keywords"]):
            return {"zoneId": zone["id"], "zoneName": zone["name"], "charge": _charge(zone["id"], zone["name"], zone["fee"])}
    name = delivery["defaultZoneName"]
    return {"zoneId": "default", "zoneName": name, "charge": _charge("default", name, delivery["defaultFee"])}


def _charge(zone_id: str, zone_name: str, amount: int) -> dict:
    return {"id": f"delivery_{zone_id}", "label": f"Delivery fee - {zone_name}", "amount": amount}


def charges_for_snapshot(db: Session, snapshot: dict) -> list[dict]:
    charge = delivery_quote(read_settings(db)["delivery"], snapshot)["charge"]
    return [charge] if charge["amount"] > 0 else []
