import json
from math import ceil

from fastapi import status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.core.permissions import Permission, authorize
from app.core.roles import Role
from app.models.app_setting import AppSetting
from app.models.notification import Notification
from app.models.user import User
from app.repositories.notifications import NotificationRepository
from app.schemas.common import Page
from app.schemas.notification import NotificationRead
from app.services import push_service
from app.services.serializers import notification_to_read

repo = NotificationRepository()


EVENT_COPY = {
    "order_received": ("Order received", "NELMA received your water order."),
    "order_confirmed": ("Order confirmed", "Your NELMA order has been confirmed."),
    "order_processing": ("Order processing", "Your water order is being prepared."),
    "order_dispatched": ("Out for delivery", "Your water is on the way."),
    "order_delivered": ("Delivered", "Your NELMA water order has been delivered."),
    "order_customer_received": ("Order received", "Thank you for confirming your delivery."),
    "order_message": ("Order message", "A message was added to your NELMA order."),
    "payment_successful": ("Payment successful", "Your payment has been received."),
    "payment_failed": ("Payment failed", "Your payment could not be completed."),
    "payment_cancelled": ("Payment cancelled", "Your payment was cancelled."),
    "order_cancelled": ("Order cancelled", "Your NELMA order has been cancelled."),
    "driver_delivery_assigned": ("Delivery assigned", "A NELMA delivery has been assigned to you."),
    "driver_customer_received": ("Customer confirmed delivery", "The customer has confirmed receiving your delivery."),
    "driver_delivery_reassigned": (
        "Delivery assignment changed",
        "A delivery assignment changed. Open your delivery list for the latest route.",
    ),
    "driver_schedule_changed": ("Delivery schedule changed", "A scheduled delivery assigned to you has changed."),
    "driver_delivery_note": ("Delivery note", "NELMA added an important note to a delivery assigned to you."),
    "driver_system_message": ("NELMA driver update", "You have a new driver update from NELMA."),
    "order_delivery_issue": ("Delivery attempt", "Your driver could not complete the delivery. NELMA will contact you."),
    "staff_delivery_issue": ("Delivery problem", "A driver reported a problem with a delivery. Open the order for details."),
}


class NotificationService:
    def create_for_event(self, db: Session, *, user_id: str, event_type: str, order_id: str | None = None) -> Notification:
        title, body = EVENT_COPY.get(event_type, ("NELMA update", "You have a new NELMA update."))
        notification = Notification(
            user_id=user_id,
            type=event_type,
            title=title,
            message=body,
            related_order_id=order_id,
        )
        repo.add(db, notification)
        push_service.queue_push(db, user_id=user_id, title=title, body=body, data={"type": event_type, "orderId": order_id})
        alert_key = (
            "newOrderAlerts"
            if event_type == "order_received"
            else "paymentAlerts"
            if event_type.startswith("payment_")
            else "deliveryAlerts"
            if event_type in {"order_dispatched", "order_delivered", "order_customer_received"}
            else None
        )
        if alert_key:
            setting = db.get(AppSetting, "DASHBOARD_SETTINGS")
            preferences = json.loads(setting.value).get("notifications", {}) if setting else {}
            if preferences.get(alert_key, True):
                for staff in db.scalars(
                    select(User).where(User.role.in_([Role.SALES_MANAGER, Role.SYSTEM_ADMIN]), User.is_active.is_(True))
                ):
                    repo.add(
                        db,
                        Notification(
                            user_id=staff.id,
                            type=event_type,
                            title=title,
                            message=f"{title}. Open the order for details.",
                            related_order_id=order_id,
                        ),
                    )
        return notification

    def notify_staff(self, db: Session, *, event_type: str, order_id: str | None = None) -> None:
        title, body = EVENT_COPY[event_type]
        for staff in db.scalars(select(User).where(User.role.in_([Role.SALES_MANAGER, Role.SYSTEM_ADMIN]), User.is_active.is_(True))):
            repo.add(db, Notification(user_id=staff.id, type=event_type, title=title, message=body, related_order_id=order_id))

    def list(self, db: Session, user: User, *, page: int = 1, page_size: int = 20) -> Page[NotificationRead]:
        authorize(user, Permission.NOTIFICATION_VIEW_SELF)
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        items, total = repo.list_for_user(db, user.id, page=page, page_size=page_size)
        total_pages = max(1, ceil(total / page_size)) if total else 1
        return Page(
            items=[notification_to_read(item) for item in items],
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1 and total > 0,
        )

    def mark_read(self, db: Session, user: User, notification_id: str) -> NotificationRead:
        authorize(user, Permission.NOTIFICATION_VIEW_SELF)
        notification = repo.get_for_user(db, user.id, notification_id)
        if notification is None:
            raise AppException("NOTIFICATION_NOT_FOUND", "Notification not found.", status.HTTP_404_NOT_FOUND)
        notification.is_read = True
        db.commit()
        db.refresh(notification)
        return notification_to_read(notification)

    def read_all(self, db: Session, user: User) -> None:
        authorize(user, Permission.NOTIFICATION_VIEW_SELF)
        db.execute(update(Notification).where(Notification.user_id == user.id).values(is_read=True))
        db.commit()


notification_service = NotificationService()
