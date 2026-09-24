from app.schemas.common import CamelModel


class DriverPeriodStats(CamelModel):
    deliveries: int = 0
    bottles: int = 0
    value: int = 0


class DriverSummary(CamelModel):
    active_deliveries: int
    today: DriverPeriodStats
    week: DriverPeriodStats
    month: DriverPeriodStats
    all_time: DriverPeriodStats
