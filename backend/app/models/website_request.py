from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.security import new_uuid
from app.db.base import Base, TimestampMixin


class WebsiteRequest(TimestampMixin, Base):
    """A message or order request sent from the public website.

    Website visitors have no account, so an order request is not an order yet: staff review it,
    contact the person and create the real order from the dashboard.
    """

    __tablename__ = "website_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    kind: Mapped[str] = mapped_column(String(16), index=True, nullable=False)  # "order" or "contact"
    status: Mapped[str] = mapped_column(String(16), index=True, nullable=False, default="new")  # "new" or "handled"
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    company: Mapped[str | None] = mapped_column(String(160), nullable=True)
    customer_type: Mapped[str | None] = mapped_column(String(16), nullable=True)  # "new" or "existing"
    city: Mapped[str | None] = mapped_column(String(80), nullable=True)
    area: Mapped[str | None] = mapped_column(String(120), nullable=True)
    product_code: Mapped[str | None] = mapped_column(String(32), nullable=True)
    product_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    handled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    handled_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
