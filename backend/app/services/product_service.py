import base64
import binascii
import re
import uuid

import httpx
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.core.http_status import HTTP_422_UNPROCESSABLE_CONTENT
from app.core.permissions import Permission, authorize
from app.models.app_setting import AppSetting
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.user import User
from app.services.audit_service import audit_service

IMAGE_TYPES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024

# The two products NELMA launched with. Their codes are baked into existing orders and older app builds.
DEFAULT_PRODUCTS = (
    {
        "code": "first_purchase",
        "name": "New bottle + 20L water",
        "description": "For your first order: a new reusable 20L bottle filled with drinking water.",
        "price_key": "FIRST_PURCHASE_PRICE",
        "sort_order": 0,
    },
    {
        "code": "refill",
        "name": "20L water refill",
        "description": "Fresh drinking water for the NELMA bottle you already have.",
        "price_key": "REFILL_PRICE",
        "sort_order": 1,
    },
)


def invalid_product() -> AppException:
    return AppException("INVALID_ORDER_TYPE", "Choose a supported NELMA product.", HTTP_422_UNPROCESSABLE_CONTENT)


class ProductService:
    def seed_defaults(self, db: Session, fallback_prices: dict[str, int]) -> None:
        """Create the launch products once, priced from the settings they used to live in."""
        for item in DEFAULT_PRODUCTS:
            if db.scalar(select(Product.id).where(Product.code == item["code"])):
                continue
            setting = db.get(AppSetting, item["price_key"])
            try:
                price = int(setting.value) if setting else fallback_prices[item["code"]]
            except ValueError:
                price = fallback_prices[item["code"]]
            db.add(Product(code=item["code"], name=item["name"], description=item["description"], unit_price=price, sort_order=item["sort_order"]))
        db.commit()

    def list(self, db: Session, active_only: bool = False) -> list[Product]:
        query = select(Product).order_by(Product.sort_order, Product.created_at)
        if active_only:
            query = query.where(Product.is_active.is_(True))
        return list(db.scalars(query))

    def get_by_code(self, db: Session, code: str) -> Product | None:
        return db.scalar(select(Product).where(Product.code == code))

    def orderable(self, db: Session, code: str) -> Product:
        product = self.get_by_code(db, code)
        if product is None or not product.is_active:
            raise invalid_product()
        return product

    def name_for(self, db: Session, code: str) -> str:
        product = self.get_by_code(db, code)
        return product.name if product else code.replace("_", " ").title()

    def order_counts(self, db: Session) -> dict[str, int]:
        rows = db.execute(select(OrderItem.product_type, func.count(OrderItem.id)).group_by(OrderItem.product_type))
        return {code: count for code, count in rows}

    def create(self, db: Session, actor: User, data: dict) -> Product:
        authorize(actor, Permission.PRICING_MANAGE)
        product = Product(
            code=self._new_code(db, data["name"]),
            name=data["name"],
            description=data.get("description"),
            unit_price=data["price"],
            image_url=data.get("image_url"),
            is_active=data.get("is_active", True),
            sort_order=data.get("sort_order") if data.get("sort_order") is not None else self._next_sort(db),
        )
        db.add(product)
        db.flush()
        audit_service.record(db, actor=actor, event_type="PRODUCT_CREATED", resource_type="product", resource_id=product.id, metadata={"code": product.code, "price": product.unit_price})
        db.commit()
        db.refresh(product)
        return product

    def update(self, db: Session, actor: User, product_id: str, data: dict) -> Product:
        authorize(actor, Permission.PRICING_MANAGE)
        product = self._get(db, product_id)
        fields = {"name": "name", "description": "description", "price": "unit_price", "image_url": "image_url", "is_active": "is_active", "sort_order": "sort_order"}
        changed = {}
        for key, column in fields.items():
            if key in data:
                setattr(product, column, data[key])
                changed[key] = data[key]
        if product.code in {"first_purchase", "refill"} and "price" in changed:
            # Keep the legacy settings in step so anything still reading them sees the same price.
            self._sync_legacy_price(db, product)
        audit_service.record(db, actor=actor, event_type="PRODUCT_UPDATED", resource_type="product", resource_id=product.id, metadata=changed)
        db.commit()
        db.refresh(product)
        return product

    def upload_image(self, db: Session, actor: User, product_id: str, content_type: str, data: str) -> Product:
        authorize(actor, Permission.PRICING_MANAGE)
        product = self._get(db, product_id)
        settings = get_settings()
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise AppException(
                "IMAGE_STORAGE_NOT_CONFIGURED",
                "Image uploads need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on the server. Paste an image link instead.",
                503,
            )
        extension = IMAGE_TYPES.get(content_type)
        if extension is None:
            raise AppException("INVALID_IMAGE", "Upload a JPG, PNG or WebP image.", HTTP_422_UNPROCESSABLE_CONTENT)
        try:
            payload = base64.b64decode(data.split(",", 1)[-1], validate=True)
        except (binascii.Error, ValueError) as exc:
            raise AppException("INVALID_IMAGE", "The image could not be read.", HTTP_422_UNPROCESSABLE_CONTENT) from exc
        if not payload or len(payload) > MAX_IMAGE_BYTES:
            raise AppException("INVALID_IMAGE", "Images must be smaller than 5 MB.", HTTP_422_UNPROCESSABLE_CONTENT)

        base = settings.supabase_url.rstrip("/")
        bucket = settings.product_image_bucket
        path = f"{product.code}/{uuid.uuid4().hex}.{extension}"
        headers = {"Authorization": f"Bearer {settings.supabase_service_role_key}", "apikey": settings.supabase_service_role_key}
        try:
            with httpx.Client(timeout=30) as client:
                response = client.post(f"{base}/storage/v1/object/{bucket}/{path}", content=payload, headers={**headers, "Content-Type": content_type})
                if response.status_code in {400, 404} and "not found" in response.text.lower():
                    # First upload ever: create the public bucket, then retry once.
                    client.post(f"{base}/storage/v1/bucket", json={"id": bucket, "name": bucket, "public": True}, headers=headers)
                    response = client.post(f"{base}/storage/v1/object/{bucket}/{path}", content=payload, headers={**headers, "Content-Type": content_type})
        except httpx.HTTPError as exc:
            raise AppException("IMAGE_UPLOAD_FAILED", "The image could not be uploaded right now. Try again.", 502) from exc
        if response.status_code >= 300:
            raise AppException("IMAGE_UPLOAD_FAILED", "The image storage rejected this upload.", 502)

        product.image_url = f"{base}/storage/v1/object/public/{bucket}/{path}"
        audit_service.record(db, actor=actor, event_type="PRODUCT_IMAGE_UPDATED", resource_type="product", resource_id=product.id)
        db.commit()
        db.refresh(product)
        return product

    def _get(self, db: Session, product_id: str) -> Product:
        product = db.get(Product, product_id)
        if product is None:
            raise AppException("PRODUCT_NOT_FOUND", "Product not found.", 404)
        return product

    def _new_code(self, db: Session, name: str) -> str:
        base = re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")[:24] or "product"
        code, suffix = base, 2
        while self.get_by_code(db, code):
            code = f"{base}_{suffix}"
            suffix += 1
        return code

    def _next_sort(self, db: Session) -> int:
        highest = db.scalar(select(func.max(Product.sort_order)))
        return (highest or 0) + 1

    def _sync_legacy_price(self, db: Session, product: Product) -> None:
        key = "FIRST_PURCHASE_PRICE" if product.code == "first_purchase" else "REFILL_PRICE"
        setting = db.get(AppSetting, key)
        if setting is None:
            db.add(AppSetting(key=key, value=str(product.unit_price), is_public=True))
        else:
            setting.value = str(product.unit_price)


product_service = ProductService()
