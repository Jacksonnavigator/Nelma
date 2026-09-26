from datetime import timedelta

import pytest
from sqlalchemy import select

from app.core.config import get_settings
from app.core.roles import Role
from app.core.security import utc_now
from app.db.session import SessionLocal
from app.models.notification import Notification
from app.models.order import Order
from app.models.payment import Payment
from tests.conftest import create_address, create_order, register_customer
from tests.test_driver_assignment import assign, seed_status
from tests.test_role_authorization import _create_account, _dashboard_login, _mobile_login


@pytest.fixture()
def ops(client):
    _, customer = register_customer(client)
    address = create_address(client, customer)
    _create_account(Role.SYSTEM_ADMIN, "0712000002", "admin@example.com")
    _create_account(Role.SALES_MANAGER, "0712000003", "sales@example.com")
    driver_id = _create_account(Role.DRIVER, "0712000001", "driver@example.com", "Juma Driver")
    other_id = _create_account(Role.DRIVER, "0712000004", "other@example.com", "Asha Driver")
    _, admin = _dashboard_login(client, "admin@example.com")
    _, sales = _dashboard_login(client, "sales@example.com")
    _, driver = _mobile_login(client, "driver@example.com")

    def new_order(driver_to=driver_id, **overrides):
        order_id = create_order(client, customer, address=address, **overrides)["id"]
        seed_status(order_id, "pending")
        response = assign(client, "admin", admin, order_id, driver_to)
        assert response.status_code == 200, response.text
        return order_id

    def overview():
        response = client.get("/api/v1/admin/operations", headers=admin)
        assert response.status_code == 200, response.text
        return response.json()

    def status(order_id, body):
        return client.patch(f"/api/v1/driver/deliveries/{order_id}/status", headers=driver, json=body)

    return {
        "client": client,
        "admin": admin,
        "sales": sales,
        "driver": driver,
        "driver_id": driver_id,
        "other_id": other_id,
        "new_order": new_order,
        "overview": overview,
        "status": status,
    }


def _age_assignment(order_id, minutes, accepted=False):
    with SessionLocal() as db:
        order = db.get(Order, order_id)
        order.driver_assigned_at = utc_now() - timedelta(minutes=minutes)
        order.driver_accepted_at = order.driver_assigned_at if accepted else None
        db.commit()


def test_assignment_is_stamped_and_accept_is_idempotent(ops):
    client, driver = ops["client"], ops["driver"]
    order_id = ops["new_order"]()
    read = client.get(f"/api/v1/driver/deliveries/{order_id}", headers=driver).json()
    assert read["driverAssignedAt"] and read["driverAcceptedAt"] is None

    first = client.post(f"/api/v1/driver/deliveries/{order_id}/accept", headers=driver)
    assert first.status_code == 200 and first.json()["driverAcceptedAt"]
    again = client.post(f"/api/v1/driver/deliveries/{order_id}/accept", headers=driver)
    assert again.json()["driverAcceptedAt"] == first.json()["driverAcceptedAt"]


def test_starting_a_delivery_counts_as_accepting_it(ops):
    order_id = ops["new_order"]()
    started = ops["status"](order_id, {"status": "out_for_delivery"})
    assert started.status_code == 200 and started.json()["driverAcceptedAt"]


def test_decline_returns_the_stop_to_dispatch(ops):
    client, driver = ops["client"], ops["driver"]
    order_id = ops["new_order"]()
    declined = client.post(f"/api/v1/driver/deliveries/{order_id}/decline", headers=driver, json={"reason": "vehicle_problem", "note": " flat tyre "})
    assert declined.status_code == 204, declined.text
    assert client.get(f"/api/v1/driver/deliveries/{order_id}", headers=driver).status_code == 404
    delivery = client.get(f"/api/v1/admin/deliveries/{order_id}", headers=ops["admin"]).json()
    assert delivery["status"] == "unassigned" and delivery["driverId"] is None
    with SessionLocal() as db:
        assert db.scalar(select(Notification).where(Notification.type == "staff_assignment_declined"))
    flag = next(f for f in ops["overview"]()["flags"] if f["orderId"] == order_id)
    assert flag["kinds"] == ["declined"] and "Vehicle problem (flat tyre)" in flag["detail"]


