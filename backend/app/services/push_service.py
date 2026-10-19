"""Expo push delivery.

Pushes are queued on the database session and only sent after the surrounding commit succeeds,
so a rolled-back change never notifies anyone. Sending never raises into request handling.
"""

import json
import logging
import threading

import httpx
from sqlalchemy import event, select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.device_push_token import DevicePushToken
from app.models.web_push_subscription import WebPushSubscription

try:
    from pywebpush import WebPushException, webpush
except ImportError:  # pragma: no cover - only on an install that predates the dependency
    WebPushException = Exception  # type: ignore[assignment, misc]
    webpush = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
PENDING_KEY = "pending_pushes"
WEB_PENDING_KEY = "pending_web_pushes"


def queue_push(db: Session, *, user_id: str, title: str, body: str, data: dict | None = None) -> None:
    if not get_settings().expo_push_enabled:
        return
    db.info.setdefault(PENDING_KEY, []).append({"user_id": user_id, "title": title, "body": body, "data": data or {}})


def queue_web_push(db: Session, *, user_ids: list[str], title: str, body: str, url: str = "/", tag: str | None = None) -> None:
    """Queue a browser notification for staff dashboards. Sent after the surrounding commit, like phone pushes."""
    if not get_settings().web_push_enabled or not user_ids:
        return
    db.info.setdefault(WEB_PENDING_KEY, []).append({"user_ids": list(user_ids), "title": title, "body": body, "url": url, "tag": tag})


def _run_async(items: list[dict]) -> None:
    threading.Thread(target=deliver, args=(items,), daemon=True).start()


def _run_web_async(items: list[dict]) -> None:
    threading.Thread(target=deliver_web, args=(items,), daemon=True).start()


@event.listens_for(Session, "after_commit")
def _send_queued_pushes(session: Session) -> None:
    items = session.info.pop(PENDING_KEY, None)
    if items:
        _run_async(items)
    web_items = session.info.pop(WEB_PENDING_KEY, None)
    if web_items:
        _run_web_async(web_items)


@event.listens_for(Session, "after_rollback")
def _drop_queued_pushes(session: Session) -> None:
    session.info.pop(PENDING_KEY, None)
    session.info.pop(WEB_PENDING_KEY, None)


def deliver_web(items: list[dict]) -> None:
    try:
        settings = get_settings()
        if webpush is None:
            logger.error("Web push is enabled but the pywebpush package is not installed")
            return
        with SessionLocal() as db:
            dead: list[str] = []
            for item in items:
                subscriptions = db.scalars(
                    select(WebPushSubscription).where(WebPushSubscription.user_id.in_(item["user_ids"]), WebPushSubscription.is_active.is_(True))
                ).all()
                payload = json.dumps({"title": item["title"], "body": item["body"], "url": item["url"], "tag": item["tag"]})
                for subscription in subscriptions:
                    try:
                        webpush(
                            subscription_info={"endpoint": subscription.endpoint, "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth}},
                            data=payload,
                            vapid_private_key=settings.vapid_private_key,
                            # A fresh dict each time: the library adds the audience and expiry to it.
                            vapid_claims={"sub": settings.vapid_subject},
                            ttl=86400,
                            timeout=10,
                        )
                    except WebPushException as exc:
                        status_code = getattr(getattr(exc, "response", None), "status_code", None)
                        if status_code in (404, 410):
                            dead.append(subscription.id)  # The browser unsubscribed or the person revoked permission.
                        else:
                            logger.warning("Web push rejected (%s): %s", status_code, exc)
                    except Exception:
                        logger.warning("Web push failed", exc_info=True)
            if dead:
                db.execute(update(WebPushSubscription).where(WebPushSubscription.id.in_(dead)).values(is_active=False))
                db.commit()
    except Exception:  # Push is best effort and must never break the caller.
        logger.warning("Web push delivery failed", exc_info=True)


def deliver(items: list[dict]) -> None:
    try:
        settings = get_settings()
        with SessionLocal() as db:
            tokens_by_user: dict[str, list[DevicePushToken]] = {}
            user_ids = {item["user_id"] for item in items}
            for token in db.scalars(select(DevicePushToken).where(DevicePushToken.user_id.in_(user_ids), DevicePushToken.is_active.is_(True))):
                tokens_by_user.setdefault(token.user_id, []).append(token)
            messages, owners = [], []
            for item in items:
                for token in tokens_by_user.get(item["user_id"], []):
                    messages.append(
                        {
                            "to": token.token,
                            "title": item["title"],
                            "body": item["body"],
                            "data": item["data"],
                            "sound": "default",
                            "channelId": "orders",
                            "priority": "high",
                            # Keep trying for a day if the phone is off or out of coverage, then drop it as stale.
                            "ttl": 86400,
                        }
                    )
                    owners.append(token)
            if not messages:
                return
            headers = {"Accept": "application/json", "Content-Type": "application/json"}
            if settings.expo_push_access_token:
                headers["Authorization"] = "Bearer " + settings.expo_push_access_token
            response = httpx.post(EXPO_PUSH_URL, json=messages, headers=headers, timeout=10, follow_redirects=False)
            response.raise_for_status()
            tickets = response.json().get("data", [])
            for ticket in tickets:
                if ticket.get("status") == "error" and (ticket.get("details") or {}).get("error") != "DeviceNotRegistered":
                    # Typically a missing FCM credential or a rate limit: pushes will not reach phones until fixed.
                    logger.error("Expo rejected a push: %s %s", ticket.get("message"), ticket.get("details"))
            dead = [
                owners[index].id
                for index, ticket in enumerate(tickets)
                if index < len(owners) and ticket.get("status") == "error" and (ticket.get("details") or {}).get("error") == "DeviceNotRegistered"
            ]
            if dead:
                db.execute(update(DevicePushToken).where(DevicePushToken.id.in_(dead)).values(is_active=False))
                db.commit()
    except Exception:  # Push is best effort and must never break the caller.
        logger.warning("Push delivery failed", exc_info=True)
