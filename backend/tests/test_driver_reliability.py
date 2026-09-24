from datetime import timedelta

import pytest
from sqlalchemy import select

from app.core.config import get_settings
from app.core.roles import Role
from app.core.security import utc_now
from app.db.session import SessionLocal
from app.models.audit_log import AuditLog
from app.models.device_push_token import DevicePushToken
from app.models.notification import Notification
from app.models.order import Order
from app.services import push_service
from tests.conftest import create_address, create_order, register_customer
from tests.test_driver_assignment import assign, seed_status
from tests.test_role_authorization import _create_account, _dashboard_login, _mobile_login


@pytest.fixture()
def world(client):
    _, customer = register_customer(client)
    address = create_address(client, customer)
    _create_account(Role.SYSTEM_ADMIN, "0712000002", "admin@example.com")
    driver_id = _create_account(Role.DRIVER, "0712000001", "driver@example.com")
    _, admin = _dashboard_login(client, "admin@example.com")
    _, driver = _mobile_login(client, "driver@example.com")

    def new_order(**overrides):
        order_id = create_order(client, customer, address=address, **overrides)["id"]
        seed_status(order_id, "pending")
        assert assign(client, "admin", admin, order_id, driver_id).status_code == 200
        return order_id

    def status(order_id, body):
        return client.patch(f"/api/v1/driver/deliveries/{order_id}/status", headers=driver, json=body)

    return {"client": client, "customer": customer, "admin": admin, "driver": driver, "driver_id": driver_id, "new_order": new_order, "status": status}


def notification_types(user_type_filter=None):
    with SessionLocal() as db:
        return [n.type for n in db.scalars(select(Notification).order_by(Notification.created_at))]


def test_status_updates_are_idempotent_after_a_lost_response(world):
    order_id = world["new_order"]()
    before = len(notification_types())
    assert world["status"](order_id, {"status": "out_for_delivery"}).status_code == 200
    after_first = len(notification_types())
    retry = world["status"](order_id, {"status": "out_for_delivery"})
    assert retry.status_code == 200 and retry.json()["status"] == "out_for_delivery"
    assert len(notification_types()) == after_first > before
    assert world["status"](order_id, {"status": "delivered"}).status_code == 200
    delivered_notifications = len(notification_types())
    assert world["status"](order_id, {"status": "delivered"}).status_code == 200
    assert len(notification_types()) == delivered_notifications


def test_driver_must_confirm_cash_and_it_is_recorded(world):
    order_id = world["new_order"](paymentMethodId="cash")
    total = world["client"].get(f"/api/v1/driver/deliveries/{order_id}", headers=world["driver"]).json()["total"]
    assert world["status"](order_id, {"status": "out_for_delivery"}).status_code == 200

    missing = world["status"](order_id, {"status": "delivered"})
    assert missing.status_code == 422 and missing.json()["detail"]["code"] == "CASH_CONFIRMATION_REQUIRED"
    short = world["status"](order_id, {"status": "delivered", "cashCollected": total - 1})
    assert short.status_code == 422 and short.json()["detail"]["code"] == "CASH_AMOUNT_MISMATCH"
    assert world["client"].get(f"/api/v1/driver/deliveries/{order_id}", headers=world["driver"]).json()["status"] == "out_for_delivery"

    done = world["status"](order_id, {"status": "delivered", "cashCollected": total})
    assert done.status_code == 200, done.text
    assert done.json()["status"] == "delivered" and done.json()["paymentStatus"] == "paid"
    assert done.json()["paymentMethod"] == "cash"
    retry = world["status"](order_id, {"status": "delivered", "cashCollected": total})
    assert retry.status_code == 200 and retry.json()["paymentStatus"] == "paid"
    with SessionLocal() as db:
        events = [a.event_type for a in db.scalars(select(AuditLog).where(AuditLog.resource_id == order_id))]
    assert events.count("CASH_COLLECTED") == 1


def test_non_cash_orders_do_not_ask_for_cash(world):
    order_id = world["new_order"]()
    assert world["status"](order_id, {"status": "out_for_delivery"}).status_code == 200
    assert world["status"](order_id, {"status": "delivered"}).status_code == 200