def test_started_deliveries_cannot_be_declined(ops):
    order_id = ops["new_order"]()
    assert ops["status"](order_id, {"status": "out_for_delivery"}).status_code == 200
    response = ops["client"].post(f"/api/v1/driver/deliveries/{order_id}/decline", headers=ops["driver"], json={"reason": "too_far"})
    assert response.status_code == 409 and response.json()["detail"]["code"] == "DECLINE_NOT_ALLOWED"


def test_off_duty_drivers_cannot_receive_assignments(ops):
    client, driver = ops["client"], ops["driver"]
    assert client.get("/api/v1/driver/summary", headers=driver).json()["onDuty"] is True
    off = client.patch("/api/v1/driver/duty", headers=driver, json={"onDuty": False})
    assert off.status_code == 200 and off.json() == {"onDuty": False}
    assert client.get("/api/v1/driver/summary", headers=driver).json()["onDuty"] is False

    order_id = create_order(client, register_customer(client, "0713000000", "second@example.com")[1])["id"]
    refused = assign(client, "admin", ops["admin"], order_id, ops["driver_id"])
    assert refused.status_code == 409 and refused.json()["detail"]["code"] == "DRIVER_OFF_DUTY"
    drivers = client.get("/api/v1/admin/drivers/available", headers=ops["admin"]).json()
    juma = next(d for d in drivers if d["id"] == ops["driver_id"])
    assert juma["onDuty"] is False and juma["available"] is False


def test_driver_cannot_go_off_duty_mid_delivery(ops):
    order_id = ops["new_order"]()
    assert ops["status"](order_id, {"status": "out_for_delivery"}).status_code == 200
    response = ops["client"].patch("/api/v1/driver/duty", headers=ops["driver"], json={"onDuty": False})
    assert response.status_code == 409 and response.json()["detail"]["code"] == "DELIVERY_IN_PROGRESS"


def test_stalled_assignments_are_listed(ops, monkeypatch):
    monkeypatch.setattr(get_settings(), "assignment_accept_minutes", 30)
    waiting = ops["new_order"]()
    fresh = ops["new_order"]()
    idle = ops["new_order"](driver_to=ops["other_id"])
    _age_assignment(waiting, 45)
    _age_assignment(fresh, 5)
    _age_assignment(idle, 200, accepted=True)

    stalled = {row["orderId"]: row["kind"] for row in ops["overview"]()["stalled"]}
    assert stalled == {waiting: "not_accepted", idle: "not_started"}

    ops["client"].patch("/api/v1/driver/duty", headers=ops["driver"], json={"onDuty": False})
    stalled = {row["orderId"]: row["kind"] for row in ops["overview"]()["stalled"]}
    assert stalled[waiting] == stalled[fresh] == "driver_off_duty"


def test_cash_is_held_by_the_driver_until_handed_in(ops):
    client, sales = ops["client"], ops["sales"]
    order_id = ops["new_order"](paymentMethodId="cash")
    total = client.get(f"/api/v1/driver/deliveries/{order_id}", headers=ops["driver"]).json()["total"]
    assert ops["status"](order_id, {"status": "out_for_delivery"}).status_code == 200
    assert ops["status"](order_id, {"status": "delivered", "cashCollected": total}).status_code == 200

    [entry] = ops["overview"]()["cash"]
    assert entry["driverId"] == ops["driver_id"] and entry["amount"] == total
    [receipt] = entry["receipts"]
    assert receipt["orderId"] == order_id

    url = f"/api/v1/admin/operations/cash/{ops['driver_id']}/hand-in"
    body = {"paymentIds": [receipt["paymentId"]], "amountReceived": total}
    assert client.post(url, headers=ops["admin"], json=body).status_code == 403  # System admins do not handle cash.
    short = client.post(url, headers=sales, json={**body, "amountReceived": total - 500})
    assert short.status_code == 422 and short.json()["detail"]["code"] == "CASH_HAND_IN_MISMATCH"
    done = client.post(url, headers=sales, json=body)
    assert done.status_code == 200 and done.json() == {"settled": total}
    assert ops["overview"]()["cash"] == []
    again = client.post(url, headers=sales, json=body)
    assert again.status_code == 409 and again.json()["detail"]["code"] == "CASH_LEDGER_CHANGED"


