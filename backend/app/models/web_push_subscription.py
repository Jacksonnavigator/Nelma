from sqlalchemy import Boolean, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.security import new_uuid
from app.db.base import Base, TimestampMixin


class WebPushSubscription(TimestampMixin, Base):
    """One browser a staff member allowed order alerts on (the dashboard's counterpart of the phone push token)."""

    __tablename__ = "web_push_subscriptions"
    __table_args__ = (
        Index("ix_web_push_subscriptions_user_id", "user_id"),
        Index("ix_web_push_subscriptions_endpoint", "endpoint", unique=True),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    endpoint: Mapped[str] = mapped_column(String(1000), nullable=False, unique=True)
    p256dh: Mapped[str] = mapped_column(String(255), nullable=False)
    auth: Mapped[str] = mapped_column(String(255), nullable=False)
    user_agent: Mapped[str | None] = mapped_column(String(300), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
