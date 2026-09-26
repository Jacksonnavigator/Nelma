from typing import Literal

from pydantic import AliasChoices, Field, field_validator, model_validator

from app.schemas.address import DeliveryAddressPayload
from app.schemas.common import CamelModel
from app.schemas.payment import PaymentRead, PaymentStatus

OrderType = Literal["first_purchase", "refill"]
OrderStatus = Literal["pending", "confirmed", "processing", "out_for_delivery", "delivered", "received", "cancelled"]
OrderAction = Literal["cancel", "reorder", "contact_support", "mark_received", "message_nelma"]
DeliverySlotId = Literal["asap", "morning", "afternoon", "evening"]
OrderMessageSender = Literal["customer", "nelma", "system"]
OrderSource = Literal["USER_MOBILE", "SALES_MANAGER_DASHBOARD"]


class OrderItemRead(CamelModel):
    product_name: str = Field(validation_alias=AliasChoices("productName", "product_name"))
    order_type: OrderType = Field(validation_alias=AliasChoices("orderType", "order_type"))
    quantity: int
    unit_price: int = Field(validation_alias=AliasChoices("unitPrice", "unit_price"))
    subtotal: int


class OrderChargeRead(CamelModel):
    id: str
    label: str
    amount: int


class DeliveryScheduleRead(CamelModel):
    date: str
    slot: DeliverySlotId
    label: str
    window: str


class OrderMessageRead(CamelModel):
    id: str
    order_id: str = Field(validation_alias=AliasChoices("orderId", "order_id"))
    sender: OrderMessageSender
    body: str
    created_at: str = Field(validation_alias=AliasChoices("createdAt", "created_at"))


class OrderTimelineEventRead(CamelModel):
    id: str
    label: str
    status: OrderStatus
    completed_at: str | None = Field(None, validation_alias=AliasChoices("completedAt", "completed_at"))


class OrderRead(CamelModel):
    id: str
    order_number: str = Field(validation_alias=AliasChoices("orderNumber", "order_number"))
    customer_id: str = Field(validation_alias=AliasChoices("customerId", "customer_id"))
    customer_name: str | None = Field(None, validation_alias=AliasChoices("customerName", "customer_name"))
    customer_phone: str | None = Field(None, validation_alias=AliasChoices("customerPhone", "customer_phone"))
    created_by_user_id: str | None = Field(None, validation_alias=AliasChoices("createdByUserId", "created_by_user_id"))
    source: OrderSource = "USER_MOBILE"
    assigned_driver_id: str | None = Field(None, validation_alias=AliasChoices("assignedDriverId", "assigned_driver_id"))
    driver_assigned_at: str | None = Field(None, validation_alias=AliasChoices("driverAssignedAt", "driver_assigned_at"))
    driver_accepted_at: str | None = Field(None, validation_alias=AliasChoices("driverAcceptedAt", "driver_accepted_at"))
    created_at: str = Field(validation_alias=AliasChoices("createdAt", "created_at"))
    updated_at: str = Field(validation_alias=AliasChoices("updatedAt", "updated_at"))
    order_type: OrderType = Field(validation_alias=AliasChoices("orderType", "order_type"))
    items: list[OrderItemRead]
    quantity: int
    delivery_address: DeliveryAddressPayload = Field(validation_alias=AliasChoices("deliveryAddress", "delivery_address"))
    delivery_schedule: DeliveryScheduleRead | None = Field(
        None,
        validation_alias=AliasChoices("deliverySchedule", "delivery_schedule"),
    )
    customer_remarks: str | None = Field(None, validation_alias=AliasChoices("customerRemarks", "customer_remarks"))
    customer_received_at: str | None = Field(None, validation_alias=AliasChoices("customerReceivedAt", "customer_received_at"))
    customer_received_by_user_id: str | None = Field(
        None,
        validation_alias=AliasChoices("customerReceivedByUserId", "customer_received_by_user_id"),
    )
    messages: list[OrderMessageRead] = Field(default_factory=list)
    subtotal: int
    charges: list[OrderChargeRead]
    total: int
    currency: Literal["TZS"]
    status: OrderStatus
    payment_status: PaymentStatus = Field(validation_alias=AliasChoices("paymentStatus", "payment_status"))
    payment_method: str = Field("", validation_alias=AliasChoices("paymentMethod", "payment_method"))
    payment: PaymentRead | None = None
    timeline: list[OrderTimelineEventRead]
    available_actions: list[OrderAction] = Field(validation_alias=AliasChoices("availableActions", "available_actions"))


