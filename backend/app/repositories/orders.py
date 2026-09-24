from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order


class OrderRepository:
    def _options(self):
        return (
            selectinload(Order.items),
            selectinload(Order.messages),
            selectinload(Order.payments),
            selectinload(Order.user),
            selectinload(Order.assigned_driver),
        )

    def list_for_user(
        self,
        db: Session,
        user_id: str,
        *,
        page: int,
        page_size: int,
        status: str | None = None,
        active: bool | None = None,
        completed: bool | None = None,
    ) -> tuple[list[Order], int]:
        query = select(Order).where(Order.user_id == user_id)
        count_query = select(func.count()).select_from(Order).where(Order.user_id == user_id)
        if status:
            query = query.where(Order.status == status)
            count_query = count_query.where(Order.status == status)
        if active is True:
            active_statuses = ["pending", "confirmed", "processing", "out_for_delivery"]
            query = query.where(Order.status.in_(active_statuses))
            count_query = count_query.where(Order.status.in_(active_statuses))
        if completed is True:
            completed_statuses = ["delivered", "received"]
            query = query.where(Order.status.in_(completed_statuses))
            count_query = count_query.where(Order.status.in_(completed_statuses))
        total = int(db.scalar(count_query) or 0)
        items = list(
            db.scalars(
                query.options(*self._options())
                .order_by(Order.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        return items, total

    def list_for_driver(self, db: Session, driver_id: str, *, limit: int = 100) -> list[Order]:
        return list(
            db.scalars(
                select(Order)
                .where(Order.assigned_driver_id == driver_id)
                .options(*self._options())
                .order_by(Order.updated_at.desc())
                .limit(limit)
            )
        )

    def list_for_driver_statuses(
        self, db: Session, driver_id: str, statuses: tuple[str, ...], *, page: int | None = None, page_size: int = 30, limit: int = 200
    ) -> tuple[list[Order], int]:
        condition = (Order.assigned_driver_id == driver_id, Order.status.in_(statuses))
        total = db.scalar(select(func.count()).select_from(Order).where(*condition)) or 0
        query = select(Order).where(*condition).options(*self._options()).order_by(Order.updated_at.desc())
        query = query.limit(page_size).offset((page - 1) * page_size) if page is not None else query.limit(limit)
        return list(db.scalars(query)), total

    def list_stale_delivered(self, db: Session, cutoff, *, driver_id: str | None = None, user_id: str | None = None) -> list[Order]:
        query = select(Order).where(Order.status == "delivered", Order.delivered_at.is_not(None), Order.delivered_at < cutoff)
        if driver_id:
            query = query.where(Order.assigned_driver_id == driver_id)
        if user_id:
            query = query.where(Order.user_id == user_id)
        return list(db.scalars(query.limit(50)))

    def get_for_user(self, db: Session, user_id: str, order_id: str) -> Order | None:
        return db.scalar(select(Order).where(Order.id == order_id, Order.user_id == user_id).options(*self._options()))

    def get_for_driver(self, db: Session, driver_id: str, order_id: str) -> Order | None:
        return db.scalar(select(Order).where(Order.id == order_id, Order.assigned_driver_id == driver_id).options(*self._options()))

    def get_by_id(self, db: Session, order_id: str) -> Order | None:
        return db.scalar(select(Order).where(Order.id == order_id).options(*self._options()))

    def get_by_number(self, db: Session, order_number: str) -> Order | None:
        return db.scalar(select(Order).where(Order.order_number == order_number))

    def list_business_recent(self, db: Session, *, limit: int = 200) -> list[Order]:
        return list(db.scalars(select(Order).options(*self._options()).order_by(Order.updated_at.desc()).limit(limit)))

    def list_since(self, db: Session, since) -> list[Order]:
        return list(db.scalars(select(Order).where(Order.created_at >= since).options(*self._options()).order_by(Order.created_at.desc())))

    def add(self, db: Session, order: Order) -> Order:
        db.add(order)
        db.flush()
        return order

