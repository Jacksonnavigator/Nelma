from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.permissions import Permission, authorize
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.user import User
from app.schemas.driver import DriverDay, DriverPeriodStats, DriverSummary
from app.services.dashboard_service import local_date, today

ACTIVE_STATUSES = ("pending", "confirmed", "processing", "out_for_delivery")
COMPLETED_STATUSES = ("delivered", "received")


class DriverService:
    def summary(self, db: Session, driver: User) -> DriverSummary:
        authorize(driver, Permission.DELIVERY_VIEW_ASSIGNED)
        active = db.scalar(
            select(func.count()).select_from(Order).where(Order.assigned_driver_id == driver.id, Order.status.in_(ACTIVE_STATUSES))
        )
        rows = db.execute(
            select(Order.delivered_at, Order.updated_at, Order.total, func.coalesce(func.sum(OrderItem.quantity), 0))
            .outerjoin(OrderItem, OrderItem.order_id == Order.id)
            .where(Order.assigned_driver_id == driver.id, Order.status.in_(COMPLETED_STATUSES))
            .group_by(Order.id)
        ).all()

        current = today()
        week_start = current - timedelta(days=6)
        month_start = current.replace(day=1)
        periods = {name: DriverPeriodStats() for name in ("today", "week", "month", "all_time")}
        daily = {current - timedelta(days=offset): 0 for offset in range(6, -1, -1)}

        for delivered_at, updated_at, total, bottles in rows:
            day = local_date(delivered_at or updated_at)
            if day in daily:
                daily[day] += 1
            names = ["all_time"]
            if day == current:
                names.append("today")
            if week_start <= day <= current:
                names.append("week")
            if month_start <= day <= current:
                names.append("month")
            for name in names:
                stats = periods[name]
                stats.deliveries += 1
                stats.bottles += int(bottles)
                stats.value += int(total)

        return DriverSummary(
            on_duty=driver.is_on_duty,
            active_deliveries=int(active or 0),
            daily=[DriverDay(date=day.isoformat(), deliveries=count) for day, count in daily.items()],
            **periods,
        )


driver_service = DriverService()
