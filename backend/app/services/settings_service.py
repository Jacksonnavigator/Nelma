from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.permissions import Permission, authorize
from app.models.app_setting import AppSetting
from app.models.user import User
from app.schemas.settings import PricingUpdate, PublicProductSetting, PublicSettings, SystemSettingUpdate
from app.services.audit_service import audit_service
from app.services.product_service import product_service

LEGACY_PRICE_FIELDS = {"first_purchase_price": "first_purchase", "refill_price": "refill"}


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
        product_service.seed_defaults(db, {"first_purchase": settings.first_purchase_price, "refill": settings.refill_price})

    def get_int(self, db: Session, key: str, fallback: int) -> int:
        setting = db.get(AppSetting, key)
        if setting is None:
            return fallback
        try:
            return int(setting.value)
        except ValueError:
            return fallback

    def public_settings(self, db: Session) -> PublicSettings:
        # Every product customers can order right now, keyed by the code orders use as their type.
        return PublicSettings(
            currency=get_settings().currency,
            products={
                product.code: PublicProductSetting(
                    name=product.name,
                    unit_price=product.unit_price,
                    description=product.description,
                    image_url=product.image_url,
                    sort_order=product.sort_order,
                )
                for product in product_service.list(db, active_only=True)
            },
        )

    def update_pricing(self, db: Session, actor: User, data: PricingUpdate) -> PublicSettings:
        """Older price-only endpoint for the two launch products; new clients edit products directly."""
        authorize(actor, Permission.PRICING_MANAGE)
        updates = data.model_dump(exclude_none=True)
        for field, code in LEGACY_PRICE_FIELDS.items():
            if field in updates:
                product = product_service.get_by_code(db, code)
                if product is not None:
                    product.unit_price = updates[field]
                self._set(db, "FIRST_PURCHASE_PRICE" if code == "first_purchase" else "REFILL_PRICE", str(updates[field]), True)
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


