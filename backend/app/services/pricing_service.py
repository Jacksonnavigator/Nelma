from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.core.http_status import HTTP_422_UNPROCESSABLE_CONTENT
from app.services.settings_service import PRICE_KEYS, settings_service

PRODUCT_NAMES = {
    "first_purchase": "20L Drinking Water + New Bottle",
    "refill": "20L Drinking Water",
}


class PricingService:
    def unit_price(self, db: Session, order_type: str) -> int:
        settings = get_settings()
        if order_type == "first_purchase":
            return settings_service.get_int(db, PRICE_KEYS[order_type], settings.first_purchase_price)
        if order_type == "refill":
            return settings_service.get_int(db, PRICE_KEYS[order_type], settings.refill_price)
        raise AppException("INVALID_ORDER_TYPE", "Choose a supported NELMA product.", HTTP_422_UNPROCESSABLE_CONTENT)

    def product_name(self, order_type: str) -> str:
        if order_type not in PRODUCT_NAMES:
            raise AppException("INVALID_ORDER_TYPE", "Choose a supported NELMA product.", HTTP_422_UNPROCESSABLE_CONTENT)
        return PRODUCT_NAMES[order_type]

    def calculate(self, db: Session, order_type: str, quantity: int) -> tuple[int, int, int]:
        settings = get_settings()
        if quantity < 1 or quantity > settings.max_order_quantity:
            raise AppException(
                "INVALID_QUANTITY",
                f"Quantity must be between 1 and {settings.max_order_quantity}.",
                HTTP_422_UNPROCESSABLE_CONTENT,
            )
        unit_price = self.unit_price(db, order_type)
        subtotal = unit_price * quantity
        return unit_price, subtotal, subtotal


pricing_service = PricingService()
