from typing import Literal

from pydantic import AliasChoices, Field

from app.schemas.common import CamelModel


class PublicProductSetting(CamelModel):
    name: str
    unit_price: int
    description: str | None = None
    image_url: str | None = None
    sort_order: int = 0


class PublicSettings(CamelModel):
    currency: Literal["TZS"]
    products: dict[str, PublicProductSetting]


class PricingUpdate(CamelModel):
    first_purchase_price: int | None = Field(None, ge=1, validation_alias=AliasChoices("firstPurchasePrice", "first_purchase_price"))
    refill_price: int | None = Field(None, ge=1, validation_alias=AliasChoices("refillPrice", "refill_price"))


class SystemSettingUpdate(CamelModel):
    key: str = Field(min_length=2, max_length=120)
    value: str = Field(min_length=1, max_length=1000)
    is_public: bool = Field(False, validation_alias=AliasChoices("isPublic", "is_public"))
