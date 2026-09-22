from datetime import datetime

from app.core.security import ensure_aware
from app.models.address import Address
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.models.order import Order
from app.models.order_message import OrderMessage
from app.models.payment import Payment
from app.models.user import User
from app.schemas.address import AddressRead, DeliveryAddressPayload
from app.schemas.audit import AuditLogRead
from app.schemas.notification import NotificationRead
from app.schemas.order import DeliveryScheduleRead, OrderChargeRead, OrderItemRead, OrderMessageRead, OrderRead, OrderTimelineEventRead
from app.schemas.payment import PaymentRead
from app.schemas.user import NotificationPreferences, UserRead
from app.services.payment_methods import get_payment_method_label

ORDER_STEPS: list[tuple[str, str]] = [
    ("pending", "Order Received"),
    ("confirmed", "Confirmed"),
    ("processing", "Processing"),
    ("out_for_delivery", "Out for Delivery"),
    ("delivered", "Delivered"),
    ("received", "Received"),
]


def _enum_value(value: object, fallback: str) -> str:
    return str(getattr(value, "value", value) or fallback)


def iso(value: datetime | None) -> str | None:
    return ensure_aware(value).isoformat() if value else None


def user_to_read(user: User) -> UserRead:
    return UserRead(
        id=user.id,
        full_name=user.full_name,
        phone=user.phone,
        email=user.email,
        role=_enum_value(user.role, "USER"),
        is_active=user.is_active,
        avatar_url=user.avatar_url,
        preferred_language=user.preferred_language or "en",
        address_location_preference=user.address_location_preference or "single",
        notification_preferences=NotificationPreferences.model_validate(user.notification_preferences or {}),
        created_at=iso(user.created_at) or "",
    )


def address_to_read(address: Address) -> AddressRead:
    return AddressRead(
        id=address.id,
        label=address.label,
        full_address=address.full_address,
        area=address.area,
        contact_phone=address.contact_phone,
        delivery_instructions=address.delivery_instructions,
        latitude=address.latitude,
        longitude=address.longitude,
        is_default=address.is_default,
        created_at=iso(address.created_at) or "",
        updated_at=iso(address.updated_at) or "",
    )


def delivery_snapshot_to_read(snapshot: dict) -> DeliveryAddressPayload:
    return DeliveryAddressPayload.model_validate(snapshot)


def payment_to_read(payment: Payment) -> PaymentRead:
    return PaymentRead(
        id=payment.id,
        order_id=payment.order_id,
        amount=payment.amount,
        currency=payment.currency,
        method_id=payment.method,
        method_label=get_payment_method_label(payment.method),
        status=payment.status,
        provider_reference=payment.provider_reference,
        failure_reason=payment.failure_reason,
        created_at=iso(payment.created_at) or "",
        updated_at=iso(payment.updated_at) or "",
    )


def notification_to_read(notification: Notification) -> NotificationRead:
    return NotificationRead(
        id=notification.id,
        type=notification.type,
        title=notification.title,
        body=notification.message,
        read=notification.is_read,
        created_at=iso(notification.created_at) or "",
        order_id=notification.related_order_id,
    )


def order_message_to_read(message: OrderMessage) -> OrderMessageRead:
    return OrderMessageRead(
        id=message.id,
        order_id=message.order_id,
        sender=message.sender,
        body=message.body,
        created_at=iso(message.created_at) or "",
    )


def audit_log_to_read(log: AuditLog) -> AuditLogRead:
    return AuditLogRead(
        id=log.id,
        actor_user_id=log.actor_user_id,
        actor_role=log.actor_role,
        event_type=log.event_type,
        resource_type=log.resource_type,
        resource_id=log.resource_id,
        metadata=log.metadata_json or {},
        created_at=iso(log.created_at) or "",
    )


def build_order_timeline(order: Order) -> list[OrderTimelineEventRead]:
    if order.status == "cancelled":
        return [
            OrderTimelineEventRead(id="pending", status="pending", label="Order Received", completed_at=iso(order.created_at)),
            OrderTimelineEventRead(
                id="cancelled", status="cancelled", label="Cancelled", completed_at=iso(order.cancelled_at or order.updated_at)
            ),
        ]

    current_index = next((index for index, item in enumerate(ORDER_STEPS) if item[0] == order.status), 0)
    timestamp_by_status = {
        "pending": order.created_at,
        "confirmed": order.confirmed_at or order.updated_at,
        "processing": order.updated_at,
        "out_for_delivery": order.updated_at,
        "delivered": order.delivered_at or order.updated_at,
        "received": order.customer_received_at or order.updated_at,
    }
    events: list[OrderTimelineEventRead] = []
    for index, (step_status, label) in enumerate(ORDER_STEPS):
        events.append(
            OrderTimelineEventRead(
                id=step_status,
                status=step_status,
                label=label,
                completed_at=iso(timestamp_by_status[step_status]) if index <= current_index else None,
            )
        )
    return events


def available_order_actions(order: Order) -> list[str]:
    actions = ["contact_support", "message_nelma"]
    if order.status in {"pending", "confirmed"}:
        actions.insert(0, "cancel")
    if order.status == "delivered" and order.customer_received_at is None:
        actions.insert(0, "mark_received")
    if order.status in {"delivered", "received", "cancelled"}:
        actions.insert(0, "reorder")
    return actions


def order_to_read(order: Order) -> OrderRead:
    items = [
        OrderItemRead(
            product_name=item.product_name,
            order_type=item.product_type,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.line_total,
        )
        for item in order.items
    ]
    quantity = sum(item.quantity for item in order.items)
    order_type = order.items[0].product_type if order.items else "refill"
    latest_payment = max(order.payments, key=lambda payment: payment.created_at) if order.payments else None
    schedule = DeliveryScheduleRead.model_validate(order.delivery_schedule_snapshot) if order.delivery_schedule_snapshot else None
    charges = [OrderChargeRead.model_validate(charge) for charge in (order.charges_snapshot or [])]
    messages = sorted(order.messages, key=lambda message: message.created_at)
    return OrderRead(
        id=order.id,
        order_number=order.order_number,
        customer_id=order.user_id,
        customer_name=order.user.full_name if order.user else None,
        customer_phone=order.user.phone if order.user else None,
        created_by_user_id=order.created_by_user_id,
        source=order.source,
        assigned_driver_id=order.assigned_driver_id,
        created_at=iso(order.created_at) or "",
        updated_at=iso(order.updated_at) or "",
        order_type=order_type,
        items=items,
        quantity=quantity,
        delivery_address=delivery_snapshot_to_read(order.delivery_address_snapshot),
        delivery_schedule=schedule,
        customer_remarks=order.customer_remarks,
        customer_received_at=iso(order.customer_received_at),
        customer_received_by_user_id=order.customer_received_by_user_id,
        messages=[order_message_to_read(message) for message in messages],
        subtotal=order.subtotal,
        charges=charges,
        total=order.total,
        currency=order.currency,
        status=order.status,
        payment_status=order.payment_status,
        payment=payment_to_read(latest_payment) if latest_payment else None,
        timeline=build_order_timeline(order),
        available_actions=available_order_actions(order),
    )
