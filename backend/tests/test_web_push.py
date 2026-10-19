import json
from unittest.mock import MagicMock

import pytest
from pydantic import ValidationError
from sqlalchemy import select

from app.core.config import Settings, get_settings
from app.db.session import SessionLocal
from app.models.web_push_subscription import WebPushSubscription
from app.scripts.generate_vapid_keys import generate
from app.services import push_service
from tests.conftest import create_order, register_customer
from tests.test_dashboard_integration import staff

CHROME = "https://fcm.googleapis.com/fcm/send/dQw4w9WgXcQ:APA91bExampleExampleExample"
FIREFOX = "https://updates.push.services.mozilla.com/wpush/v2/gAAAAABexample"
KEYS = {"p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM", "auth": "tBHItJI5svbpez7KI4CCXg"}
PUBLIC, PRIVATE = generate()


def body(endpoint=CHROME):
    return {"endpoint": endpoint, "keys": KEYS}


@pytest.fixture
def push_on(monkeypatch):
    """Switch web push on, send inline instead of in a thread, and record what would have been sent."""
    cfg = get_settings()
    monkeypatch.setattr(cfg, "web_push_enabled", True)
    monkeypatch.setattr(cfg, "vapid_public_key", PUBLIC)
    monkeypatch.setattr(cfg, "vapid_private_key", PRIVATE)
    sent = MagicMock()
    monkeypatch.setattr(push_service, "webpush", sent)
    monkeypatch.setattr(push_service, "_run_web_async", push_service.deliver_web)
    return sent


def payloads(sent):
    return [json.loads(call.kwargs["data"]) for call in sent.call_args_list]


def test_config_exposes_only_the_public_key(client, monkeypatch):
    _, _, _, _, admin, _ = staff(client)
    assert client.get("/api/v1/admin/push/config", headers=admin).json() == {"enabled": False, "publicKey": None}
    cfg = get_settings()
    monkeypatch.setattr(cfg, "web_push_enabled", True)
    monkeypatch.setattr(cfg, "vapid_public_key", PUBLIC)
    monkeypatch.setattr(cfg, "vapid_private_key", PRIVATE)
    response = client.get("/api/v1/admin/push/config", headers=admin)
    assert response.json() == {"enabled": True, "publicKey": PUBLIC}
    assert PRIVATE not in response.text


def test_only_signed_in_staff_can_use_push_endpoints(client):
    _, mobile = register_customer(client)
    for path, payload in (("/api/v1/admin/push/subscriptions", body()), ("/api/v1/admin/push/subscriptions/remove", {"endpoint": CHROME})):
        assert client.post(path, json=payload).status_code == 401
        assert client.post(path, json=payload, headers=mobile).status_code in {401, 403}
    assert client.get("/api/v1/admin/push/config").status_code == 401
    assert client.get("/api/v1/admin/push/config", headers=mobile).status_code in {401, 403}


@pytest.mark.parametrize(
    "endpoint",
    [
        "http://fcm.googleapis.com/fcm/send/abcdefghijklmnop",  # not https
        "https://169.254.169.254/latest/meta-data/iam/security-credentials",  # cloud metadata address
        "https://localhost:8000/api/v1/internal/orders/x/status",
        "https://evil.example/fcm.googleapis.com/send/abcdef",  # real host only appears in the path
        "https://fcm.googleapis.com.evil.example/fcm/send/abcdef",  # real host only appears as a prefix
        "https://user:secret@fcm.googleapis.com/fcm/send/abcdef",  # credentials in the address
        "https://fcm.googleapis.com:8443/fcm/send/abcdefghijk",  # unusual port
    ],
)
def test_only_real_browser_push_services_are_accepted(client, endpoint):
    _, _, _, _, admin, _ = staff(client)
    assert client.post("/api/v1/admin/push/subscriptions", headers=admin, json=body(endpoint)).status_code == 422
    with SessionLocal() as db:
        assert db.scalar(select(WebPushSubscription)) is None


def test_subscribing_is_idempotent_and_follows_whoever_is_signed_in(client):
    _, sales_id, _, _, admin, sales = staff(client)
    assert client.post("/api/v1/admin/push/subscriptions", headers=admin, json=body()).status_code == 204
    assert client.post("/api/v1/admin/push/subscriptions", headers=admin, json=body()).status_code == 204
    assert client.post("/api/v1/admin/push/subscriptions", headers=sales, json=body(FIREFOX)).status_code == 204
    # The same browser, now signed in as the sales manager, takes the alerts over.
    assert client.post("/api/v1/admin/push/subscriptions", headers=sales, json=body()).status_code == 204
    with SessionLocal() as db:
        rows = {row.endpoint: row for row in db.scalars(select(WebPushSubscription))}
        assert len(rows) == 2
        assert rows[CHROME].user_id == sales_id and rows[CHROME].is_active


def test_only_the_owner_can_turn_a_subscription_off(client):
    _, _, _, _, admin, sales = staff(client)
    client.post("/api/v1/admin/push/subscriptions", headers=admin, json=body())
    assert client.post("/api/v1/admin/push/subscriptions/remove", headers=sales, json={"endpoint": CHROME}).status_code == 204
    with SessionLocal() as db:
        assert db.scalar(select(WebPushSubscription)).is_active is True
    assert client.post("/api/v1/admin/push/subscriptions/remove", headers=admin, json={"endpoint": CHROME}).status_code == 204
    with SessionLocal() as db:
        assert db.scalar(select(WebPushSubscription)).is_active is False


