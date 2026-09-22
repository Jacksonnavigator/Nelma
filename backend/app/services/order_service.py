from __future__ import annotations

import secrets
from datetime import UTC, datetime
from math import ceil

from fastapi import status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.core.http_status import HTTP_422_UNPROCESSABLE_CONTENT
from app.core.permissions import Permission, authorize
from app.core.roles import Role
from app.core.security import utc_now
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.order_message import OrderMessage
from app.models.user import User
from app.repositories.orders import OrderRepository
from app.repositories.users import UserRepository
from app.schemas.common import Page
from app.schemas.order import CreateOrderForCustomerRequest, CreateOrderMessageRequest, CreateOrderRequest, OrderRead
from app.services.address_service import address_service
from app.services.audit_service import audit_service
from app.services.delivery_service import charges_for_snapshot, schedule_snapshot
from app.services.notification_service import notification_service
from app.services.pricing_service import pricing_service
from app.services.serializers import order_to_read

repo = OrderRepository()
user_repo = UserRepository()

VALID_STATUSES = ["pending", "confirmed", "processing", "out_for_delivery", "delivered", "received", "cancelled"]
CUSTOMER_CANCELLABLE_STATUSES = {"pending", "confirmed"}
ALLOWED_TRANSITIONS = {
    "pending": {"confirmed", "cancelled"},
    "confirmed": {"processing", "cancelled"},
    "processing": {"out_for_delivery"},
    "out_for_delivery": {"delivered"},
    "delivered": {"received"},
    "received": set(),
    "cancelled": set(),
}


