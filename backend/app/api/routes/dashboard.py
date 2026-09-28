"""Dashboard API. Mobile routes and audience checks remain unchanged."""

from datetime import date
from typing import Annotated, Literal

from fastapi import APIRouter, Query, Response
from sqlalchemy import func, or_, select
from sqlalchemy.orm import selectinload

from app.api.dependencies import DashboardUser, DbSession
from app.core.exceptions import AppException
from app.core.permissions import Permission, authorize
from app.core.roles import Role
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.models.order import Order
from app.models.user import User
from app.schemas.dashboard import (
    CashCollectionInput,
    CashHandInInput,
    DashboardOrderInput,
    DashboardSettingsPatch,
    DeliveryStatusInput,
    PriceInput,
    ProductCreateInput,
    ProductImageInput,
    ProductUpdateInput,
)
from app.schemas.order import AssignDriverRequest, CreateOrderForCustomerRequest
from app.schemas.user import AccountUpdate, DriverCreate
from app.services import dashboard_service as svc
from app.services.account_service import account_service
from app.services.notification_service import notification_service
from app.services.operations_service import operations_service
from app.services.order_service import order_service
from app.services.payment_service import payment_service
from app.services.product_service import product_service

router = APIRouter(prefix="/admin", tags=["Dashboard"])


@router.get("/dashboard")
def metrics(user: DashboardUser, db: DbSession):
    authorize(user, Permission.ORDER_VIEW_ALL)
    return svc.metrics(db)


@router.get("/activity")
def activity(user: DashboardUser, db: DbSession):
    authorize(user, Permission.ORDER_VIEW_ALL)
    query = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(10)
    if user.role != Role.SYSTEM_ADMIN:
        query = query.where(AuditLog.actor_user_id == user.id)
    return [
        {"id": e.id, "at": svc.iso(e.created_at), "title": e.event_type.replace("_", " ").capitalize(), "description": e.resource_type}
        for e in db.scalars(query)
    ]


@router.get("/orders/status-counts")
def status_counts(user: DashboardUser, db: DbSession):
    authorize(user, Permission.ORDER_VIEW_ALL)
    from collections import Counter

    return [{"status": svc.status_name(key), "count": count} for key, count in Counter(db.scalars(select(Order.status))).items()]


@router.get("/orders")
def orders(
    user: DashboardUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status: str | None = None,
    search: str | None = None,
    product: str | None = None,
    payment_method: str | None = None,
    payment_status: str | None = None,
    order_date: date | None = None,
    delivery_date: date | None = None,
):
    authorize(user, Permission.ORDER_VIEW_ALL)
    return svc.list_orders(
        db,
        page,
        page_size,
        {
            "status": status,
            "search": search,
            "product": product,
            "payment_method": payment_method,
            "payment_status": payment_status,
            "order_date": order_date.isoformat() if order_date else None,
            "delivery_date": delivery_date.isoformat() if delivery_date else None,
        },
    )


@router.get("/orders/{order_id}")
def order(order_id: str, user: DashboardUser, db: DbSession):
    authorize(user, Permission.ORDER_VIEW_ALL)
    return svc.order_dto(svc.get_order(db, order_id))


@router.post("/orders", status_code=201)
def create_order(data: DashboardOrderInput, user: DashboardUser, db: DbSession):
    authorize(user, Permission.ORDER_PLACE_FOR_CUSTOMER)
    customer = db.get(User, data.customer_id)
    if not customer or customer.role != Role.USER or not customer.is_active:
        raise AppException("CUSTOMER_NOT_FOUND", "Select an active customer.", 404)
    if data.delivery_date < svc.today():
        raise AppException("PAST_DELIVERY_DATE", "Delivery date cannot be in the past.", 422)
    config = svc.read_settings(db)
    if data.delivery_window not in config["delivery"]["defaultTimeWindows"]:
        raise AppException("INVALID_DELIVERY_WINDOW", "Choose a configured delivery window.", 422)
    location = data.delivery_location
    request = CreateOrderForCustomerRequest.model_validate(
        {
            "customerId": customer.id,
            "orderType": data.product,
            "quantity": data.quantity,
            "deliveryAddress": {
                "deliveryAddress": location.address_line,
                "area": location.area,
                "phone": location.phone or customer.phone,
                "deliveryInstructions": location.instructions,
            },
            "deliverySchedule": {
                "date": data.delivery_date.isoformat(),
                "slot": "asap",
                "label": data.delivery_window,
                "window": data.delivery_window,
            },
            "paymentMethodId": "cash",
        }
    )
    result = order_service.create_for_customer(db, user, request)
    return svc.order_dto(svc.get_order(db, result.id))


