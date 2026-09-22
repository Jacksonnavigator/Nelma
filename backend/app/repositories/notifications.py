from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.notification import Notification


class NotificationRepository:
    def list_for_user(self, db: Session, user_id: str, *, page: int, page_size: int) -> tuple[list[Notification], int]:
        total = int(db.scalar(select(func.count()).select_from(Notification).where(Notification.user_id == user_id)) or 0)
        items = list(
            db.scalars(
                select(Notification)
                .where(Notification.user_id == user_id)
                .order_by(Notification.created_at.desc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        )
        return items, total

    def get_for_user(self, db: Session, user_id: str, notification_id: str) -> Notification | None:
        return db.scalar(select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id))

    def add(self, db: Session, notification: Notification) -> Notification:
        db.add(notification)
        db.flush()
        return notification
