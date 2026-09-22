from datetime import date
from typing import Literal

from pydantic import ConfigDict, EmailStr, Field, field_validator, model_validator

from app.schemas.common import CamelModel


class StrictModel(CamelModel):
    model_config = CamelModel.model_config | ConfigDict(extra="forbid", str_strip_whitespace=True)


class LocationInput(StrictModel):
    label: str = Field(min_length=1, max_length=80)
    area: str = Field(min_length=2, max_length=120)
    address_line: str = Field(min_length=5, max_length=500)
    instructions: str | None = Field(None, max_length=800)
    phone: str | None = Field(None, max_length=24)


class DashboardOrderInput(StrictModel):
    customer_id: str
    product: Literal["first_purchase", "refill"]
    quantity: int = Field(ge=1)
    delivery_location: LocationInput
    delivery_date: date
    delivery_window: str = Field(min_length=1, max_length=100)
    payment_method: Literal["cash"]


class PriceInput(StrictModel):
    price: int = Field(ge=1)


class DeliveryStatusInput(StrictModel):
    status: Literal["out_for_delivery", "delivered"]


class BusinessSettings(StrictModel):
    name: str = Field(min_length=2, max_length=160)
    support_phone: str = Field(min_length=9, max_length=24)
    support_email: EmailStr
    address: str = Field(min_length=2, max_length=500)
    operating_hours: str = Field(min_length=2, max_length=160)


class PaymentSettings(StrictModel):
    cash_enabled: Literal[True] = True
    mobile_money_enabled: Literal[False] = False


class AlertSettings(StrictModel):
    new_order_alerts: bool = True
    delivery_alerts: bool = True
    payment_alerts: bool = True


class DeliverySettings(StrictModel):
    fee_rule_source: Literal["Server-defined (FastAPI)"] = "Server-defined (FastAPI)"
    default_time_windows: list[str] = Field(min_length=1, max_length=20)

    @field_validator("default_time_windows")
    @classmethod
    def windows(cls, value: list[str]) -> list[str]:
        if any(not window.strip() or len(window) > 100 for window in value):
            raise ValueError("Enter non-empty delivery windows of at most 100 characters")
        return list(dict.fromkeys(window.strip() for window in value))


class DashboardSettings(StrictModel):
    business: BusinessSettings
    payments: PaymentSettings
    notifications: AlertSettings
    delivery: DeliverySettings


class DashboardSettingsPatch(StrictModel):
    business: BusinessSettings | None = None
    payments: PaymentSettings | None = None
    notifications: AlertSettings | None = None
    delivery: DeliverySettings | None = None


class DashboardAccountUpdate(StrictModel):
    full_name: str | None = Field(None, min_length=2, max_length=160)
    phone: str | None = Field(None, min_length=9, max_length=24)
    email: EmailStr | None = None
    role: Literal["SALES_MANAGER", "SYSTEM_ADMIN"] | None = None

    @model_validator(mode="after")
    def no_null_required_fields(self):
        if any(getattr(self, key) is None for key in self.model_fields_set if key != "email"):
            raise ValueError("Name, phone and role cannot be null")
        return self


class CashCollectionInput(StrictModel):
    amount: int = Field(ge=1, strict=True)
