import uuid

from app.integrations.payments.base import PaymentInitialization


class DevelopmentPaymentProvider:
    name = "development"

    def initialize_payment(self, *, order_id: str, amount: int, currency: str, method: str) -> PaymentInitialization:
        reference = "DEV-" + uuid.uuid4().hex[:16].upper()
        status = "paid" if method == "mobile_money" else "pending"
        return PaymentInitialization(provider_reference=reference, status=status)

    def get_payment_status(self, provider_reference: str) -> str:
        return "paid" if provider_reference.startswith("DEV-") else "processing"

    def process_callback(self, payload: dict, headers: dict[str, str]) -> dict:
        provider_reference = payload.get("providerReference") or payload.get("provider_reference") or payload.get("reference")
        status = payload.get("status")
        failure_reason = payload.get("failureReason") or payload.get("failure_reason")
        return {
            "providerReference": provider_reference,
            "status": status,
            "failureReason": failure_reason,
        }
