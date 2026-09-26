from pydantic import Field

from app.schemas.common import CamelModel


class DriverPeriodStats(CamelModel):
    deliveries: int = 0
    bottles: int = 0
    value: int = 0


class DriverDay(CamelModel):
    date: str
    deliveries: int = 0


class DriverDuty(CamelModel):
    on_duty: bool


class DriverLocation(CamelModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class DriverSummary(CamelModel):
    on_duty: bool = True
    active_deliveries: int
    today: DriverPeriodStats
    week: DriverPeriodStats
    month: DriverPeriodStats
    all_time: DriverPeriodStats
    daily: list[DriverDay] = Field(default_factory=list)