class CreateOrderRequest(CamelModel):
    order_type: OrderType = Field(validation_alias=AliasChoices("orderType", "order_type"))
    quantity: int = Field(ge=1)
    delivery_address: DeliveryAddressPayload | None = Field(
        None,
        validation_alias=AliasChoices("deliveryAddress", "delivery_address"),
    )
    address_id: str | None = Field(None, validation_alias=AliasChoices("addressId", "address_id"))
    delivery_schedule: DeliveryScheduleRead | None = Field(
        None,
        validation_alias=AliasChoices("deliverySchedule", "delivery_schedule"),
    )
    customer_remarks: str | None = Field(None, max_length=1200, validation_alias=AliasChoices("customerRemarks", "customer_remarks"))
    charges: list[OrderChargeRead] = Field(default_factory=list)
    payment_method_id: str = Field(
        min_length=2,
        max_length=40,
        validation_alias=AliasChoices("paymentMethodId", "payment_method_id", "paymentMethod", "payment_method"),
    )

    @field_validator("customer_remarks", mode="before")
    @classmethod
    def empty_remarks_to_none(cls, value: object) -> object:
        if value == "":
            return None
        return value

    @model_validator(mode="after")
    def has_address_source(self) -> "CreateOrderRequest":
        if not self.delivery_address and not self.address_id:
            raise ValueError("Provide deliveryAddress or addressId")
        return self


class CreateOrderForCustomerRequest(CreateOrderRequest):
    customer_id: str = Field(validation_alias=AliasChoices("customerId", "customer_id"))


class AssignDriverRequest(CamelModel):
    driver_id: str = Field(validation_alias=AliasChoices("driverId", "driver_id"))


class CreateOrderMessageRequest(CamelModel):
    body: str = Field(min_length=1, max_length=1200)

    @field_validator("body")
    @classmethod
    def body_has_text(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Message cannot be empty")
        return trimmed


class OrderStatusUpdateRequest(CamelModel):
    status: OrderStatus


ProofSkipReason = Literal["customer_has_no_phone", "code_not_working"]
DeliveryIssueReason = Literal["customer_unreachable", "wrong_address", "customer_refused", "started_by_mistake", "other"]


class DriverStatusUpdateRequest(CamelModel):
    """Driver progress update. Handover details are only read when status is `delivered`."""

    status: OrderStatus
    cash_collected: int | None = Field(None, ge=0, le=100_000_000)
    delivery_code: str | None = Field(None, pattern=r"^\d{4}$")
    proof_skip_reason: ProofSkipReason | None = None
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)


class DeliveryIssueRequest(CamelModel):
    reason: DeliveryIssueReason
    note: str | None = Field(None, max_length=500)

    @field_validator("note", mode="before")
    @classmethod
    def blank_note_to_none(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip() or None
        return value


DeclineReason = Literal["vehicle_problem", "too_far", "not_enough_stock", "ending_shift", "other"]


class DeclineAssignmentRequest(CamelModel):
    reason: DeclineReason
    note: str | None = Field(None, max_length=500)

    @field_validator("note", mode="before")
    @classmethod
    def blank_note_to_none(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip() or None
        return value


class DeliveryCodeRead(CamelModel):
    code: str
