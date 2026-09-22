from typing import Literal

from pydantic import AliasChoices, Field

from app.schemas.common import CamelModel
from app.schemas.order import OrderStatus
from app.schemas.user import AddressLocationPreference, LanguagePreference

SalesReportPeriod = Literal["daily", "monthly"]


class SalesReportMetrics(CamelModel):
    orders: int
    delivered_orders: int = Field(validation_alias=AliasChoices("deliveredOrders", "delivered_orders"))
    received_orders: int = Field(validation_alias=AliasChoices("receivedOrders", "received_orders"))
    undelivered_orders: int = Field(validation_alias=AliasChoices("undeliveredOrders", "undelivered_orders"))
    revenue: int
    delivery_fees: int = Field(validation_alias=AliasChoices("deliveryFees", "delivery_fees"))
    pending_payments: int = Field(validation_alias=AliasChoices("pendingPayments", "pending_payments"))
    new_customers: int = Field(validation_alias=AliasChoices("newCustomers", "new_customers"))


class SalesReport(CamelModel):
    period: SalesReportPeriod
    label: str
    start_date: str = Field(validation_alias=AliasChoices("startDate", "start_date"))
    end_date: str = Field(validation_alias=AliasChoices("endDate", "end_date"))
    metrics: SalesReportMetrics


class BusinessOrderQueueItem(CamelModel):
    order_id: str = Field(validation_alias=AliasChoices("orderId", "order_id"))
    order_number: str = Field(validation_alias=AliasChoices("orderNumber", "order_number"))
    customer_id: str = Field(validation_alias=AliasChoices("customerId", "customer_id"))
    customer_name: str = Field(validation_alias=AliasChoices("customerName", "customer_name"))
    phone: str
    area: str
    status: OrderStatus
    total: int
    assigned_driver_id: str | None = Field(None, validation_alias=AliasChoices("assignedDriverId", "assigned_driver_id"))
    scheduled_for: str | None = Field(None, validation_alias=AliasChoices("scheduledFor", "scheduled_for"))
    updated_at: str = Field(validation_alias=AliasChoices("updatedAt", "updated_at"))


class CustomerRecord(CamelModel):
    id: str
    full_name: str = Field(validation_alias=AliasChoices("fullName", "full_name"))
    phone: str
    email: str
    preferred_language: LanguagePreference = Field("en", validation_alias=AliasChoices("preferredLanguage", "preferred_language"))
    address_location_preference: AddressLocationPreference = Field(
        "single",
        validation_alias=AliasChoices("addressLocationPreference", "address_location_preference"),
    )
    primary_area: str | None = Field(None, validation_alias=AliasChoices("primaryArea", "primary_area"))
    total_orders: int = Field(validation_alias=AliasChoices("totalOrders", "total_orders"))
    total_spend: int = Field(validation_alias=AliasChoices("totalSpend", "total_spend"))
    last_order_at: str | None = Field(None, validation_alias=AliasChoices("lastOrderAt", "last_order_at"))
    created_at: str = Field(validation_alias=AliasChoices("createdAt", "created_at"))
    updated_at: str = Field(validation_alias=AliasChoices("updatedAt", "updated_at"))


class CustomerLookupResult(CamelModel):
    id: str
    full_name: str = Field(validation_alias=AliasChoices("fullName", "full_name"))
    phone: str
    primary_area: str | None = Field(None, validation_alias=AliasChoices("primaryArea", "primary_area"))


class BusinessDashboard(CamelModel):
    daily_report: SalesReport = Field(validation_alias=AliasChoices("dailyReport", "daily_report"))
    monthly_report: SalesReport = Field(validation_alias=AliasChoices("monthlyReport", "monthly_report"))
    undelivered_orders: list[BusinessOrderQueueItem] = Field(validation_alias=AliasChoices("undeliveredOrders", "undelivered_orders"))
    received_orders: list[BusinessOrderQueueItem] = Field(validation_alias=AliasChoices("receivedOrders", "received_orders"))
    customers: list[CustomerRecord]
