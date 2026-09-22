from typing import Literal

from pydantic import AliasChoices, Field

from app.schemas.common import CamelModel

PaymentStatus = Literal["pending", "processing", "paid", "failed", "cancelled", "refunded"]
PaymentMethodType = Literal["mobile_money", "cash", "other"]


class PaymentMethodRead(CamelModel):
    id: str
    type: PaymentMethodType
    label: str
    description: str
    enabled: bool
    requires_customer_action: bool = Field(validation_alias=AliasChoices("requiresCustomerAction", "requires_customer_action"))


class InitializePaymentRequest(CamelModel):
    order_id: str = Field(validation_alias=AliasChoices("orderId", "order_id"))
    method_id: str = Field(validation_alias=AliasChoices("methodId", "method_id"))


class PaymentRead(CamelModel):
    id: str
    order_id: str = Field(validation_alias=AliasChoices("orderId", "order_id"))
    amount: int
    currency: Literal["TZS"]
    method_id: str = Field(validation_alias=AliasChoices("methodId", "method_id"))
    method_label: str = Field(validation_alias=AliasChoices("methodLabel", "method_label"))
    status: PaymentStatus
    provider_reference: str | None = Field(None, validation_alias=AliasChoices("providerReference", "provider_reference"))
    failure_reason: str | None = Field(None, validation_alias=AliasChoices("failureReason", "failure_reason"))
    created_at: str = Field(validation_alias=AliasChoices("createdAt", "created_at"))
    updated_at: str = Field(validation_alias=AliasChoices("updatedAt", "updated_at"))
