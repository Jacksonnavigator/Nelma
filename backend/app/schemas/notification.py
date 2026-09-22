from typing import Literal

from pydantic import AliasChoices, Field

from app.schemas.common import CamelModel

NotificationType = Literal[
    "order_received",
    "payment_successful",
    "order_confirmed",
    "order_processing",
    "order_dispatched",
    "order_delivered",
    "order_customer_received",
    "driver_customer_received",
    "order_message",
    "payment_failed",
    "payment_cancelled",
    "order_cancelled",
    "system_announcement",
    "driver_delivery_assigned",
    "driver_delivery_reassigned",
    "driver_schedule_changed",
    "driver_delivery_note",
    "driver_system_message",
]


class NotificationRead(CamelModel):
    id: str
    type: NotificationType
    title: str
    body: str = Field(validation_alias=AliasChoices("body", "message"))
    read: bool = Field(validation_alias=AliasChoices("read", "is_read"))
    created_at: str = Field(validation_alias=AliasChoices("createdAt", "created_at"))
    order_id: str | None = Field(None, validation_alias=AliasChoices("orderId", "related_order_id"))
