from fastapi import APIRouter

from app.api.routes import (
    addresses,
    admin_accounts,
    audit_logs,
    auth,
    business,
    dashboard,
    driver,
    drivers,
    health,
    internal,
    notifications,
    orders,
    payments,
    settings,
    users,
    website,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(addresses.router)
api_router.include_router(orders.router)
api_router.include_router(payments.router)
api_router.include_router(notifications.router)
api_router.include_router(settings.router)
api_router.include_router(business.router)
api_router.include_router(driver.router)
api_router.include_router(drivers.router)
api_router.include_router(admin_accounts.router)
api_router.include_router(audit_logs.router)
api_router.include_router(internal.router)
api_router.include_router(health.router)
api_router.include_router(website.router)

api_router.include_router(dashboard.router)
