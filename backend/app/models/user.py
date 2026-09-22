from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.roles import Role
from app.core.security import new_uuid
from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.address import Address
    from app.models.device_push_token import DevicePushToken
    from app.models.notification import Notification
    from app.models.order import Order
    from app.models.password_reset import PasswordResetToken
    from app.models.payment import Payment
    from app.models.refresh_session import RefreshSession


def enum_values(enum_cls):
    return [item.value for item in enum_cls]


def default_notification_preferences() -> dict[str, bool]:
    return {
        "orderUpdates": True,
        "paymentUpdates": True,
        "promotions": False,
        "systemAnnouncements": True,
    }


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    phone: Mapped[str] = mapped_column(String(24), unique=True, index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(512), nullable=False)
    role: Mapped[Role] = mapped_column(
        Enum(Role, values_callable=enum_values, native_enum=False, validate_strings=True),
        default=Role.USER,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(2), default="en", nullable=False)
    address_location_preference: Mapped[str] = mapped_column(String(12), default="single", nullable=False)
    notification_preferences: Mapped[dict[str, bool]] = mapped_column(
        JSON,
        default=default_notification_preferences,
        nullable=False,
    )

    addresses: Mapped[list["Address"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    orders: Mapped[list["Order"]] = relationship(back_populates="user", cascade="all, delete-orphan", foreign_keys="Order.user_id")
    payments: Mapped[list["Payment"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    refresh_sessions: Mapped[list["RefreshSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    password_reset_tokens: Mapped[list["PasswordResetToken"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    device_push_tokens: Mapped[list["DevicePushToken"]] = relationship(back_populates="user", cascade="all, delete-orphan")