class OrderService:
    def _generate_order_number(self, db: Session) -> str:
        today = datetime.now(UTC).strftime("%Y%m%d")
        for _ in range(25):
            candidate = f"NELMA-{today}-{secrets.randbelow(1_000_000):06d}"
            if repo.get_by_number(db, candidate) is None:
                return candidate
        raise AppException("ORDER_NUMBER_FAILED", "Could not generate an order number.", status.HTTP_500_INTERNAL_SERVER_ERROR)

    def list(
        self,
        db: Session,
        user: User,
        *,
        page: int = 1,
        page_size: int = 20,
        order_status: str | None = None,
        active: bool | None = None,
        completed: bool | None = None,
    ) -> Page[OrderRead]:
        authorize(user, Permission.ORDER_VIEW_SELF)
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        if order_status and order_status not in VALID_STATUSES:
            raise AppException("INVALID_ORDER_STATUS", "Use a supported order status.", HTTP_422_UNPROCESSABLE_CONTENT)
        orders, total = repo.list_for_user(
            db, user.id, page=page, page_size=page_size, status=order_status, active=active, completed=completed
        )
        total_pages = max(1, ceil(total / page_size)) if total else 1
        return Page(
            items=[order_to_read(order) for order in orders],
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1 and total > 0,
        )

    def list_assigned_to_driver(self, db: Session, driver: User) -> list[OrderRead]:
        authorize(driver, Permission.DELIVERY_VIEW_ASSIGNED)
        return [order_to_read(order) for order in repo.list_for_driver(db, driver.id)]

    def get(self, db: Session, user: User, order_id: str) -> OrderRead:
        authorize(user, Permission.ORDER_VIEW_SELF)
        return order_to_read(self.get_model(db, user, order_id))

    def get_for_driver(self, db: Session, driver: User, order_id: str) -> OrderRead:
        authorize(driver, Permission.DELIVERY_VIEW_ASSIGNED)
        return order_to_read(self.get_assigned_driver_model(db, driver, order_id))

    def get_for_dashboard(self, db: Session, actor: User, order_id: str) -> OrderRead:
        authorize(actor, Permission.ORDER_VIEW_ALL)
        return order_to_read(self.get_any_model(db, order_id))

    def get_model(self, db: Session, user: User, order_id: str) -> Order:
        order = repo.get_for_user(db, user.id, order_id)
        if order is None:
            raise AppException("ORDER_NOT_FOUND", "Order not found.", status.HTTP_404_NOT_FOUND)
        return order

    def get_assigned_driver_model(self, db: Session, driver: User, order_id: str) -> Order:
        order = repo.get_for_driver(db, driver.id, order_id)
        if order is None:
            raise AppException("ORDER_NOT_FOUND", "Order not found.", status.HTTP_404_NOT_FOUND)
        return order

    def get_any_model(self, db: Session, order_id: str) -> Order:
        order = repo.get_by_id(db, order_id)
        if order is None:
            raise AppException("ORDER_NOT_FOUND", "Order not found.", status.HTTP_404_NOT_FOUND)
        return order

    def create(self, db: Session, user: User, data: CreateOrderRequest) -> OrderRead:
        authorize(user, Permission.ORDER_PLACE_SELF)
        return self._create_for_customer(db, customer=user, actor=user, data=data, source="USER_MOBILE")

    def create_for_customer(self, db: Session, actor: User, data: CreateOrderForCustomerRequest) -> OrderRead:
        authorize(actor, Permission.ORDER_PLACE_FOR_CUSTOMER)
        customer = user_repo.get(db, data.customer_id)
        if customer is None or customer.role != Role.USER or not customer.is_active:
            raise AppException("CUSTOMER_NOT_FOUND", "Customer not found.", status.HTTP_404_NOT_FOUND)
        order = self._create_for_customer(db, customer=customer, actor=actor, data=data, source="SALES_MANAGER_DASHBOARD")
        audit_service.record(
            db,
            actor=actor,
            event_type="SALES_MANAGER_ORDER_CREATED",
            resource_type="order",
            resource_id=order.id,
            metadata={"customerId": customer.id},
        )
        db.commit()
        return order

    def _create_for_customer(self, db: Session, *, customer: User, actor: User, data: CreateOrderRequest, source: str) -> OrderRead:
        unit_price, subtotal, _ = pricing_service.calculate(db, data.order_type, data.quantity)
        if data.address_id:
            saved_address = address_service.get_model(db, customer, data.address_id)
            snapshot = address_service.snapshot_from_saved(saved_address)
        elif data.delivery_address:
            snapshot = address_service.snapshot_from_payload(data.delivery_address)
        else:
            raise AppException("ADDRESS_REQUIRED", "Delivery address is required.", HTTP_422_UNPROCESSABLE_CONTENT)

        charges = charges_for_snapshot(snapshot)
        total = subtotal + sum(int(charge.get("amount", 0)) for charge in charges)
        remarks = (data.customer_remarks or "").strip() or None
        order = Order(
            order_number=self._generate_order_number(db),
            user_id=customer.id,
            created_by_user_id=actor.id,
            source=source,
            status="pending",
            currency=get_settings().currency,
            subtotal=subtotal,
            total=total,
            payment_status="pending",
            payment_method=data.payment_method_id,
            delivery_address_snapshot=snapshot,
            charges_snapshot=charges,
            delivery_schedule_snapshot=schedule_snapshot(data.delivery_schedule),
            customer_remarks=remarks,
        )
        order.items.append(
            OrderItem(
                product_type=data.order_type,
                product_name=pricing_service.product_name(data.order_type),
                quantity=data.quantity,
                unit_price=unit_price,
                line_total=subtotal,
            )
        )
        if remarks:
            sender = "customer" if actor.id == customer.id else "nelma"
            order.messages.append(OrderMessage(user_id=actor.id, sender=sender, body=remarks))
        repo.add(db, order)
        notification_service.create_for_event(db, user_id=customer.id, event_type="order_received", order_id=order.id)
        db.commit()
        db.refresh(order)
        return order_to_read(self.get_any_model(db, order.id))

    def transition(self, db: Session, order: Order, next_status: str, *, actor: User | None = None) -> Order:
        if next_status == "received" and (actor is None or actor.role != Role.USER or actor.id != order.user_id):
            raise AppException("FORBIDDEN", "Only the customer who placed this order can confirm receipt.", status.HTTP_403_FORBIDDEN)
        if next_status not in ALLOWED_TRANSITIONS.get(order.status, set()):
            raise AppException("INVALID_ORDER_TRANSITION", "This order status transition is not allowed.", status.HTTP_400_BAD_REQUEST)
        order.status = next_status
        now = utc_now()
        if next_status == "confirmed":
            order.confirmed_at = now
            notification_service.create_for_event(db, user_id=order.user_id, event_type="order_confirmed", order_id=order.id)
        elif next_status == "processing":
            notification_service.create_for_event(db, user_id=order.user_id, event_type="order_processing", order_id=order.id)
        elif next_status == "out_for_delivery":
            notification_service.create_for_event(db, user_id=order.user_id, event_type="order_dispatched", order_id=order.id)
        elif next_status == "delivered":
            order.delivered_at = now
            notification_service.create_for_event(db, user_id=order.user_id, event_type="order_delivered", order_id=order.id)
        elif next_status == "received":
            order.customer_received_at = now
            order.customer_received_by_user_id = actor.id if actor else None
            if order.delivered_at is None:
                order.delivered_at = now
            notification_service.create_for_event(db, user_id=order.user_id, event_type="order_customer_received", order_id=order.id)
            if order.assigned_driver_id:
                notification_service.create_for_event(
                    db, user_id=order.assigned_driver_id, event_type="driver_customer_received", order_id=order.id
                )
        elif next_status == "cancelled":
            order.cancelled_at = now
            if order.payment_status in {"pending", "processing"}:
                order.payment_status = "cancelled"
            notification_service.create_for_event(db, user_id=order.user_id, event_type="order_cancelled", order_id=order.id)
        return order

    def transition_internal(self, db: Session, order_id: str, next_status: str) -> OrderRead:
        order = self.get_any_model(db, order_id)
        self.transition(db, order, next_status)
        db.commit()
        db.refresh(order)
        return order_to_read(self.get_any_model(db, order.id))

    def process_status(self, db: Session, actor: User, order_id: str, next_status: str) -> OrderRead:
        authorize(actor, Permission.ORDER_PROCESS)
        if next_status == "received":
            authorize(actor, Permission.CUSTOMER_RECEIPT_CONFIRM)
        order = self.get_any_model(db, order_id)
        self.transition(db, order, next_status, actor=actor)
        audit_service.record(db, actor=actor, event_type="ORDER_STATUS_UPDATED", resource_type="order", resource_id=order.id, metadata={"status": next_status})
        db.commit()
        db.refresh(order)
        return order_to_read(self.get_any_model(db, order.id))

    def _release_assigned_order(self, db: Session, order: Order, actor: User) -> None:
        # Assignment is dispatch approval. Preserve the existing lifecycle events
        # without requiring staff to confirm and process the order separately.
        previous_status = order.status
        if order.status == "pending":
            self.transition(db, order, "confirmed", actor=actor)
        if order.status == "confirmed":
            self.transition(db, order, "processing", actor=actor)
        if order.status != previous_status:
            audit_service.record(
                db,
                actor=actor,
                event_type="ORDER_STATUS_UPDATED",
                resource_type="order",
                resource_id=order.id,
                metadata={
                    "previousStatus": previous_status,
                    "status": order.status,
                    "reason": "driver_assignment",
                    "driverId": order.assigned_driver_id,
                },
            )

    def update_assigned_delivery_status(self, db: Session, driver: User, order_id: str, next_status: str) -> OrderRead:
        authorize(driver, Permission.DELIVERY_UPDATE)
        if next_status == "received":
            authorize(driver, Permission.CUSTOMER_RECEIPT_CONFIRM)
        if next_status not in {"out_for_delivery", "delivered", "received"}:
            raise AppException("INVALID_DRIVER_DELIVERY_STATUS", "Drivers can only update active delivery progress.", status.HTTP_400_BAD_REQUEST)
        order = self.get_assigned_driver_model(db, driver, order_id)
        if next_status == "out_for_delivery":
            # Also support assignments created before assignment released orders.
            self._release_assigned_order(db, order, driver)
        self.transition(db, order, next_status, actor=driver)
        db.commit()
        db.refresh(order)
        return order_to_read(self.get_assigned_driver_model(db, driver, order.id))

    def assign_driver(self, db: Session, actor: User, order_id: str, driver_id: str) -> OrderRead:
        authorize(actor, Permission.DRIVER_ASSIGN)
        order = self.get_any_model(db, order_id)
        if order.status in {"delivered", "received", "cancelled"}:
            raise AppException("DELIVERY_CLOSED", "Completed or cancelled deliveries cannot be assigned.", status.HTTP_409_CONFLICT)
        driver = user_repo.get(db, driver_id)
        if driver is None or driver.role != Role.DRIVER or not driver.is_active:
            raise AppException("DRIVER_NOT_FOUND", "Driver not found.", status.HTTP_404_NOT_FOUND)
        previous_driver_id = order.assigned_driver_id
        order.assigned_driver_id = driver.id
        self._release_assigned_order(db, order, actor)
        if previous_driver_id and previous_driver_id != driver.id:
            notification_service.create_for_event(db, user_id=previous_driver_id, event_type="driver_delivery_reassigned", order_id=order.id)
            notification_service.create_for_event(db, user_id=driver.id, event_type="driver_delivery_reassigned", order_id=order.id)
        else:
            notification_service.create_for_event(db, user_id=driver.id, event_type="driver_delivery_assigned", order_id=order.id)
        audit_service.record(db, actor=actor, event_type="DRIVER_ASSIGNED", resource_type="order", resource_id=order.id, metadata={"driverId": driver.id})
        db.commit()
        db.refresh(order)
        return order_to_read(self.get_any_model(db, order.id))

    def cancel(self, db: Session, user: User, order_id: str) -> OrderRead:
        authorize(user, Permission.ORDER_VIEW_SELF)
        order = self.get_model(db, user, order_id)
        if order.status not in CUSTOMER_CANCELLABLE_STATUSES:
            raise AppException("ORDER_NOT_CANCELLABLE", "This order can no longer be cancelled.", status.HTTP_400_BAD_REQUEST)
        self.transition(db, order, "cancelled", actor=user)
        db.commit()
        db.refresh(order)
        return order_to_read(self.get_model(db, user, order.id))

    def confirm_received(self, db: Session, user: User, order_id: str) -> OrderRead:
        authorize(user, Permission.CUSTOMER_RECEIPT_CONFIRM)
        order = self.get_model(db, user, order_id)
        return self._confirm_received_model(db, order, user)

    def confirm_received_by_driver(self, db: Session, driver: User, order_id: str) -> OrderRead:
        authorize(driver, Permission.DELIVERY_VIEW_ASSIGNED)
        authorize(driver, Permission.CUSTOMER_RECEIPT_CONFIRM)
        order = self.get_assigned_driver_model(db, driver, order_id)
        return self._confirm_received_model(db, order, driver)

    def _confirm_received_model(self, db: Session, order: Order, actor: User) -> OrderRead:
        if order.status == "received":
            return order_to_read(order)
        if order.status != "delivered":
            raise AppException("ORDER_NOT_DELIVERED", "Only delivered orders can be marked as received.", status.HTTP_400_BAD_REQUEST)
        self.transition(db, order, "received", actor=actor)
        db.commit()
        db.refresh(order)
        return order_to_read(self.get_any_model(db, order.id))

    def message(self, db: Session, user: User, order_id: str, data: CreateOrderMessageRequest) -> OrderRead:
        authorize(user, Permission.ORDER_VIEW_SELF)
        order = self.get_model(db, user, order_id)
        order.messages.append(OrderMessage(user_id=user.id, sender="customer", body=data.body.strip()))
        notification_service.create_for_event(db, user_id=user.id, event_type="order_message", order_id=order.id)
        db.commit()
        db.refresh(order)
        return order_to_read(self.get_model(db, user, order.id))


order_service = OrderService()

