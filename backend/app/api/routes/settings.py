from fastapi import APIRouter

from app.api.dependencies import DbSession
from app.schemas.settings import PublicSettings
from app.services.settings_service import settings_service

router = APIRouter(prefix="/settings", tags=["Settings"])


# Staff change prices, contacts and delivery rules through /admin/products and /admin/settings.
@router.get("/public", response_model=PublicSettings, summary="Read safe public app configuration")
def public_settings(db: DbSession) -> PublicSettings:
    return settings_service.public_settings(db)
