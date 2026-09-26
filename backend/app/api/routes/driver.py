from typing import Literal

from fastapi import APIRouter, Query, Response, status

from app.api.dependencies import CurrentUser, DbSession
from app.schemas.common import Page
from app.schemas.driver import DriverDuty, DriverLocation, DriverSummary
from app.schemas.order import DeclineAssignmentRequest, DeliveryIssueRequest, DriverStatusUpdateRequest, OrderRead
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


@router.post("/deliveries/{order_id}/accept", response_model=OrderRead, summary="Acknowledge a new assignment")
def accept_assignment(order_id: str, user: CurrentUser, db: DbSession) -> OrderRead:
    return order_service.accept_assignment(db, user, order_id)


@router.post(
    "/deliveries/{order_id}/decline",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Hand an unstarted assignment back to dispatch",
)
def decline_assignment(order_id: str, data: DeclineAssignmentRequest, user: CurrentUser, db: DbSession) -> Response:
    order_service.decline_assignment(db, user, order_id, data)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/duty", response_model=DriverDuty, summary="Go on or off duty")
def set_duty(data: DriverDuty, user: CurrentUser, db: DbSession) -> DriverDuty:
    return DriverDuty(on_duty=order_service.set_duty(db, user, data.on_duty))


@router.post("/location", status_code=status.HTTP_204_NO_CONTENT, summary="Share the driver's position while on duty")
def share_location(data: DriverLocation, user: CurrentUser, db: DbSession) -> Response:
    order_service.record_location(db, user, data.latitude, data.longitude)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/deliveries/{order_id}/received", response_model=OrderRead, summary="Confirm customer receipt for an assigned delivery")
def confirm_delivery_received(order_id: str, user: CurrentUser, db: DbSession) -> OrderRead:
    return order_service.confirm_received_by_driver(db, user, order_id)
