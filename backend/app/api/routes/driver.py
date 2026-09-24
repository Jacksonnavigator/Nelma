from typing import Literal

from fastapi import APIRouter, Query

from app.api.dependencies import CurrentUser, DbSession
from app.schemas.common import Page
from app.schemas.driver import DriverSummary
from app.schemas.order import DeliveryIssueRequest, DriverStatusUpdateRequest, OrderRead
from app.services.driver_service import driver_service
from app.services.order_service import order_service

router = APIRouter(prefix="/driver", tags=["Driver Deliveries"])


@router.get("/summary", response_model=DriverSummary, summary="Delivery totals for the current DRIVER")
def delivery_summary(user: CurrentUser, db: DbSession) -> DriverSummary:
    return driver_service.summary(db, user)


@router.get(
    "/deliveries",
    response_model=list[OrderRead] | Page[OrderRead],
    summary="List deliveries assigned to the current DRIVER (scope=active | history | all)",
)
def list_deliveries(
    user: CurrentUser,
    db: DbSession,
    scope: Literal["all", "active", "history"] = "all",
    page: int = Query(1, ge=1),
    page_size: int = Query(30, ge=1, le=100),
):
    return order_service.list_assigned_to_driver(db, user, scope=scope, page=page, page_size=page_size)


@router.get("/deliveries/{order_id}", response_model=OrderRead, summary="Read a delivery assigned to the current DRIVER")
def get_delivery(order_id: str, user: CurrentUser, db: DbSession) -> OrderRead:
    return order_service.get_for_driver(db, user, order_id)


@router.patch("/deliveries/{order_id}/status", response_model=OrderRead, summary="Update an assigned delivery")
def update_delivery_status(order_id: str, data: DriverStatusUpdateRequest, user: CurrentUser, db: DbSession) -> OrderRead:
    return order_service.update_assigned_delivery_status(db, user, order_id, data.status, data)


@router.post("/deliveries/{order_id}/issue", response_model=OrderRead, summary="Report a problem with an open delivery")
def report_delivery_issue(order_id: str, data: DeliveryIssueRequest, user: CurrentUser, db: DbSession) -> OrderRead:
    return order_service.report_delivery_issue(db, user, order_id, data)


@router.post("/deliveries/{order_id}/received", response_model=OrderRead, summary="Confirm customer receipt for an assigned delivery")
def confirm_delivery_received(order_id: str, user: CurrentUser, db: DbSession) -> OrderRead:
    return order_service.confirm_received_by_driver(db, user, order_id)
