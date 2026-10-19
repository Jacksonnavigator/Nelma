from fastapi import status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.core.permissions import Permission, authorize
from app.models.user import User
from app.models.web_push_subscription import WebPushSubscription
from app.schemas.web_push import WebPushSubscribeInput
from app.services import push_service


class WebPushSubscriptionService:
    def config(self, user: User) -> dict:
        authorize(user, Permission.ORDER_VIEW_ALL)
        settings = get_settings()
        enabled = bool(settings.web_push_enabled and settings.vapid_public_key and settings.vapid_private_key)
        # The public key is meant to be shared with browsers; the private key never leaves the server.
        return {"enabled": enabled, "publicKey": settings.vapid_public_key if enabled else None}

    def subscribe(self, db: Session, user: User, data: WebPushSubscribeInput, *, user_agent: str | None) -> None:
        authorize(user, Permission.ORDER_VIEW_ALL)
        agent = (user_agent or "")[:300] or None
        existing = db.scalar(select(WebPushSubscription).where(WebPushSubscription.endpoint == data.endpoint))
        if existing is not None:
            # The same browser signed in as someone else: the alerts follow whoever is signed in now.
            existing.user_id = user.id
            existing.p256dh = data.keys.p256dh
            existing.auth = data.keys.auth
            existing.user_agent = agent
            existing.is_active = True
        else:
            db.add(
                WebPushSubscription(user_id=user.id, endpoint=data.endpoint, p256dh=data.keys.p256dh, auth=data.keys.auth, user_agent=agent)
            )
        db.commit()

    def send_test(self, db: Session, user: User) -> None:
        """A test alert to the caller's own browsers, so they can check alerts work before a real order arrives."""
        authorize(user, Permission.ORDER_VIEW_ALL)
        if not self.config(user)["enabled"]:
            raise AppException("ALERTS_NOT_CONFIGURED", "Browser alerts are not switched on for the server yet.", status.HTTP_409_CONFLICT)
        has_browser = db.scalar(
            select(WebPushSubscription.id).where(WebPushSubscription.user_id == user.id, WebPushSubscription.is_active.is_(True)).limit(1)
        )
        if has_browser is None:
            raise AppException("NO_ALERT_BROWSER", "Turn on alerts in this browser first.", status.HTTP_409_CONFLICT)
        push_service.queue_web_push(
            db, user_ids=[user.id], title="NELMA test alert", body="Alerts are working on this browser. You will hear about new orders here.", url="/notifications", tag="test"
        )
        db.commit()  # The queued alert is only sent once this commit succeeds.

    def unsubscribe(self, db: Session, user: User, endpoint: str) -> None:
        # Only the owner can switch a subscription off, and asking about an unknown one is not an error.
        db.execute(
            update(WebPushSubscription)
            .where(WebPushSubscription.endpoint == endpoint, WebPushSubscription.user_id == user.id)
            .values(is_active=False)
        )
        db.commit()


web_push_subscription_service = WebPushSubscriptionService()