def test_a_new_order_sends_staff_a_browser_notification(client, push_on):
    _, _, _, _, admin, sales = staff(client)
    client.post("/api/v1/admin/push/subscriptions", headers=admin, json=body())
    client.post("/api/v1/admin/push/subscriptions", headers=sales, json=body(FIREFOX))
    _, customer = register_customer(client)
    order = create_order(client, customer, order_type="refill", quantity=3)

    sent = payloads(push_on)
    assert len(sent) == 2  # one per subscribed staff browser
    assert {call.kwargs["subscription_info"]["endpoint"] for call in push_on.call_args_list} == {CHROME, FIREFOX}
    first = sent[0]
    assert first["title"] == "New water order"
    assert "Jane Customer" in first["body"] and "3 items" in first["body"] and order["orderNumber"] in first["body"]
    assert first["url"] == f"/orders/{order['id']}"
    assert push_on.call_args.kwargs["vapid_private_key"] == PRIVATE
    assert push_on.call_args.kwargs["vapid_claims"]["sub"].startswith("mailto:")


def test_staff_can_send_themselves_a_test_alert(client, push_on):
    _, _, _, _, admin, sales = staff(client)
    # Nothing to send to until this browser has turned alerts on.
    assert client.post("/api/v1/admin/push/test", headers=admin).status_code == 409
    client.post("/api/v1/admin/push/subscriptions", headers=admin, json=body())
    client.post("/api/v1/admin/push/subscriptions", headers=sales, json=body(FIREFOX))
    assert client.post("/api/v1/admin/push/test", headers=admin).status_code == 204
    [sent] = payloads(push_on)  # only the caller's own browser, never a colleague's
    assert sent["title"] == "NELMA test alert"
    assert push_on.call_args.kwargs["subscription_info"]["endpoint"] == CHROME
    assert client.post("/api/v1/admin/push/test").status_code == 401


def test_test_alert_needs_the_server_to_be_set_up(client):
    _, _, _, _, admin, _ = staff(client)
    client.post("/api/v1/admin/push/subscriptions", headers=admin, json=body())
    response = client.post("/api/v1/admin/push/test", headers=admin)
    assert response.status_code == 409 and response.json()["detail"]["code"] == "ALERTS_NOT_CONFIGURED"


def test_website_requests_notify_staff_too(client, push_on):
    _, _, _, _, admin, _ = staff(client)
    client.post("/api/v1/admin/push/subscriptions", headers=admin, json=body())
    message = {"name": "Baraka", "email": "baraka@example.com", "message": "Do you deliver to Moshi?", "acceptedTerms": True}
    assert client.post("/api/v1/website/contact", json=message).status_code == 201
    [sent] = payloads(push_on)
    assert sent["title"] == "Website message" and sent["url"] == "/website-requests"


def test_nothing_is_sent_when_web_push_is_off_or_after_a_rollback(client, monkeypatch):
    _, _, _, _, admin, _ = staff(client)
    client.post("/api/v1/admin/push/subscriptions", headers=admin, json=body())
    sent = MagicMock()
    monkeypatch.setattr(push_service, "webpush", sent)
    monkeypatch.setattr(push_service, "_run_web_async", push_service.deliver_web)
    _, customer = register_customer(client)
    create_order(client, customer)
    assert sent.call_count == 0  # WEB_PUSH_ENABLED is false by default

    monkeypatch.setattr(get_settings(), "web_push_enabled", True)
    with SessionLocal() as db:
        db.execute(select(1))  # real work always happens first, which is what starts the transaction
        push_service.queue_web_push(db, user_ids=["x"], title="t", body="b")
        assert push_service.WEB_PENDING_KEY in db.info
        db.rollback()  # the change failed, so nobody must hear about it
        assert push_service.WEB_PENDING_KEY not in db.info
    assert sent.call_count == 0


def test_a_gone_subscription_is_switched_off_and_failures_do_not_break_orders(client, push_on):
    _, _, _, _, admin, sales = staff(client)
    client.post("/api/v1/admin/push/subscriptions", headers=admin, json=body())
    client.post("/api/v1/admin/push/subscriptions", headers=sales, json=body(FIREFOX))

    def flaky(**kwargs):
        if kwargs["subscription_info"]["endpoint"] == CHROME:
            raise push_service.WebPushException("gone", response=MagicMock(status_code=410))
        raise RuntimeError("push service down")

    push_on.side_effect = flaky
    _, customer = register_customer(client)
    assert create_order(client, customer)["id"]  # the order still goes through
    with SessionLocal() as db:
        rows = {row.endpoint: row.is_active for row in db.scalars(select(WebPushSubscription))}
    assert rows == {CHROME: False, FIREFOX: True}  # only the 404/410 one is retired


def test_settings_and_key_generation():
    with pytest.raises(ValidationError):
        Settings(web_push_enabled=True, vapid_public_key="", vapid_private_key="")
    with pytest.raises(ValidationError):
        Settings(web_push_enabled=True, vapid_public_key=PUBLIC, vapid_private_key=PRIVATE, vapid_subject="http://insecure.example")
    assert Settings(web_push_enabled=True, vapid_public_key=PUBLIC, vapid_private_key=PRIVATE).web_push_enabled is True
    assert "vapid_private_key" not in repr(Settings(vapid_private_key=PRIVATE))
    one, two = generate(), generate()
    assert one != two and len(one[0]) == 87 and len(one[1]) == 43
