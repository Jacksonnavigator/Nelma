"""Dispatch oversight: cash drivers still hold, deliveries that need a second look, and stalled assignments."""

from datetime import timedelta

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.core.permissions import Permission, authorize
from app.core.roles import Role
from app.core.security import ensure_aware, utc_now
from app.models.audit_log import AuditLog
from app.models.order import Order
from app.models.payment import Payment
from app.models.user import User
from app.services.audit_service import audit_service
from app.services.dashboard_service import driver_position, today
from app.services.order_service import DECLINE_LABELS, ISSUE_LABELS
from app.services.serializers import iso

FLAG_EVENTS = ("DELIVERY_HANDOVER_RECORDED", "DELIVERY_ISSUE_REPORTED", "ASSIGNMENT_DECLINED", "DELIVERY_CODE_LOCKED")
FLAG_WINDOW_DAYS = 30
NOT_STARTED_MINUTES = 120
SKIP_LABELS = {"customer_has_no_phone": "customer had no phone", "code_not_working": "customer's code did not work"}


def _flag_kinds(event: AuditLog) -> list[str]:
    meta = event.metadata_json or {}
    if event.event_type == "DELIVERY_HANDOVER_RECORDED":
        kinds = []
        if meta.get("proof") == "skipped":
            kinds.append("proof_skipped")
        if meta.get("farFromAddress"):
            kinds.append("far_from_address")
        return kinds
    if event.event_type == "DELIVERY_ISSUE_REPORTED":
        return [] if meta.get("reason") == "started_by_mistake" else ["delivery_issue"]
    if event.event_type == "ASSIGNMENT_DECLINED":
        return ["declined"]
    return ["code_locked"]


def _flag_detail(event: AuditLog) -> str:
    meta = event.metadata_json or {}
    note = f" ({meta['note']})" if meta.get("note") else ""
    if event.event_type == "DELIVERY_HANDOVER_RECORDED":
        parts = []
        if meta.get("proof") == "skipped":
            parts.append("Delivered without the code: " + SKIP_LABELS.get(meta.get("skipReason"), "no reason given"))
        if meta.get("farFromAddress"):
            parts.append(f"Marked delivered {int(meta.get('distanceMeters') or 0):,} m from the saved address")
        return ". ".join(parts)
    if event.event_type == "DELIVERY_ISSUE_REPORTED":
        return ISSUE_LABELS.get(meta.get("reason"), "Problem reported") + note
    if event.event_type == "ASSIGNMENT_DECLINED":
        return "Declined: " + DECLINE_LABELS.get(meta.get("reason"), "no reason given") + note
    return "Too many wrong delivery codes were entered"


def _order_bits(order: Order | None) -> dict:
    if order is None:
        return {"orderId": None, "orderNumber": None, "customerName": None, "area": None}
    snapshot = order.delivery_address_snapshot or {}
    return {
        "orderId": order.id,
        "orderNumber": order.order_number,
        "customerName": order.user.full_name if order.user else None,
        "area": snapshot.get("area") or snapshot.get("full_address") or "",
    }


