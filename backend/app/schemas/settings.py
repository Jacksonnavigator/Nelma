from typing import Literal

from app.schemas.common import CamelModel


class PublicProductSetting(CamelModel):
    name: str
    unit_price: int
    description: str | None = None
    image_url: str | None = None
    sort_order: int = 0


class PublicSupport(CamelModel):
    name: str
    phone: str
    email: str
    address: str
    operating_hours: str


class PublicDeliveryZone(CamelModel):
    id: str
    name: str
    fee: int
    keywords: list[str]


class PublicDelivery(CamelModel):
    time_windows: list[str]
    zones: list[PublicDeliveryZone]
    default_zone_name: str
    default_fee: int


class PublicSettings(CamelModel):
    currency: Literal["TZS"]
    products: dict[str, PublicProductSetting]
    # Optional so an app talking to an older backend still reads the response.
    support: PublicSupport | None = None
    delivery: PublicDelivery | None = None