def test_delivery_code_is_required_and_only_the_owner_can_read_it(world, monkeypatch):
    monkeypatch.setattr(get_settings(), "delivery_code_required", True)
    client = world["client"]
    order_id = world["new_order"]()
    assert client.get(f"/api/v1/orders/{order_id}/delivery-code", headers=world["customer"]).status_code == 409
    assert world["status"](order_id, {"status": "out_for_delivery"}).status_code == 200

    code = client.get(f"/api/v1/orders/{order_id}/delivery-code", headers=world["customer"]).json()["code"]
    assert len(code) == 4 and code.isdigit()
    assert client.get(f"/api/v1/orders/{order_id}/delivery-code", headers=world["driver"]).status_code in {403, 404}
    _, other = register_customer(client, phone="0713000009", email="other.customer@example.com") if "phone" in register_customer.__code__.co_varnames else (None, None)
    if other:
        assert client.get(f"/api/v1/orders/{order_id}/delivery-code", headers=other).status_code == 404

    required = world["status"](order_id, {"status": "delivered"})
    assert required.status_code == 422 and required.json()["detail"]["code"] == "DELIVERY_CODE_REQUIRED"
    wrong_code = "0000" if code != "0000" else "1111"
    wrong = world["status"](order_id, {"status": "delivered", "deliveryCode": wrong_code})
    assert wrong.status_code == 400 and wrong.json()["detail"]["code"] == "INVALID_DELIVERY_CODE"
    ok = world["status"](order_id, {"status": "delivered", "deliveryCode": code})
    assert ok.status_code == 200 and ok.json()["status"] == "delivered"
    with SessionLocal() as db:
        handover = db.scalar(select(AuditLog).where(AuditLog.resource_id == order_id, AuditLog.event_type == "DELIVERY_HANDOVER_RECORDED"))
    assert handover.metadata_json["proof"] == "code"


def test_proof_can_be_skipped_with_a_reason_and_location_is_checked_softly(world, monkeypatch):
    monkeypatch.setattr(get_settings(), "delivery_code_required", True)
    order_id = world["new_order"]()
    world["status"](order_id, {"status": "out_for_delivery"})
    body = {"status": "delivered", "proofSkipReason": "customer_has_no_phone", "latitude": 0.0, "longitude": 0.0}
    assert world["status"](order_id, body).status_code == 200
    with SessionLocal() as db:
        handover = db.scalar(select(AuditLog).where(AuditLog.resource_id == order_id, AuditLog.event_type == "DELIVERY_HANDOVER_RECORDED"))
    assert handover.metadata_json["proof"] == "skipped" and handover.metadata_json["skipReason"] == "customer_has_no_phone"


def test_reporting_a_problem_returns_the_order_to_dispatch(world):
    client = world["client"]
    order_id = world["new_order"]()
    world["status"](order_id, {"status": "out_for_delivery"})
    response = client.post(f"/api/v1/driver/deliveries/{order_id}/issue", headers=world["driver"], json={"reason": "customer_unreachable", "note": "Phone is off"})
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "processing"
    assert any("Customer not answering" in m["body"] and "Phone is off" in m["body"] for m in response.json()["messages"])
    types = notification_types()
    assert "order_delivery_issue" in types and "staff_delivery_issue" in types
    with SessionLocal() as db:
        assert db.get(Order, order_id).assigned_driver_id == world["driver_id"]
    # The driver can start again once the customer picks up.
    assert world["status"](order_id, {"status": "out_for_delivery"}).status_code == 200


def test_starting_by_mistake_can_be_undone_quietly(world):
    client = world["client"]
    order_id = world["new_order"]()
    assert client.post(f"/api/v1/driver/deliveries/{order_id}/issue", headers=world["driver"], json={"reason": "started_by_mistake"}).status_code == 409
    world["status"](order_id, {"status": "out_for_delivery"})
    before = notification_types().count("order_delivery_issue")
    response = client.post(f"/api/v1/driver/deliveries/{order_id}/issue", headers=world["driver"], json={"reason": "started_by_mistake"})
    assert response.status_code == 200 and response.json()["status"] == "processing" and response.json()["messages"] == []
    assert notification_types().count("order_delivery_issue") == before


def test_problems_cannot_be_reported_on_closed_deliveries(world):
    order_id = world["new_order"]()
    world["status"](order_id, {"status": "out_for_delivery"})
    world["status"](order_id, {"status": "delivered"})
    response = world["client"].post(f"/api/v1/driver/deliveries/{order_id}/issue", headers=world["driver"], json={"reason": "other"})
    assert response.status_code == 409


