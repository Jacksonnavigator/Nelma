from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.app_setting import AppSetting
from app.schemas.settings import (
    PublicDelivery,
    PublicDeliveryZone,
    PublicProductSetting,
    PublicSettings,
    PublicSupport,
)
from app.services.business_settings import read_settings
from app.services.product_service import product_service


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
        # Every product customers can order right now, keyed by the code orders use as their type,
        # plus the contacts and delivery rules staff set on the dashboard.
        config = read_settings(db)
        business, delivery = config["business"], config["delivery"]
        return PublicSettings(
            currency=get_settings().currency,
            support=PublicSupport(
                name=business["name"],
                phone=business["supportPhone"],
                email=business["supportEmail"],
                address=business["address"],
                operating_hours=business["operatingHours"],
            ),
            delivery=PublicDelivery(
                time_windows=delivery["defaultTimeWindows"],
                zones=[PublicDeliveryZone(**zone) for zone in delivery["zones"]],
                default_zone_name=delivery["defaultZoneName"],
                default_fee=delivery["defaultFee"],
            ),
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


