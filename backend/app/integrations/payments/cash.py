from app.core.exceptions import AppException
from app.integrations.payments.base import PaymentInitialization


class CashPaymentProvider:
    name = "cash"

    def initialize_payment(self, *, order_id: str, amount: int, currency: str, method: str) -> PaymentInitialization:
        if method != "cash":
            raise AppException("PAYMENT_METHOD_UNAVAILABLE", "Only cash payments are currently available.", 422)
        return PaymentInitialization(provider_reference=f"CASH-PENDING-{order_id}", status="pending")

    def process_callback(self, payload: dict, headers: dict[str, str]) -> dict:
        raise AppException("CASH_CALLBACK_UNSUPPORTED", "Cash must be recorded by authorized staff.", 403)

    def get_payment_status(self, provider_reference: str) -> str:
        return "pending"