@router.post("/orders/{order_id}/confirm")
def confirm(order_id: str, user: DashboardUser, db: DbSession):
    order_service.process_status(db, user, order_id, "confirmed")
    return svc.order_dto(svc.get_order(db, order_id))


@router.post("/orders/{order_id}/process")
def process(order_id: str, user: DashboardUser, db: DbSession):
    order_service.process_status(db, user, order_id, "processing")
    return svc.order_dto(svc.get_order(db, order_id))


@router.get("/customers")
def customers(user: DashboardUser, db: DbSession, search: str = ""):
    authorize(user, Permission.ORDER_PLACE_FOR_CUSTOMER)
    query = (
        select(User).where(User.role == Role.USER, User.is_active.is_(True)).options(selectinload(User.addresses)).order_by(User.full_name)
    )
    if search.strip():
        query = query.where(
            or_(User.full_name.icontains(search.strip(), autoescape=True), User.phone.contains(search.strip(), autoescape=True))
        )
    return [svc.customer_dto(u) for u in db.scalars(query.limit(50))]


@router.get("/customers/{customer_id}")
def customer(customer_id: str, user: DashboardUser, db: DbSession):
    authorize(user, Permission.ORDER_PLACE_FOR_CUSTOMER)
    customer = db.get(User, customer_id)
    if not customer or customer.role != Role.USER:
        raise AppException("CUSTOMER_NOT_FOUND", "Customer not found.", 404)
    return svc.customer_dto(customer)


@router.get("/deliveries")
def deliveries(
    user: DashboardUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    view: str = "all",
    search: str = "",
    driver_id: str | None = None,
):
    authorize(user, Permission.DELIVERY_VIEW_ALL)
    query = svc.orders_query().order_by(Order.created_at.desc())
    if driver_id:
        query = query.where(Order.assigned_driver_id == driver_id)
    rows = [svc.delivery_dto(o) for o in db.scalars(query)]
    if view != "all":
        rows = [d for d in rows if d["status"] == view]
    if search:
        rows = [d for d in rows if search.lower() in f"{d['customerName']} {d['customerPhone']} {d['location']['area']}".lower()]
    return svc.paginate(rows, page, page_size)


@router.get("/deliveries/{delivery_id}")
def delivery(delivery_id: str, user: DashboardUser, db: DbSession):
    authorize(user, Permission.DELIVERY_VIEW_ALL)
    return svc.delivery_dto(svc.get_order(db, delivery_id))


@router.post("/deliveries/{delivery_id}/assign")
def assign(delivery_id: str, data: AssignDriverRequest, user: DashboardUser, db: DbSession):
    authorize(user, Permission.DRIVER_ASSIGN)
    order = svc.get_order(db, delivery_id)
    if order.status not in svc.ACTIVE:
        raise AppException("DELIVERY_CLOSED", "Completed or cancelled deliveries cannot be assigned.", 409)
    order_service.assign_driver(db, user, delivery_id, data.driver_id)
    return svc.delivery_dto(svc.get_order(db, delivery_id))


@router.patch("/deliveries/{delivery_id}")
def update_delivery(delivery_id: str, data: DeliveryStatusInput, user: DashboardUser, db: DbSession):
    authorize(user, Permission.DELIVERY_UPDATE)
    order_service.process_status(db, user, delivery_id, data.status)
    return svc.delivery_dto(svc.get_order(db, delivery_id))


@router.get("/drivers/available")
def available_drivers(user: DashboardUser, db: DbSession):
    authorize(user, Permission.DRIVER_MANAGE)
    return [svc.driver_dto(db, u) for u in db.scalars(select(User).where(User.role == Role.DRIVER, User.is_active.is_(True)))]


@router.get("/drivers")
def drivers(
    user: DashboardUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = "",
    status: str = "all",
):
    authorize(user, Permission.DRIVER_MANAGE)
    query = select(User).where(User.role == Role.DRIVER).order_by(User.full_name)
    if status != "all":
        query = query.where(User.is_active.is_(status == "active"))
    if search:
        query = query.where(or_(User.full_name.icontains(search, autoescape=True), User.phone.contains(search, autoescape=True)))
    return svc.paginate([svc.driver_dto(db, u) for u in db.scalars(query)], page, page_size)


