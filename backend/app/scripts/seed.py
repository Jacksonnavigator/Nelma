from sqlalchemy import select

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.address import Address
from app.models.order import Order
from app.models.user import User
from app.schemas.address import AddressCreate
from app.schemas.auth import RegisterRequest
from app.schemas.order import CreateOrderRequest
from app.schemas.payment import InitializePaymentRequest
from app.services.address_service import address_service
from app.services.auth_service import auth_service
from app.services.order_service import order_service
from app.services.payment_service import payment_service
from app.services.settings_service import settings_service

DEVELOPMENT_PHONE = "+255712345678"


def main() -> None:
    settings = get_settings()
    if settings.app_env == "production":
        raise RuntimeError("Seed data is disabled in production")

    with SessionLocal() as db:
        settings_service.seed_defaults(db)
        user = db.scalar(select(User).where(User.phone == DEVELOPMENT_PHONE))
        if user is None:
            session = auth_service.register(
                db,
                RegisterRequest(
                    full_name="Development Customer",
                    phone="0712345678",
                    email="customer@example.com",
                    password="Password123",
                    confirm_password="Password123",
                ),
            )
            user = db.get(User, session.user.id)
        if user is None:
            raise RuntimeError("Development customer could not be created")

        address = db.scalar(select(Address).where(Address.user_id == user.id, Address.label == "Home"))
        if address is None:
            address_read = address_service.create(
                db,
                user,
                AddressCreate(
                    label="Home",
                    full_address="House 24, NELMA customer lane",
                    area="Sinza",
                    contact_phone="0712345678",
                    is_default=True,
                ),
            )
            address_id = address_read.id
        else:
            address_id = address.id

        existing_order = db.scalar(select(Order).where(Order.user_id == user.id))
        if existing_order is None:
            order = order_service.create(
                db,
                user,
                CreateOrderRequest(order_type="refill", quantity=1, address_id=address_id, payment_method_id="mobile_money"),
            )
            payment_service.initialize(db, user, InitializePaymentRequest(order_id=order.id, method_id="mobile_money"))

        print("Seeded local development data.")


if __name__ == "__main__":
    main()