def test_cash_taken_by_staff_needs_no_hand_in(ops):
    client = ops["client"]
    order_id = ops["new_order"](paymentMethodId="cash")
    assert ops["status"](order_id, {"status": "out_for_delivery"}).status_code == 200
    with SessionLocal() as db:
        db.get(Order, order_id).status = "delivered"
        db.commit()
    total = client.get(f"/api/v1/admin/orders/{order_id}", headers=ops["sales"]).json()["total"]
    assert client.post(f"/api/v1/admin/orders/{order_id}/collect-cash", headers=ops["sales"], json={"amount": total}).status_code == 200
    with SessionLocal() as db:
        payment = db.scalar(select(Payment).where(Payment.order_id == order_id, Payment.provider == "cash"))
        assert payment.handed_in_at is not None
    assert ops["overview"]()["cash"] == []


def test_skipped_proof_is_flagged_until_reviewed(ops, monkeypatch):
    monkeypatch.setattr(get_settings(), "delivery_code_required", True)
    order_id = ops["new_order"]()
    assert ops["status"](order_id, {"status": "out_for_delivery"}).status_code == 200
    assert ops["status"](order_id, {"status": "delivered", "proofSkipReason": "customer_has_no_phone"}).status_code == 200

    [flag] = ops["overview"]()["flags"]
    assert flag["kinds"] == ["proof_skipped"] and flag["driverName"] == "Juma Driver" and flag["orderNumber"]
    reviewed = ops["client"].post(f"/api/v1/admin/operations/flags/{flag['id']}/review", headers=ops["admin"])
    assert reviewed.status_code == 204
    assert ops["client"].post(f"/api/v1/admin/operations/flags/{flag['id']}/review", headers=ops["admin"]).status_code == 204
    assert ops["overview"]()["flags"] == []


def test_delivery_code_locks_after_five_wrong_tries(ops, monkeypatch):
    monkeypatch.setattr(get_settings(), "delivery_code_required", True)
    order_id = ops["new_order"]()
    assert ops["status"](order_id, {"status": "out_for_delivery"}).status_code == 200
    with SessionLocal() as db:
        from app.services.order_service import order_service

        code = order_service.delivery_code_for(db.get(Order, order_id))
    wrong = f"{(int(code) + 1) % 10_000:04d}"
    for attempt in range(5):
        response = ops["status"](order_id, {"status": "delivered", "deliveryCode": wrong})
        assert response.json()["detail"]["code"] == "INVALID_DELIVERY_CODE", attempt
    assert "No tries left" in response.json()["detail"]["message"]

    locked = ops["status"](order_id, {"status": "delivered", "deliveryCode": code})
    assert locked.status_code == 409 and locked.json()["detail"]["code"] == "DELIVERY_CODE_LOCKED"
    assert [f["kinds"] for f in ops["overview"]()["flags"]] == [["code_locked"]]
    skipped = ops["status"](order_id, {"status": "delivered", "proofSkipReason": "code_not_working"})
    assert skipped.status_code == 200


def test_location_is_shared_only_while_on_duty(ops):
    client, driver = ops["client"], ops["driver"]
    ops["new_order"]()
    assert client.post("/api/v1/driver/location", headers=driver, json={"latitude": -3.37, "longitude": 36.68}).status_code == 204

    juma = next(d for d in ops["overview"]()["drivers"] if d["driverId"] == ops["driver_id"])
    assert juma["lastLocation"]["latitude"] == -3.37 and juma["lastLocation"]["at"]
    assert juma["waiting"] == 1 and juma["onTheRoad"] == 0

    client.patch("/api/v1/driver/duty", headers=driver, json={"onDuty": False})
    assert all(d["driverId"] != ops["driver_id"] for d in ops["overview"]()["drivers"])
    assert client.post("/api/v1/driver/location", headers=driver, json={"latitude": -3.0, "longitude": 36.0}).status_code == 204
    with SessionLocal() as db:
        from app.models.user import User

        stored = db.get(User, ops["driver_id"])
        assert stored.last_latitude is None and stored.last_location_at is None


def test_location_must_be_a_real_coordinate(ops):
    response = ops["client"].post("/api/v1/driver/location", headers=ops["driver"], json={"latitude": 120, "longitude": 36})
    assert response.status_code == 422