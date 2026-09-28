"""Dashboard DTOs over the existing customer, order and settings models."""

from collections import Counter
from datetime import timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.core.exceptions import AppException
from app.core.roles import Role
from app.core.security import ensure_aware, utc_now
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.user import User
from app.schemas.dashboard import DashboardSettingsPatch
from app.services.audit_service import audit_service
from app.services.business_settings import SETTINGS_KEY, read_settings, write_settings
from app.services.product_service import product_service
from app.services.serializers import build_order_timeline, iso

ZONE = ZoneInfo("Africa/Dar_es_Salaam")
ACTIVE = {"pending", "confirmed", "processing", "out_for_delivery"}


def today():
    return utc_now().astimezone(ZONE).date()


def local_date(value):
    return ensure_aware(value).astimezone(ZONE).date()


def status_name(value):
    return "customer_received" if value == "received" else value


def user_dto(user):
    return {
        "id": user.id,
        "fullName": user.full_name,
        "email": user.email or "",
        "phone": user.phone,
        "role": user.role.value,
        "status": "active" if user.is_active else "inactive",
    }


def location_dto(snapshot):
    return {
        "label": snapshot.get("label", "Delivery address"),
        "area": snapshot.get("area", ""),
        "addressLine": snapshot.get("full_address", snapshot.get("deliveryAddress", "")),
        "phone": snapshot.get("contact_phone", snapshot.get("phone", "")),
        "instructions": snapshot.get("delivery_instructions", snapshot.get("deliveryInstructions")) or "",
    }


def order_dto(order):
    item = order.items[0] if order.items else None
    schedule = order.delivery_schedule_snapshot or {}
    receipt = next((p for p in order.payments if p.provider == "cash" and p.status == "paid"), None)
    return {
        "id": order.id,
        "customer": {"id": order.user_id, "fullName": order.user.full_name, "phone": order.user.phone},
        "item": {
            "product": item.product_type if item else "refill",
            "productName": item.product_name if item else "",
            "quantity": sum(i.quantity for i in order.items),
            "unitPrice": item.unit_price if item else 0,
            "subtotal": order.subtotal,
        },
        "status": status_name(order.status),
        "createdAt": iso(order.created_at),
        "requestedDeliveryDate": schedule.get("date", local_date(order.created_at).isoformat()),
        "requestedDeliveryWindow": schedule.get("window", "Next available delivery"),
        "deliveryLocation": location_dto(order.delivery_address_snapshot),
        "cashReceipt": {"id": receipt.id, "amount": receipt.amount, "collectedAt": iso(receipt.paid_at)} if receipt else None,
        "paymentMethod": order.payment_method,
        "paymentStatus": "pending" if order.payment_status == "processing" else order.payment_status,
        "deliveryCharge": sum(c.get("amount", 0) for c in order.charges_snapshot or []),
        "total": order.total,
        "source": order.source,
        "createdBy": {"id": order.created_by.id, "fullName": order.created_by.full_name, "role": order.created_by.role.value}
        if order.created_by
        else None,
        "assignedDriverId": order.assigned_driver_id,
        "timeline": [{"status": status_name(e.status), "at": e.completed_at} for e in build_order_timeline(order)],
    }


def order_detail_dto(order):
    """One order with the customer's note and the conversation, for the order page."""
    return {
        **order_dto(order),
        "orderNumber": order.order_number,
        "customerRemarks": order.customer_remarks,
        "messages": [
            {
                "id": m.id,
                "sender": m.sender,
                "body": m.body,
                "createdAt": iso(m.created_at),
            }
            for m in sorted(order.messages, key=lambda m: m.created_at)
        ],
    }


def delivery_dto(order):
    dto = order_dto(order)
    state = status_name(order.status)
    if order.status in {"pending", "confirmed", "processing"}:
        state = "assigned" if order.assigned_driver_id else "unassigned"
    return {
        "id": order.id,
        "orderId": order.id,
        "orderStatus": status_name(order.status),
        "customerName": order.user.full_name,
        "customerPhone": order.user.phone,
        "location": dto["deliveryLocation"],
        "scheduledDate": dto["requestedDeliveryDate"],
        "timeWindow": dto["requestedDeliveryWindow"],
        "product": dto["item"]["product"],
        "quantity": dto["item"]["quantity"],
        "driverId": order.assigned_driver_id,
        "status": state,
    }


def orders_query():
    return select(Order).options(
        selectinload(Order.items), selectinload(Order.user), selectinload(Order.created_by), selectinload(Order.payments)
    )


def get_order(db, identifier):
    order = db.scalar(orders_query().where(Order.id == identifier))
    if not order:
        raise AppException("ORDER_NOT_FOUND", "Order not found.", 404)
    return order


def paginate(items, page, page_size):
    return {"items": items[(page - 1) * page_size : page * page_size], "page": page, "pageSize": page_size, "total": len(items)}