@router.post("/drivers", status_code=201)
def create_driver(data: DriverCreate, user: DashboardUser, db: DbSession):
    result = account_service.create_driver(db, user, data)
    return svc.driver_dto(db, db.get(User, result.id))


@router.get("/drivers/{driver_id}")
def driver(driver_id: str, user: DashboardUser, db: DbSession):
    result = account_service.get_driver(db, user, driver_id)
    return svc.driver_dto(db, db.get(User, result.id))


@router.patch("/drivers/{driver_id}")
def edit_driver(driver_id: str, data: AccountUpdate, user: DashboardUser, db: DbSession):
    result = account_service.update_driver(db, user, driver_id, data)
    return svc.driver_dto(db, db.get(User, result.id))


@router.get("/drivers/{driver_id}/deliveries")
def driver_deliveries(driver_id: str, user: DashboardUser, db: DbSession):
    authorize(user, Permission.DELIVERY_VIEW_ALL)
    return [
        svc.delivery_dto(o)
        for o in db.scalars(svc.orders_query().where(Order.assigned_driver_id == driver_id).order_by(Order.created_at.desc()))
    ]


@router.get("/pricing")
def pricing(user: DashboardUser, db: DbSession):
    authorize(user, Permission.PRICING_MANAGE)
    return svc.prices(db)


@router.patch("/pricing/{product}")
def update_price(product: str, data: PriceInput, user: DashboardUser, db: DbSession):
    authorize(user, Permission.PRICING_MANAGE)
    target = product_service.get_by_code(db, product)
    if target is None:
        raise AppException("PRODUCT_NOT_FOUND", "Product not found.", 404)
    product_service.update(db, user, target.id, {"price": data.price})
    return next(p for p in svc.prices(db) if p["product"] == product)


@router.get("/products")
def products(user: DashboardUser, db: DbSession):
    authorize(user, Permission.PRICING_MANAGE)
    counts = product_service.order_counts(db)
    return [svc.product_dto(p, counts.get(p.code, 0)) for p in product_service.list(db)]


@router.post("/products", status_code=201)
def create_product(data: ProductCreateInput, user: DashboardUser, db: DbSession):
    return svc.product_dto(product_service.create(db, user, data.model_dump()))


@router.patch("/products/{product_id}")
def update_product(product_id: str, data: ProductUpdateInput, user: DashboardUser, db: DbSession):
    changes = data.model_dump(exclude_unset=True)
    if changes.get("image_url") == "":
        changes["image_url"] = None
    for required in ("name", "price", "is_active", "sort_order"):
        if required in changes and changes[required] is None:
            changes.pop(required)
    product = product_service.update(db, user, product_id, changes)
    return svc.product_dto(product, product_service.order_counts(db).get(product.code, 0))


@router.post("/products/{product_id}/image")
def upload_product_image(product_id: str, data: ProductImageInput, user: DashboardUser, db: DbSession):
    product = product_service.upload_image(db, user, product_id, data.content_type, data.data)
    return svc.product_dto(product, product_service.order_counts(db).get(product.code, 0))


@router.get("/users")
def users(
    user: DashboardUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    role: Literal["all", "USER", "DRIVER", "SALES_MANAGER", "SYSTEM_ADMIN"] = "all",
    status: Literal["all", "active", "inactive"] = "all",
    search: str = "",
):
    """Every account in the system (customers, drivers and staff), newest first."""
    authorize(user, Permission.ADMIN_ACCOUNT_MANAGE)
    query = select(User)
    if role != "all":
        query = query.where(User.role == Role(role))
    if status != "all":
        query = query.where(User.is_active.is_(status == "active"))
    term = search.strip()
    if term:
        query = query.where(
            or_(
                User.full_name.icontains(term, autoescape=True),
                User.phone.contains(term, autoescape=True),
                User.email.icontains(term, autoescape=True),
            )
        )
    total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = list(db.scalars(query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)))
    ids = [row.id for row in rows]
    counts = {uid: n for uid, n in db.execute(select(Order.user_id, func.count(Order.id)).where(Order.user_id.in_(ids)).group_by(Order.user_id)).all()} if ids else {}
    by_role = {key: n for key, n in db.execute(select(User.role, func.count(User.id)).group_by(User.role)).all()}
    return {
        "items": [svc.account_dto(row, counts.get(row.id, 0)) for row in rows],
        "page": page,
        "pageSize": page_size,
        "total": total,
        "roleCounts": {(key.value if hasattr(key, "value") else str(key)): value for key, value in by_role.items()},
    }


