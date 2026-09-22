from fastapi import APIRouter

from app.api.dependencies import DbSession, InternalAdmin
from app.schemas.order import OrderRead, OrderStatusUpdateRequest
from app.services.order_service import order_service

router = APIRouter(prefix="/internal", tags=["Internal Operations"])


@router.patch("/orders/{order_id}/status", response_model=OrderRead, summary="Update order status through an internal operations token")
def update_order_status(order_id: str, data: OrderStatusUpdateRequest, _: InternalAdmin, db: DbSession) -> OrderRead:
    return order_service.transition_internal(db, order_id, data.status)
