from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.core.http_status import HTTP_422_UNPROCESSABLE_CONTENT
from app.core.permissions import Permission, authorize
from app.core.security import ensure_aware, utc_now
from app.models.order import Order
from app.models.user import User
from app.repositories.orders import OrderRepository
from app.repositories.users import UserRepository
from app.schemas.business import (
    BusinessDashboard,
    BusinessOrderQueueItem,
    CustomerLookupResult,
    CustomerRecord,
    SalesReport,
    SalesReportMetrics,
)
from app.services.serializers import iso

order_repo = OrderRepository()
user_repo = UserRepository()

ACTIVE_ORDER_STATUSES = {"pending", "confirmed", "processing", "out_for_delivery"}
DELIVERED_ORDER_STATUSES = {"delivered", "received"}


def _sum_delivery_fees(order: Order) -> int:
    return sum(int(charge.get("amount", 0)) for charge in (order.charges_snapshot or []))


def _in_range(value: datetime, start: datetime, end: datetime) -> bool:
    aware = ensure_aware(value)
    return start <= aware < end


def _metric_report(label: str, period: str, start: datetime, end: datetime, orders: list[Order], customers: list[User]) -> SalesReport:
    period_orders = [order for order in orders if _in_range(order.created_at, start, end)]
    paid_orders = [order for order in period_orders if order.payment_status == "paid" and order.status != "cancelled"]
    return SalesReport(
        period=period,
        label=label,
        start_date=start.isoformat(),
        end_date=end.isoformat(),
        metrics=SalesReportMetrics(
            orders=len(period_orders),
            delivered_orders=sum(1 for order in period_orders if order.status in DELIVERED_ORDER_STATUSES),
            received_orders=sum(1 for order in period_orders if order.status == "received" or order.customer_received_at is not None),
            undelivered_orders=sum(1 for order in period_orders if order.status in ACTIVE_ORDER_STATUSES),
            revenue=sum(order.total for order in paid_orders),
            delivery_fees=sum(_sum_delivery_fees(order) for order in paid_orders),
            pending_payments=sum(1 for order in period_orders if order.payment_status in {"pending", "processing"}),
            new_customers=sum(1 for customer in customers if _in_range(customer.created_at, start, end)),
        ),
    )


def _queue_item(order: Order) -> BusinessOrderQueueItem:
    snapshot = order.delivery_address_snapshot or {}
    schedule = order.delivery_schedule_snapshot or {}
    return BusinessOrderQueueItem(
        order_id=order.id,
        order_number=order.order_number,
        customer_id=order.user_id,
        customer_name=order.user.full_name if order.user else "NELMA Customer",
        phone=order.user.phone if order.user else str(snapshot.get("contact_phone") or snapshot.get("phone") or ""),
        area=str(snapshot.get("area") or "No area saved"),
        status=order.status,
        total=order.total,
        assigned_driver_id=order.assigned_driver_id,
        scheduled_for=str(schedule.get("label")) if schedule.get("label") else None,
        updated_at=iso(order.updated_at) or "",
    )


def _primary_area(customer: User) -> str | None:
    if not customer.addresses:
        return None
    default_address = next((address for address in customer.addresses if address.is_default), customer.addresses[0])
    return default_address.area


def _customer_record(customer: User) -> CustomerRecord:
    customer_orders = [order for order in customer.orders if order.status != "cancelled"]
    paid_orders = [order for order in customer_orders if order.payment_status == "paid"]
    last_order = max(customer.orders, key=lambda order: order.created_at, default=None)
    return CustomerRecord(
        id=customer.id,
        full_name=customer.full_name,
        phone=customer.phone,
        email=customer.email or "",
        preferred_language=customer.preferred_language or "en",
        address_location_preference=customer.address_location_preference or "single",
        primary_area=_primary_area(customer),
        total_orders=len(customer_orders),
        total_spend=sum(order.total for order in paid_orders),
        last_order_at=iso(last_order.created_at) if last_order else None,
        created_at=iso(customer.created_at) or "",
        updated_at=iso(customer.updated_at) or "",
    )


def _lookup_result(customer: User) -> CustomerLookupResult:
    return CustomerLookupResult(id=customer.id, full_name=customer.full_name, phone=customer.phone, primary_area=_primary_area(customer))


class BusinessService:
    def dashboard(self, db: Session, user: User) -> BusinessDashboard:
        authorize(user, Permission.SALES_REPORT_VIEW)
        now = utc_now()
        day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = datetime(now.year, now.month, 1, tzinfo=UTC)
        customers = user_repo.list_customers(db)
        report_orders = order_repo.list_since(db, month_start)
        recent_orders = order_repo.list_business_recent(db, limit=200)

        return BusinessDashboard(
            daily_report=_metric_report("Today", "daily", day_start, now, report_orders, customers),
            monthly_report=_metric_report("This month", "monthly", month_start, now, report_orders, customers),
            undelivered_orders=[_queue_item(order) for order in recent_orders if order.status in ACTIVE_ORDER_STATUSES][:25],
            received_orders=[_queue_item(order) for order in recent_orders if order.status == "received" or order.customer_received_at is not None][:25],
            customers=[_customer_record(customer) for customer in customers],
        )

    def lookup_customers(self, db: Session, user: User, query: str) -> list[CustomerLookupResult]:
        authorize(user, Permission.ORDER_PLACE_FOR_CUSTOMER)
        if len(query.strip()) < 2:
            raise AppException("QUERY_TOO_SHORT", "Enter at least two characters.", HTTP_422_UNPROCESSABLE_CONTENT)
        return [_lookup_result(customer) for customer in user_repo.search_customers(db, query)]


business_service = BusinessService()

