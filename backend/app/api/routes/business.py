from fastapi import APIRouter

from app.api.dependencies import DashboardUser, DbSession
from app.schemas.business import BusinessDashboard, CustomerLookupResult
from app.schemas.order import AssignDriverRequest, CreateOrderForCustomerRequest, OrderRead, OrderStatusUpdateRequest
from app.services.business_service import business_service
from app.services.order_service import order_service

router = APIRouter(prefix="/business", tags=["Business"])


@router.get("/dashboard", response_model=BusinessDashboard, summary="Read sales reports, customer records, and delivery tracking")
def dashboard(user: DashboardUser, db: DbSession) -> BusinessDashboard:
    return business_service.dashboard(db, user)


@router.get("/customers/lookup", response_model=list[CustomerLookupResult], summary="Lookup customers for Sales Manager-created orders")
def lookup_customers(q: str, user: DashboardUser, db: DbSession) -> list[CustomerLookupResult]:
    return business_service.lookup_customers(db, user, q)


@router.post("/orders", response_model=OrderRead, status_code=201, summary="Create an order for an existing customer")
def create_order_for_customer(data: CreateOrderForCustomerRequest, user: DashboardUser, db: DbSession) -> OrderRead:
    return order_service.create_for_customer(db, user, data)


@router.get("/orders/{order_id}", response_model=OrderRead, summary="View operational order details")
def get_order(order_id: str, user: DashboardUser, db: DbSession) -> OrderRead:
    return order_service.get_for_dashboard(db, user, order_id)


@router.patch("/orders/{order_id}/status", response_model=OrderRead, summary="Process an order through the Sales Manager workflow")
def update_order_status(order_id: str, data: OrderStatusUpdateRequest, user: DashboardUser, db: DbSession) -> OrderRead:
    return order_service.process_status(db, user, order_id, data.status)


@router.patch("/orders/{order_id}/driver", response_model=OrderRead, summary="Assign a driver to an order")
def assign_driver(order_id: str, data: AssignDriverRequest, user: DashboardUser, db: DbSession) -> OrderRead:
    return order_service.assign_driver(db, user, order_id, data.driver_id)
