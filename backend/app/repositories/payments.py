from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.payment import Payment


class PaymentRepository:
    def get_for_user(self, db: Session, user_id: str, payment_id: str) -> Payment | None:
        return db.scalar(select(Payment).where(Payment.id == payment_id, Payment.user_id == user_id).options(selectinload(Payment.order)))

    def get_by_provider_reference(self, db: Session, provider: str, provider_reference: str) -> Payment | None:
        return db.scalar(
            select(Payment)
            .where(Payment.provider == provider, Payment.provider_reference == provider_reference)
            .options(selectinload(Payment.order))
        )

    def list_for_order(self, db: Session, user_id: str, order_id: str) -> list[Payment]:
        return list(
            db.scalars(select(Payment).where(Payment.order_id == order_id, Payment.user_id == user_id).order_by(Payment.created_at.desc()))
        )

    def reusable_for_order(self, db: Session, user_id: str, order_id: str, method: str) -> Payment | None:
        return db.scalar(
            select(Payment)
            .where(
                Payment.user_id == user_id,
                Payment.order_id == order_id,
                Payment.method == method,
                Payment.status.in_(["pending", "processing", "paid"]),
            )
            .order_by(Payment.created_at.desc())
        )

    def add(self, db: Session, payment: Payment) -> Payment:
        db.add(payment)
        db.flush()
        return payment