def test_driver_list_scopes_and_pagination(world):
    client = world["client"]
    done = [world["new_order"]() for _ in range(3)]
    active = world["new_order"]()
    for order_id in done:
        world["status"](order_id, {"status": "out_for_delivery"})
        world["status"](order_id, {"status": "delivered"})

    everything = client.get("/api/v1/driver/deliveries", headers=world["driver"]).json()
    assert isinstance(everything, list) and len(everything) == 4
    open_orders = client.get("/api/v1/driver/deliveries?scope=active", headers=world["driver"]).json()
    assert [o["id"] for o in open_orders] == [active]
    first = client.get("/api/v1/driver/deliveries?scope=history&page=1&page_size=2", headers=world["driver"]).json()
    second = client.get("/api/v1/driver/deliveries?scope=history&page=2&page_size=2", headers=world["driver"]).json()
    assert first["total"] == 3 and first["hasNext"] is True and len(first["items"]) == 2
    assert second["hasNext"] is False and len(second["items"]) == 1
    assert {o["id"] for o in first["items"] + second["items"]} == set(done)


def test_deliveries_the_customer_never_confirms_are_closed_automatically(world):
    order_id = world["new_order"]()
    world["status"](order_id, {"status": "out_for_delivery"})
    world["status"](order_id, {"status": "delivered"})
    with SessionLocal() as db:
        db.get(Order, order_id).delivered_at = utc_now() - timedelta(hours=get_settings().auto_receive_hours + 1)
        db.commit()
    history = world["client"].get("/api/v1/driver/deliveries?scope=history", headers=world["driver"]).json()
    assert history["items"][0]["status"] == "received" and history["items"][0]["customerReceivedAt"]
    with SessionLocal() as db:
        assert db.scalar(select(AuditLog).where(AuditLog.resource_id == order_id, AuditLog.event_type == "ORDER_AUTO_RECEIVED"))


def test_summary_includes_a_seven_day_series(world):
    order_id = world["new_order"]()
    world["status"](order_id, {"status": "out_for_delivery"})
    world["status"](order_id, {"status": "delivered"})
    summary = world["client"].get("/api/v1/driver/summary", headers=world["driver"]).json()
    assert len(summary["daily"]) == 7 and summary["daily"][-1]["deliveries"] == 1
    assert sum(day["deliveries"] for day in summary["daily"]) == 1


def test_pushes_are_sent_after_commit_and_dropped_on_rollback(world, monkeypatch):
    monkeypatch.setattr(get_settings(), "expo_push_enabled", True)
    sent = []
    monkeypatch.setattr(push_service, "_run_async", lambda items: sent.append(items))
    with SessionLocal() as db:
        db.execute(select(1))  # A rollback only fires the hook when a transaction is open, as in real requests.
        push_service.queue_push(db, user_id=world["driver_id"], title="A", body="b")
        db.rollback()
        assert not db.info.get(push_service.PENDING_KEY)
    assert sent == []

    _create_account(Role.SYSTEM_ADMIN, "0712000004", "second.admin@example.com")
    order_id = create_order(world["client"], world["customer"], address=create_address(world["client"], world["customer"]))["id"]
    seed_status(order_id, "pending")
    assert assign(world["client"], "admin", world["admin"], order_id, world["driver_id"]).status_code == 200
    flat = [item for batch in sent for item in batch]
    assert any(item["user_id"] == world["driver_id"] and item["data"]["type"] == "driver_delivery_assigned" and item["data"]["orderId"] == order_id for item in flat)


def test_push_delivery_posts_to_expo_and_retires_dead_tokens(world, monkeypatch):
    with SessionLocal() as db:
        db.add_all([
            DevicePushToken(user_id=world["driver_id"], token="ExponentPushToken[live]", platform="android", is_active=True),
            DevicePushToken(user_id=world["driver_id"], token="ExponentPushToken[dead]", platform="android", is_active=True),
        ])
        db.commit()
    calls = []

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"data": [{"status": "ok"}, {"status": "error", "details": {"error": "DeviceNotRegistered"}}]}

    monkeypatch.setattr(push_service.httpx, "post", lambda url, json, **kwargs: calls.append((url, json)) or FakeResponse())
    push_service.deliver([{"user_id": world["driver_id"], "title": "Delivery assigned", "body": "x", "data": {"orderId": "o1"}}])
    assert calls and calls[0][0] == push_service.EXPO_PUSH_URL
    assert {message["to"] for message in calls[0][1]} == {"ExponentPushToken[live]", "ExponentPushToken[dead]"}
    with SessionLocal() as db:
        active = {t.token: t.is_active for t in db.scalars(select(DevicePushToken))}
    assert active == {"ExponentPushToken[live]": True, "ExponentPushToken[dead]": False}
