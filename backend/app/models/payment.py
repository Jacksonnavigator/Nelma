from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.security import new_uuid
from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.order import Order
    from app.models.user import User


class Payment(TimestampMixin, Base):
    __tablename__ = "payments"
    __table_args__ = (
        Index("ix_payments_order_id", "order_id"),
        Index("ix_payments_user_id", "user_id"),
        Index("ix_payments_provider_reference", "provider_reference", unique=True),
        Index("ix_payments_client_reference", "client_reference"),
        Index("ix_payments_collected_by_handed_in", "collected_by_user_id", "handed_in_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider: Mapped[str] = mapped_column(String(40), nullable=False)
    method: Mapped[str] = mapped_column(String(40), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="TZS", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    provider_reference: Mapped[str | None] = mapped_column(String(120), nullable=True)
    client_reference: Mapped[str | None] = mapped_column(String(120), nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # Cash only: who is holding the money, and when it was handed in to the office.
    collected_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    handed_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    handed_in_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    order: Mapped["Order"] = relationship(back_populates="payments")
    user: Mapped["User"] = relationship(back_populates="payments", foreign_keys=[user_id])
    collected_by: Mapped["User | None"] = relationship(foreign_keys=[collected_by_user_id])
