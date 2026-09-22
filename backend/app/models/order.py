from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.security import new_uuid
from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.order_item import OrderItem
    from app.models.order_message import OrderMessage
    from app.models.payment import Payment
    from app.models.user import User




class Order(TimestampMixin, Base):
    __tablename__ = "orders"
    __table_args__ = (
        Index("ix_orders_user_id", "user_id"),
        Index("ix_orders_order_number", "order_number", unique=True),
        Index("ix_orders_status", "status"),
        Index("ix_orders_created_at", "created_at"),
        Index("ix_orders_user_status", "user_id", "status"),
        Index("ix_orders_created_by_user_id", "created_by_user_id"),
        Index("ix_orders_assigned_driver_id", "assigned_driver_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    order_number: Mapped[str] = mapped_column(String(40), nullable=False, unique=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    source: Mapped[str] = mapped_column(String(40), default="USER_MOBILE", nullable=False)
    assigned_driver_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="TZS", nullable=False)
    subtotal: Mapped[int] = mapped_column(Integer, nullable=False)
    total: Mapped[int] = mapped_column(Integer, nullable=False)
    payment_status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    payment_method: Mapped[str] = mapped_column(String(40), nullable=False)
    delivery_address_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    charges_snapshot: Mapped[list[dict]] = mapped_column(JSON, default=list, nullable=False)
    delivery_schedule_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    customer_remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    customer_received_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    customer_received_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(back_populates="orders", foreign_keys=[user_id])
    created_by: Mapped["User | None"] = relationship(foreign_keys=[created_by_user_id])
    assigned_driver: Mapped["User | None"] = relationship(foreign_keys=[assigned_driver_id])
    customer_received_by: Mapped["User | None"] = relationship(foreign_keys=[customer_received_by_user_id])
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    messages: Mapped[list["OrderMessage"]] = relationship(back_populates="order", cascade="all, delete-orphan", order_by="OrderMessage.created_at")
    payments: Mapped[list["Payment"]] = relationship(back_populates="order", cascade="all, delete-orphan")