def list_orders(db, page, page_size, filters):
    query = orders_query()
    if filters.get("status") not in {None, "all"}:
        value = "received" if filters["status"] == "customer_received" else filters["status"]
        query = query.where(Order.status == value)
    if filters.get("product") not in {None, "all"}:
        query = query.where(Order.items.any(OrderItem.product_type == filters["product"]))
    if filters.get("payment_method") not in {None, "all"}:
        query = query.where(Order.payment_method == filters["payment_method"])
    if filters.get("payment_status") not in {None, "all"}:
        states = ["pending", "processing"] if filters["payment_status"] == "pending" else [filters["payment_status"]]
        query = query.where(Order.payment_status.in_(states))
    if filters.get("search"):
        term = filters["search"].strip()
        query = query.where(
            Order.user.has(or_(User.full_name.icontains(term, autoescape=True), User.phone.contains(term, autoescape=True)))
        )
    # Dates use the operating timezone, not the database server's timezone.
    if filters.get("order_date") or filters.get("delivery_date"):
        rows = list(db.scalars(query.order_by(Order.created_at.desc())))
        if filters.get("order_date"):
            rows = [o for o in rows if local_date(o.created_at).isoformat() == filters["order_date"]]
        if filters.get("delivery_date"):
            rows = [o for o in rows if (o.delivery_schedule_snapshot or {}).get("date") == filters["delivery_date"]]
        return paginate([order_dto(o) for o in rows], page, page_size)
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = db.scalars(query.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
    return {"items": [order_dto(o) for o in rows], "page": page, "pageSize": page_size, "total": total}


def driver_position(driver):
    if driver.last_latitude is None or driver.last_longitude is None or not driver.is_on_duty:
        return None
    return {"latitude": driver.last_latitude, "longitude": driver.last_longitude, "at": iso(driver.last_location_at)}


def driver_dto(db, driver):
    orders = list(db.scalars(select(Order).where(Order.assigned_driver_id == driver.id)))
    active = sum(o.status in ACTIVE for o in orders)
    return {
        "id": driver.id,
        "fullName": driver.full_name,
        "phone": driver.phone,
        "status": "active" if driver.is_active else "inactive",
        "todayAssigned": sum((o.delivery_schedule_snapshot or {}).get("date") == today().isoformat() for o in orders),
        "activeDeliveries": active,
        "completedDeliveries": sum(o.status in {"delivered", "received"} for o in orders),
        "available": driver.is_active and driver.is_on_duty,
        "onDuty": driver.is_on_duty,
        "lastLocation": driver_position(driver),
    }


def customer_dto(customer):
    return {
        "id": customer.id,
        "fullName": customer.full_name,
        "phone": customer.phone,
        "savedLocations": [
            {
                "id": a.id,
                "label": a.label,
                "area": a.area,
                "addressLine": a.full_address,
                "instructions": a.delivery_instructions or "",
                "phone": a.contact_phone,
            }
            for a in sorted(customer.addresses, key=lambda a: not a.is_default)
        ],
    }


def save_settings(db, actor, patch: DashboardSettingsPatch):
    # Merge field by field, so saving only the delivery windows keeps the delivery zones as they were.
    current = read_settings(db)
    for section, fields in patch.model_dump(by_alias=True, exclude_unset=True, exclude_none=True).items():
        current[section] = {**current[section], **fields}
    value = write_settings(db, current)
    audit_service.record(db, actor=actor, event_type="SYSTEM_SETTING_UPDATED", resource_type="app_settings", resource_id=SETTINGS_KEY)
    db.commit()
    return value


def prices(db):
    """Price list of orderable products, for the dashboard's order form."""
    return [
        {
            "product": p.code,
            "label": p.name,
            "price": p.unit_price,
            "currency": "TZS",
            "updatedAt": iso(p.updated_at),
            "updatedBy": "Dashboard",
        }
        for p in product_service.list(db, active_only=True)
    ]


def product_dto(product, order_count=0):
    return {
        "id": product.id,
        "code": product.code,
        "name": product.name,
        "description": product.description or "",
        "price": product.unit_price,
        "imageUrl": product.image_url,
        "isActive": product.is_active,
        "sortOrder": product.sort_order,
        "orderCount": order_count,
        "updatedAt": iso(product.updated_at),
    }


def account_dto(user, order_count=0):
    return {
        "id": user.id,
        "fullName": user.full_name,
        "phone": user.phone,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, "value") else str(user.role),
        "isActive": user.is_active,
        "orderCount": order_count,
        "createdAt": iso(user.created_at),
    }


def sales_timestamp(order):
    if order.payment_status == "paid":
        paid_at = [ensure_aware(p.paid_at) for p in order.payments if p.status == "paid" and p.paid_at]
        if paid_at:
            return max(paid_at)
    return order.created_at


