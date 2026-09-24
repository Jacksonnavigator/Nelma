from fastapi import status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.core.http_status import HTTP_422_UNPROCESSABLE_CONTENT
from app.core.permissions import Permission, authorize
from app.core.security import utc_now
from app.integrations.payments.factory import get_payment_provider
from app.models.order import Order
from app.models.payment import Payment
from app.models.user import User
from app.repositories.payments import PaymentRepository
from app.schemas.payment import InitializePaymentRequest, PaymentMethodRead, PaymentRead
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service
from app.services.order_service import order_service
from app.services.payment_methods import PAYMENT_METHODS, get_payment_method
from app.services.serializers import payment_to_read

repo = PaymentRepository()

PAYMENT_TRANSITIONS = {
    "pending": {"processing", "paid", "failed", "cancelled"},
    "processing": {"paid", "failed", "cancelled"},
    "paid": {"refunded"},
    "failed": set(),
    "cancelled": set(),
    "refunded": set(),
}
VALID_PAYMENT_STATUSES = set(PAYMENT_TRANSITIONS)


class PaymentService:
    def collect_cash(self, db: Session, actor: User, order_id: str, amount: int) -> None:
        authorize(actor, Permission.CASH_COLLECTION_RECORD)
        order = order_service.get_any_model(db, order_id)
        self.record_cash(db, order, amount, actor)
        db.commit()
        db.expire_all()

    def record_cash(self, db: Session, order: Order, amount: int, actor: User) -> None:
        """Record a full cash payment for a delivered order inside the caller's transaction."""
        order_id = order.id
        if order.payment_method != "cash" or order.status not in {"delivered", "received"}:
            raise AppException("CASH_NOT_COLLECTIBLE", "Cash can only be recorded for a delivered cash order.", 409)
        if amount != order.total:
            raise AppException("CASH_AMOUNT_MISMATCH", "Confirm the full order total received. Partial payments are not supported.", 422)
        reference = f"CASH-{order.id}"
        if order.payment_status == "paid" and db.scalar(select(Payment).where(Payment.provider_reference == reference)):
            return  # A retried confirmation must not create another payment or audit event.
        changed = db.execute(
            update(Order)
            .where(
                Order.id == order_id,
                Order.payment_method == "cash",
                Order.payment_status == "pending",
                Order.status.in_(["delivered", "received"]),
                Order.total == amount,
            )
            .values(payment_status="paid")
            .execution_options(synchronize_session=False)
        )
        if changed.rowcount != 1:
            db.rollback()
            raise AppException("CASH_ALREADY_SETTLED", "This payment has changed. Refresh the order before continuing.", 409)
        # Retire any pending initialization so a later provider callback cannot overwrite this collection.
        db.execute(update(Payment).where(Payment.order_id == order_id, Payment.status == "pending").values(status="cancelled"))
        payment = Payment(
            order_id=order_id,
            user_id=order.user_id,
            provider="cash",
            method="cash",
            amount=amount,
            currency=order.currency,
            status="paid",
            provider_reference=reference,
            paid_at=utc_now(),
        )
        db.add(payment)
        db.flush()
        audit_service.record(
            db,
            actor=actor,
            event_type="CASH_COLLECTED",
            resource_type="order",
            resource_id=order_id,
            metadata={"paymentId": payment.id, "amount": amount, "currency": order.currency},
        )
        notification_service.create_for_event(db, user_id=order.user_id, event_type="payment_successful", order_id=order_id)
        db.refresh(order)

    def methods(self) -> list[PaymentMethodRead]:
        return [PaymentMethodRead.model_validate(get_payment_method(method["id"])) for method in PAYMENT_METHODS]

    def get(self, db: Session, user: User, payment_id: str) -> PaymentRead:
        authorize(user, Permission.PAYMENT_MANAGE_SELF)
        payment = repo.get_for_user(db, user.id, payment_id)
        if payment is None:
            raise AppException("PAYMENT_NOT_FOUND", "Payment not found.", status.HTTP_404_NOT_FOUND)
        return payment_to_read(payment)

    def list_for_order(self, db: Session, user: User, order_id: str) -> list[PaymentRead]:
        authorize(user, Permission.PAYMENT_MANAGE_SELF)
        order_service.get_model(db, user, order_id)
        return [payment_to_read(payment) for payment in repo.list_for_order(db, user.id, order_id)]

    def _transition(self, payment: Payment, next_status: str) -> bool:
        if next_status not in VALID_PAYMENT_STATUSES:
            raise AppException("INVALID_PAYMENT_STATUS", "Payment status is not supported.", HTTP_422_UNPROCESSABLE_CONTENT)
        previous_status = payment.status
        if next_status != previous_status and next_status not in PAYMENT_TRANSITIONS[previous_status]:
            raise AppException("INVALID_PAYMENT_TRANSITION", "Payment status transition is not allowed.", status.HTTP_400_BAD_REQUEST)
        payment.status = next_status
        if next_status == "paid" and payment.paid_at is None:
            payment.paid_at = utc_now()
        return next_status != previous_status

    def _sync_order_and_notify(self, db: Session, payment: Payment, *, status_changed: bool) -> None:
        order = payment.order
        order.payment_status = payment.status
        if not status_changed:
            return
        if payment.status == "paid":
            notification_service.create_for_event(db, user_id=payment.user_id, event_type="payment_successful", order_id=payment.order_id)
            if order.status == "pending":
                order_service.transition(db, order, "confirmed")
        elif payment.status == "failed":
            notification_service.create_for_event(db, user_id=payment.user_id, event_type="payment_failed", order_id=payment.order_id)
        elif payment.status == "cancelled":
            notification_service.create_for_event(db, user_id=payment.user_id, event_type="payment_cancelled", order_id=payment.order_id)

    def initialize(self, db: Session, user: User, data: InitializePaymentRequest, *, client_reference: str | None = None) -> PaymentRead:
        authorize(user, Permission.PAYMENT_MANAGE_SELF)
        method = get_payment_method(data.method_id)
        if method is None or not method["enabled"]:
            raise AppException("PAYMENT_METHOD_UNAVAILABLE", "Choose a supported payment method.", HTTP_422_UNPROCESSABLE_CONTENT)
        order = order_service.get_model(db, user, data.order_id)
        existing = repo.reusable_for_order(db, user.id, order.id, data.method_id)
        if existing:
            return payment_to_read(existing)

        provider = get_payment_provider()
        initialization = provider.initialize_payment(order_id=order.id, amount=order.total, currency=order.currency, method=data.method_id)
        payment = Payment(
            order_id=order.id,
            user_id=user.id,
            provider=provider.name,
            method=data.method_id,
            amount=order.total,
            currency=order.currency,
            status="pending",
            provider_reference=initialization.provider_reference,
            client_reference=client_reference,
        )
        status_changed = self._transition(payment, initialization.status)
        repo.add(db, payment)
        self._sync_order_and_notify(db, payment, status_changed=status_changed)
        db.commit()
        db.refresh(payment)
        return payment_to_read(payment)

    def process_webhook(self, db: Session, provider_name: str, payload: dict, headers: dict[str, str]) -> dict:
        provider = get_payment_provider(provider_name)
        callback = provider.process_callback(payload, headers)
        provider_reference = callback.get("providerReference")
        next_status = callback.get("status")
        if not provider_reference or not next_status:
            raise AppException(
                "INVALID_WEBHOOK_PAYLOAD", "Webhook payload is missing payment reference or status.", HTTP_422_UNPROCESSABLE_CONTENT
            )
        payment = repo.get_by_provider_reference(db, provider.name, str(provider_reference))
        if payment is None:
            raise AppException("PAYMENT_NOT_FOUND", "Payment not found.", status.HTTP_404_NOT_FOUND)
        status_changed = self._transition(payment, str(next_status))
        payment.failure_reason = callback.get("failureReason")
        self._sync_order_and_notify(db, payment, status_changed=status_changed)
        db.commit()
        db.refresh(payment)
        return {"accepted": True, "paymentId": payment.id, "status": payment.status}


payment_service = PaymentService()
