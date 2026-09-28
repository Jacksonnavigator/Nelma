from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.core.http_status import HTTP_422_UNPROCESSABLE_CONTENT
from app.services.product_service import product_service


class PricingService:
    def unit_price(self, db: Session, order_type: str) -> int:
        return product_service.orderable(db, order_type).unit_price

    def product_name(self, db: Session, order_type: str) -> str:
        return product_service.orderable(db, order_type).name

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
