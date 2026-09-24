"""Expo push delivery.

Pushes are queued on the database session and only sent after the surrounding commit succeeds,
so a rolled-back change never notifies anyone. Sending never raises into request handling.
"""

import logging
import threading

import httpx
from sqlalchemy import event, select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.device_push_token import DevicePushToken

logger = logging.getLogger(__name__)

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
PENDING_KEY = "pending_pushes"


def queue_push(db: Session, *, user_id: str, title: str, body: str, data: dict | None = None) -> None:
    if not get_settings().expo_push_enabled:
        return
    db.info.setdefault(PENDING_KEY, []).append({"user_id": user_id, "title": title, "body": body, "data": data or {}})


def _run_async(items: list[dict]) -> None:
    threading.Thread(target=deliver, args=(items,), daemon=True).start()


@event.listens_for(Session, "after_commit")
def _send_queued_pushes(session: Session) -> None:
    items = session.info.pop(PENDING_KEY, None)
    if items:
        _run_async(items)


@event.listens_for(Session, "after_rollback")
def _drop_queued_pushes(session: Session) -> None:
    session.info.pop(PENDING_KEY, None)


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
