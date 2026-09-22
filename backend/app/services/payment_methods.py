from app.core.config import get_settings

PAYMENT_METHODS = [
    {
        "id": "mobile_money",
        "type": "mobile_money",
        "label": "Mobile Money",
        "description": "Pay with a supported mobile-money wallet.",
        "enabled": True,
        "requires_customer_action": True,
    },
    {
        "id": "cash",
        "type": "cash",
        "label": "Cash on Delivery",
        "description": "Pay the delivery team when your water arrives.",
        "enabled": True,
        "requires_customer_action": False,
    },
]


def get_payment_method(method_id: str) -> dict | None:
    method = next((dict(method) for method in PAYMENT_METHODS if method["id"] == method_id), None)
    if method and method_id == "mobile_money" and get_settings().payment_provider == "cash":
        method["enabled"] = False
    return method


def get_payment_method_label(method_id: str) -> str:
    method = get_payment_method(method_id)
    return method["label"] if method else method_id.replace("_", " ").title()
