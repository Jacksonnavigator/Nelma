from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.permissions import Permission, authorize
from app.models.app_setting import AppSetting
from app.models.user import User
from app.schemas.settings import PricingUpdate, PublicProductSetting, PublicSettings, SystemSettingUpdate
from app.services.audit_service import audit_service

PRICE_KEYS = {
    "first_purchase": "FIRST_PURCHASE_PRICE",
    "refill": "REFILL_PRICE",
}

PRODUCT_NAMES = {
    "first_purchase": "First-Time Purchase",
    "refill": "Refill",
}


class SettingsService:
    def seed_defaults(self, db: Session) -> None:
        settings = get_settings()
        defaults = {
            "FIRST_PURCHASE_PRICE": str(settings.first_purchase_price),
            "REFILL_PRICE": str(settings.refill_price),
            "CURRENCY": settings.currency,
        }
        for key, value in defaults.items():
            setting = db.get(AppSetting, key)
            if setting is None:
                db.add(AppSetting(key=key, value=value, is_public=True))
        db.commit()

    def get_int(self, db: Session, key: str, fallback: int) -> int:
        setting = db.get(AppSetting, key)
        if setting is None:
            return fallback
        try:
            return int(setting.value)
        except ValueError:
            return fallback

    def public_settings(self, db: Session) -> PublicSettings:
        settings = get_settings()
        first_price = self.get_int(db, "FIRST_PURCHASE_PRICE", settings.first_purchase_price)
        refill_price = self.get_int(db, "REFILL_PRICE", settings.refill_price)
        return PublicSettings(
            currency=settings.currency,
            products={
                "first_purchase": PublicProductSetting(name=PRODUCT_NAMES["first_purchase"], unit_price=first_price),
                "refill": PublicProductSetting(name=PRODUCT_NAMES["refill"], unit_price=refill_price),
            },
        )

    def update_pricing(self, db: Session, actor: User, data: PricingUpdate) -> PublicSettings:
        authorize(actor, Permission.PRICING_MANAGE)
        updates = data.model_dump(exclude_none=True)
        if "first_purchase_price" in updates:
            self._set(db, "FIRST_PURCHASE_PRICE", str(updates["first_purchase_price"]), True)
        if "refill_price" in updates:
            self._set(db, "REFILL_PRICE", str(updates["refill_price"]), True)
        audit_service.record(db, actor=actor, event_type="PRICING_UPDATED", resource_type="app_settings", metadata=updates)
        db.commit()
        return self.public_settings(db)

    def update_system_setting(self, db: Session, actor: User, data: SystemSettingUpdate) -> dict[str, str | bool]:
        authorize(actor, Permission.SYSTEM_SETTINGS_MANAGE)
        setting = self._set(db, data.key, data.value, data.is_public)
        audit_service.record(db, actor=actor, event_type="SYSTEM_SETTING_UPDATED", resource_type="app_settings", resource_id=data.key)
        db.commit()
        return {"key": setting.key, "value": setting.value, "isPublic": setting.is_public}

    def _set(self, db: Session, key: str, value: str, is_public: bool) -> AppSetting:
        setting = db.get(AppSetting, key)
        if setting is None:
            setting = AppSetting(key=key, value=value, is_public=is_public)
            db.add(setting)
            db.flush()
            return setting
        setting.value = value
        setting.is_public = is_public
        return setting


settings_service = SettingsService()


