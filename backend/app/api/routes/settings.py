from fastapi import APIRouter

from app.api.dependencies import DashboardUser, DbSession
from app.schemas.settings import PricingUpdate, PublicSettings, SystemSettingUpdate
from app.services.settings_service import settings_service

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("/public", response_model=PublicSettings, summary="Read safe public app configuration")
def public_settings(db: DbSession) -> PublicSettings:
    return settings_service.public_settings(db)


@router.patch("/pricing", response_model=PublicSettings, summary="Manage product pricing")
def update_pricing(data: PricingUpdate, user: DashboardUser, db: DbSession) -> PublicSettings:
    return settings_service.update_pricing(db, user, data)


@router.patch("/system", response_model=dict, summary="Manage system settings")
def update_system_setting(data: SystemSettingUpdate, user: DashboardUser, db: DbSession) -> dict:
    return settings_service.update_system_setting(db, user, data)