def metrics(db):
    orders = list(db.scalars(select(Order).options(selectinload(Order.payments))))
    current = [o for o in orders if local_date(o.created_at) == today()]
    users = list(db.scalars(select(User).where(User.role.in_([Role.DRIVER, Role.SALES_MANAGER]))))
    return {
        "todayOrders": len(current),
        "pendingOrders": sum(o.status == "pending" for o in orders),
        "processing": sum(o.status == "processing" for o in orders),
        "outForDelivery": sum(o.status == "out_for_delivery" for o in orders),
        "completedToday": sum(o.delivered_at is not None and local_date(o.delivered_at) == today() for o in orders),
        "todaySales": sum(
            o.total for o in orders if o.payment_status == "paid" and o.status != "cancelled" and local_date(sales_timestamp(o)) == today()
        ),
        "pendingPayments": sum(o.payment_status in {"pending", "processing"} for o in orders),
        "activeDrivers": sum(u.role == Role.DRIVER and u.is_active for u in users),
        "activeSalesManagers": sum(u.role == Role.SALES_MANAGER and u.is_active for u in users),
        "pendingDeliveries": sum(o.status in ACTIVE and not o.assigned_driver_id for o in orders),
        "systemStatus": "operational",
    }


def report(db, period, start=None, end=None):
    end = end or today()
    start = start or (
        today() if period == "today" else today() - timedelta(days=today().weekday()) if period == "week" else today().replace(day=1)
    )
    if start > end or (end - start).days > 366:
        raise AppException("INVALID_DATE_RANGE", "Choose an ordered date range of at most one year.", 422)
    rows = []
    for order in db.scalars(orders_query()):
        report_at = sales_timestamp(order)
        if start <= local_date(report_at) <= end:
            rows.append({**order_dto(order), "reportAt": iso(report_at)})
    rows.sort(key=lambda row: row["reportAt"], reverse=True)
    active = [o for o in rows if o["status"] != "cancelled"]
    paid = [o for o in active if o["paymentStatus"] == "paid"]
    records = [
        {
            "orderId": o["id"],
            "date": o["reportAt"],
            "customer": o["customer"]["fullName"],
            "product": o["item"]["product"],
            "quantity": o["item"]["quantity"],
            "paymentMethod": o["paymentMethod"],
            "paymentStatus": o["paymentStatus"],
            "total": o["total"],
        }
        for o in rows
    ]
    from datetime import datetime

    trend = []
    for offset in range((end - start).days + 1):
        day = start + timedelta(days=offset)
        daily = [o for o in active if local_date(datetime.fromisoformat(o["reportAt"])) == day]
        trend.append(
            {"date": day.isoformat(), "orders": len(daily), "sales": sum(o["total"] for o in daily if o["paymentStatus"] == "paid")}
        )
    return {
        "summary": {
            "totalSales": sum(o["total"] for o in paid),
            "totalOrders": len(rows),
            "unitsSold": sum(o["item"]["quantity"] for o in active),
            "firstPurchases": sum(o["item"]["product"] == "first_purchase" for o in active),
            "refills": sum(o["item"]["product"] == "refill" for o in active),
            "completedOrders": sum(o["status"] in {"delivered", "customer_received"} for o in rows),
            "cancelledOrders": len(rows) - len(active),
            "cashPayments": sum(o["paymentMethod"] == "cash" for o in rows),
            "pendingPayments": sum(o["paymentStatus"] == "pending" for o in rows),
            "deliveryCharges": sum(o["deliveryCharge"] for o in paid),
        },
        "trend": trend,
        "records": records,
        "productMix": [
            {
                "product": p.code,
                "label": p.name,
                "orders": sum(o["item"]["product"] == p.code for o in active),
                "sales": sum(o["total"] for o in paid if o["item"]["product"] == p.code),
            }
            for p in product_service.list(db)
            if p.is_active or any(o["item"]["product"] == p.code for o in rows)
        ],
        "statusDistribution": [{"status": key, "count": value} for key, value in Counter(o["status"] for o in rows).items()],
        "paymentDistribution": [{"status": key, "count": value} for key, value in Counter(o["paymentStatus"] for o in rows).items()],
    }


def audit_dto(db, event):
    actor = db.get(User, event.actor_user_id) if event.actor_user_id else None
    return {
        "id": event.id,
        "at": iso(event.created_at),
        "actor": actor.full_name if actor else "System",
        "role": event.actor_role or "SYSTEM",
        "action": event.event_type,
        "entity": event.resource_type,
        "description": f"Cash received: {event.metadata_json.get('currency', 'TZS')} {event.metadata_json.get('amount', '')} for order {event.resource_id}"
        if event.event_type == "CASH_COLLECTED"
        else event.event_type.replace("_", " ").capitalize(),
    }
