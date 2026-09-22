from fastapi import APIRouter, Request, status

from app.api.dependencies import CurrentUser, DbSession, IdempotencyKey
from app.schemas.common import Page
from app.schemas.order import CreateOrderMessageRequest, CreateOrderRequest, OrderRead
from app.services.idempotency_service import idempotency_service
from app.services.order_service import order_service

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("", response_model=Page[OrderRead], summary="List customer orders with pagination")
def list_orders(
    user: CurrentUser,
    db: DbSession,
    page: int = 1,
    page_size: int = 20,
    status: str | None = None,
    active: bool | None = None,
    completed: bool | None = None,
) -> Page[OrderRead]:
    return order_service.list(db, user, page=page, page_size=page_size, order_status=status, active=active, completed=completed)


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED, summary="Create a water order")
def create_order(data: CreateOrderRequest, request: Request, user: CurrentUser, db: DbSession, idempotency_key: IdempotencyKey = None):
    if idempotency_key:
        replay = idempotency_service.replay(db, user, idempotency_key)
        if replay:
            return replay
    order = order_service.create(db, user, data)
    if idempotency_key:
        body = order.model_dump(by_alias=True, mode="json")
        idempotency_service.store(
            db,
            user,
            key=idempotency_key,
            method="POST",
            path=str(request.url.path),
            status_code=status.HTTP_201_CREATED,
            response_body=body,
        )
        db.commit()
    return order


@router.get("/{order_id}", response_model=OrderRead, summary="Read an order")
def get_order(order_id: str, user: CurrentUser, db: DbSession) -> OrderRead:
    return order_service.get(db, user, order_id)


@router.post("/{order_id}/cancel", response_model=OrderRead, summary="Cancel an allowed order")
def cancel_order(order_id: str, user: CurrentUser, db: DbSession) -> OrderRead:
    return order_service.cancel(db, user, order_id)


@router.post("/{order_id}/received", response_model=OrderRead, summary="Confirm a delivered order was received")
def confirm_received(order_id: str, user: CurrentUser, db: DbSession) -> OrderRead:
    return order_service.confirm_received(db, user, order_id)


@router.post("/{order_id}/messages", response_model=OrderRead, summary="Attach a customer remark or chat message to an order")
def create_message(order_id: str, data: CreateOrderMessageRequest, user: CurrentUser, db: DbSession) -> OrderRead:
    return order_service.message(db, user, order_id, data)