@router.get("/settings")
def settings(user: DashboardUser, db: DbSession):
    authorize(user, Permission.SYSTEM_SETTINGS_MANAGE)
    return svc.read_settings(db)


@router.patch("/settings")
def update_settings(data: DashboardSettingsPatch, user: DashboardUser, db: DbSession):
    authorize(user, Permission.SYSTEM_SETTINGS_MANAGE)
    return svc.save_settings(db, user, data)


@router.get("/order-options")
def order_options(user: DashboardUser, db: DbSession):
    authorize(user, Permission.ORDER_PLACE_FOR_CUSTOMER)
    config = svc.read_settings(db)
    return {"delivery": config["delivery"], "payments": config["payments"]}


@router.get("/reports/sales")
def sales(
    user: DashboardUser,
    db: DbSession,
    period: Literal["today", "week", "month", "custom"] = "week",
    start: Annotated[date | None, Query(alias="from")] = None,
    end: Annotated[date | None, Query(alias="to")] = None,
):
    authorize(user, Permission.SALES_REPORT_VIEW)
    if period == "custom" and (start is None or end is None):
        raise AppException("DATE_RANGE_REQUIRED", "Choose both dates for a custom report.", 422)
    return svc.report(db, period, start if period == "custom" else None, end if period == "custom" else None)


@router.get("/audit-logs")
def audit(
    user: DashboardUser,
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    actor: str = "",
    action: str = "",
    entity: str = "",
    date: date | None = None,
):
    authorize(user, Permission.AUDIT_LOG_VIEW)
    rows = [svc.audit_dto(db, e) for e in db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()))]
    rows = [
        e
        for e in rows
        if (not actor or actor.lower() in e["actor"].lower())
        and (not action or action == "all" or action.lower() in (e["action"] + " " + e["entity"]).lower())
        and (not entity or entity == "all" or entity == e["entity"])
        and (not date or e["at"][:10] == date.isoformat())
    ]
    return svc.paginate(rows, page, page_size)


@router.get("/notifications")
def notifications(user: DashboardUser, db: DbSession):
    authorize(user, Permission.NOTIFICATION_VIEW_SELF)
    rows = db.scalars(select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()))
    return [
        {
            "id": n.id,
            "kind": "payment" if "payment" in n.type else "delivery" if "deliver" in n.type else "order" if "order" in n.type else "system",
            "title": n.title,
            "body": n.message,
            "createdAt": svc.iso(n.created_at),
            "read": n.is_read,
            "audience": [user.role.value],
        }
        for n in rows
    ]


@router.post("/notifications/read-all", status_code=204)
def read_all(user: DashboardUser, db: DbSession):
    notification_service.read_all(db, user)
    return Response(status_code=204)


@router.post("/notifications/{notification_id}/read", status_code=204)
def mark_read(notification_id: str, user: DashboardUser, db: DbSession):
    notification_service.mark_read(db, user, notification_id)
    return Response(status_code=204)


@router.get("/operations")
def operations(user: DashboardUser, db: DbSession):
    return operations_service.overview(db, user)


@router.post("/operations/cash/{driver_id}/hand-in")
def cash_hand_in(driver_id: str, data: CashHandInInput, user: DashboardUser, db: DbSession):
    settled = payment_service.record_hand_in(db, user, driver_id, data.payment_ids, data.amount_received)
    return {"settled": settled}


@router.post("/operations/flags/{flag_id}/review", status_code=204)
def review_flag(flag_id: str, user: DashboardUser, db: DbSession):
    operations_service.review_flag(db, user, flag_id)
    return Response(status_code=204)


@router.post("/orders/{order_id}/collect-cash")
def collect_cash(order_id: str, data: CashCollectionInput, user: DashboardUser, db: DbSession):
    payment_service.collect_cash(db, user, order_id, data.amount)
    return svc.order_dto(svc.get_order(db, order_id))
