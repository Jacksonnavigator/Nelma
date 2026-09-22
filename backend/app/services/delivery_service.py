from datetime import UTC, datetime

from app.schemas.order import DeliveryScheduleRead

ARUSHA_BOUNDS = {
    "north": -3.28,
    "south": -3.48,
    "west": 36.56,
    "east": 36.90,
}

DELIVERY_SLOTS = {
    "asap": ("As soon as possible", "Next available delivery"),
    "morning": ("Morning", "09:00 - 12:00"),
    "afternoon": ("Afternoon", "12:00 - 16:00"),
    "evening": ("Evening", "16:00 - 19:00"),
}


def default_delivery_schedule() -> dict[str, str]:
    today = datetime.now(UTC).date().isoformat()
    label, window = DELIVERY_SLOTS["asap"]
    return {
        "date": today,
        "slot": "asap",
        "label": f"Today, {label}",
        "window": window,
    }


def schedule_snapshot(schedule: DeliveryScheduleRead | None) -> dict[str, str]:
    if schedule is None:
        return default_delivery_schedule()
    return schedule.model_dump(by_alias=True)


def _text_from_snapshot(snapshot: dict) -> str:
    values = [
        snapshot.get("area"),
        snapshot.get("full_address"),
        snapshot.get("fullAddress"),
        snapshot.get("deliveryAddress"),
    ]
    return " ".join(str(value) for value in values if value).lower()


def _inside_arusha_bounds(snapshot: dict) -> bool:
    latitude = snapshot.get("latitude")
    longitude = snapshot.get("longitude")
    if not isinstance(latitude, int | float) or not isinstance(longitude, int | float):
        return False
    return (
        latitude <= ARUSHA_BOUNDS["north"]
        and latitude >= ARUSHA_BOUNDS["south"]
        and longitude >= ARUSHA_BOUNDS["west"]
        and longitude <= ARUSHA_BOUNDS["east"]
    )


def delivery_quote(snapshot: dict) -> dict:
    text = _text_from_snapshot(snapshot)
    if any(keyword in text for keyword in ["nm-aist", "nmaist", "nelson mandela", "campus", "hostel", "phd"]):
        return {
            "zoneId": "nmaist",
            "zoneName": "NM-AIST campus",
            "charge": {"id": "delivery_nmaist", "label": "Delivery fee - NM-AIST campus", "amount": 0},
            "helper": "Free delivery for the current NM-AIST priority area.",
        }
    if "tengeru" in text:
        return {
            "zoneId": "tengeru",
            "zoneName": "Tengeru nearby area",
            "charge": {"id": "delivery_tengeru", "label": "Delivery fee - Tengeru", "amount": 1000},
            "helper": "Nearby Arusha delivery fee for Tengeru locations.",
        }
    return {
        "zoneId": "arusha",
        "zoneName": "Arusha mapped area" if _inside_arusha_bounds(snapshot) else "Arusha standard area",
        "charge": {"id": "delivery_arusha", "label": "Delivery fee - Arusha", "amount": 1500},
        "helper": "Standard Arusha delivery fee. NELMA currently serves Arusha and NM-AIST first.",
    }


def charges_for_snapshot(snapshot: dict) -> list[dict]:
    charge = delivery_quote(snapshot)["charge"]
    return [charge] if charge["amount"] > 0 else []