class OperationsService:
    def overview(self, db: Session, actor: User) -> dict:
        authorize(actor, Permission.DELIVERY_VIEW_ALL)
        now = utc_now()
        return {
            "generatedAt": iso(now),
            "cash": self._cash(db),
            "flags": self._flags(db, now),
            "stalled": self._stalled(db, now),
            "drivers": self._drivers_on_duty(db),
        }

    def _drivers_on_duty(self, db: Session) -> list[dict]:
        drivers = list(db.scalars(select(User).where(User.role == Role.DRIVER, User.is_active.is_(True), User.is_on_duty.is_(True))))
        counts: dict[str, dict[str, int]] = {}
        for driver_id, order_status, total in db.execute(
            select(Order.assigned_driver_id, Order.status, func.count())
            .where(Order.assigned_driver_id.in_([d.id for d in drivers]), Order.status.in_(["pending", "confirmed", "processing", "out_for_delivery"]))
            .group_by(Order.assigned_driver_id, Order.status)
        ):
            counts.setdefault(driver_id, {})[order_status] = total
        rows = [
            {
                "driverId": driver.id,
                "driverName": driver.full_name,
                "driverPhone": driver.phone,
                "onTheRoad": counts.get(driver.id, {}).get("out_for_delivery", 0),
                "waiting": sum(n for s, n in counts.get(driver.id, {}).items() if s != "out_for_delivery"),
                "lastLocation": driver_position(driver),
            }
            for driver in drivers
        ]
        return sorted(rows, key=lambda row: (-row["onTheRoad"], -row["waiting"], row["driverName"]))

    def _cash(self, db: Session) -> list[dict]:
        payments = list(
            db.scalars(
                select(Payment)
                .join(User, User.id == Payment.collected_by_user_id)
                .where(Payment.provider == "cash", Payment.status == "paid", Payment.handed_in_at.is_(None), User.role == Role.DRIVER)
                .options(selectinload(Payment.collected_by), selectinload(Payment.order).selectinload(Order.user))
                .order_by(Payment.paid_at)
            )
        )
        ledger: dict[str, dict] = {}
        for payment in payments:
            driver = payment.collected_by
            entry = ledger.setdefault(
                driver.id,
                {
                    "driverId": driver.id,
                    "driverName": driver.full_name,
                    "driverPhone": driver.phone,
                    "onDuty": driver.is_on_duty,
                    "amount": 0,
                    "oldestAt": iso(payment.paid_at),
                    "receipts": [],
                },
            )
            entry["amount"] += payment.amount
            entry["receipts"].append(
                {"paymentId": payment.id, "amount": payment.amount, "collectedAt": iso(payment.paid_at), **_order_bits(payment.order)}
            )
        return sorted(ledger.values(), key=lambda entry: entry["amount"], reverse=True)

    def _flags(self, db: Session, now) -> list[dict]:
        events = list(
            db.scalars(
                select(AuditLog)
                .where(AuditLog.event_type.in_(FLAG_EVENTS), AuditLog.created_at >= now - timedelta(days=FLAG_WINDOW_DAYS))
                .order_by(AuditLog.created_at.desc())
                .limit(300)
            )
        )
        events = [event for event in events if _flag_kinds(event)]
        if not events:
            return []
        reviewed = set(
            db.scalars(
                select(AuditLog.resource_id).where(AuditLog.event_type == "FLAG_REVIEWED", AuditLog.resource_id.in_([e.id for e in events]))
            )
        )
        events = [event for event in events if event.id not in reviewed]
        orders = {
            order.id: order
            for order in db.scalars(
                select(Order).where(Order.id.in_({e.resource_id for e in events})).options(selectinload(Order.user))
            )
        }
        drivers = {user.id: user for user in db.scalars(select(User).where(User.id.in_({e.actor_user_id for e in events if e.actor_user_id})))}
        return [
            {
                "id": event.id,
                "at": iso(event.created_at),
                "kinds": _flag_kinds(event),
                "detail": _flag_detail(event),
                "driverId": event.actor_user_id,
                "driverName": drivers[event.actor_user_id].full_name if event.actor_user_id in drivers else "Unknown driver",
                **_order_bits(orders.get(event.resource_id)),
            }
            for event in events
        ]

    def _stalled(self, db: Session, now) -> list[dict]:
        accept_cutoff = now - timedelta(minutes=get_settings().assignment_accept_minutes)
        start_cutoff = now - timedelta(minutes=NOT_STARTED_MINUTES)
        current_day = today().isoformat()
        orders = db.scalars(
            select(Order)
            .where(Order.assigned_driver_id.is_not(None), Order.status.in_(["pending", "confirmed", "processing"]))
            .options(selectinload(Order.user), selectinload(Order.assigned_driver))
            .order_by(Order.driver_assigned_at)
        )
        rows = []
        for order in orders:
            driver = order.assigned_driver
            assigned_at = ensure_aware(order.driver_assigned_at) if order.driver_assigned_at else None
            accepted_at = ensure_aware(order.driver_accepted_at) if order.driver_accepted_at else None
            schedule = order.delivery_schedule_snapshot or {}
            if driver is not None and not driver.is_on_duty:
                kind, since = "driver_off_duty", assigned_at
            elif accepted_at is None and assigned_at is not None and assigned_at < accept_cutoff:
                kind, since = "not_accepted", assigned_at
            elif accepted_at is not None and accepted_at < start_cutoff and schedule.get("date", current_day) <= current_day:
                kind, since = "not_started", accepted_at
            else:
                continue
            rows.append(
                {
                    "kind": kind,
                    "since": iso(since),
                    "driverId": order.assigned_driver_id,
                    "driverName": driver.full_name if driver else "Unknown driver",
                    "scheduledDate": schedule.get("date"),
                    "timeWindow": schedule.get("window") or schedule.get("label"),
                    **_order_bits(order),
                }
            )
        return rows

    def review_flag(self, db: Session, actor: User, flag_id: str) -> None:
        authorize(actor, Permission.DELIVERY_VIEW_ALL)
        event = db.get(AuditLog, flag_id)
        if event is None or event.event_type not in FLAG_EVENTS:
            raise AppException("FLAG_NOT_FOUND", "This flag no longer exists.", status.HTTP_404_NOT_FOUND)
        already = db.scalar(select(AuditLog.id).where(AuditLog.event_type == "FLAG_REVIEWED", AuditLog.resource_id == flag_id))
        if already is None:
            audit_service.record(
                db, actor=actor, event_type="FLAG_REVIEWED", resource_type="audit_log", resource_id=flag_id, metadata={"orderId": event.resource_id}
            )
            db.commit()


operations_service = OperationsService()
