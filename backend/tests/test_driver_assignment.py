import pytest
from sqlalchemy import select

from app.core.roles import Role
from app.core.security import utc_now
from app.db.session import SessionLocal
from app.models.audit_log import AuditLog
from app.models.order import Order
from tests.conftest import create_address, create_order, register_customer
from tests.test_role_authorization import _create_account, _dashboard_login, _mobile_login


def assign(client, surface, headers, order_id, driver_id):
    if surface == "admin":
        return client.post(f"/api/v1/admin/deliveries/{order_id}/assign", headers=headers, json={"driverId": driver_id})
    return client.patch(f"/api/v1/business/orders/{order_id}/driver", headers=headers, json={"driverId": driver_id})


def seed_status(order_id, status, driver_id=None):
    # Fixture for existing orders, including assignments made before this rule.
    with SessionLocal() as db:
        order = db.get(Order, order_id)
        order.status = status
        order.assigned_driver_id = driver_id
        if status != "pending":
            order.confirmed_at = utc_now()
        db.commit()


@pytest.mark.parametrize("role", [Role.SYSTEM_ADMIN, Role.SALES_MANAGER])
@pytest.mark.parametrize("surface", ["admin", "business"])
def test_staff_assignment_immediately_releases_order_for_driver(client, role, surface):
    _, customer = register_customer(client)
    address = create_address(client, customer)
    staff_id = _create_account(role, "0712000002", "staff@example.com")
    driver_id = _create_account(Role.DRIVER, "0712000001", "driver@example.com")
    _, staff = _dashboard_login(client, "staff@example.com")
    _, driver = _mobile_login(client, "driver@example.com")

    for initial_status in ["pending", "confirmed", "processing"]:
        order_id = create_order(client, customer, address=address)["id"]
        seed_status(order_id, initial_status)
        response = assign(client, surface, staff, order_id, driver_id)
        assert response.status_code == 200, response.text
        status_key = "orderStatus" if surface == "admin" else "status"
        assert response.json()[status_key] == "processing"
        # Retrying the assignment must not repeat the lifecycle changes.
        assert assign(client, surface, staff, order_id, driver_id).status_code == 200
        current = client.get(f"/api/v1/driver/deliveries/{order_id}", headers=driver)
        assert current.json()["status"] == "processing"
        assert current.json()["assignedDriverId"] == driver_id
        assert client.get(f"/api/v1/orders/{order_id}", headers=customer).json()["status"] == "processing"
        with SessionLocal() as db:
            assert db.get(Order, order_id).confirmed_at is not None
            releases = list(db.scalars(select(AuditLog).where(
                AuditLog.resource_id == order_id, AuditLog.event_type == "ORDER_STATUS_UPDATED"
            )))
            assert len(releases) == (0 if initial_status == "processing" else 1)
            if releases:
                assert releases[0].actor_user_id == staff_id
                assert releases[0].metadata_json["reason"] == "driver_assignment"

        # Assignment authorizes starting; handover and receipt must still follow.
        url = f"/api/v1/driver/deliveries/{order_id}"
        assert client.patch(url + "/status", headers=driver, json={"status": "delivered"}).status_code == 400
        assert client.post(url + "/received", headers=driver).status_code == 403
        for next_status in ["out_for_delivery", "delivered"]:
            updated = client.patch(url + "/status", headers=driver, json={"status": next_status})
            assert updated.status_code == 200, updated.text
            assert updated.json()["status"] == next_status
        assert client.post(url + "/received", headers=driver).status_code == 403
        assert client.patch(url + "/status", headers=driver, json={"status": "received"}).status_code == 403
        received = client.post(f"/api/v1/orders/{order_id}/received", headers=customer)
        assert received.status_code == 200, received.text
        assert received.json()["status"] == "received"
        assert received.json()["customerReceivedByUserId"] == current.json()["customerId"]


@pytest.mark.parametrize("initial_status", ["pending", "confirmed"])
def test_existing_assignment_can_start_without_reassignment(client, initial_status):
    _, customer = register_customer(client)
    order_id = create_order(client, customer)["id"]
    driver_id = _create_account(Role.DRIVER, "0712000001", "driver@example.com")
    _create_account(Role.DRIVER, "0712000004", "other@example.com")
    _, driver = _mobile_login(client, "driver@example.com")
    _, other_driver = _mobile_login(client, "other@example.com")
    seed_status(order_id, initial_status, driver_id)
    url = f"/api/v1/driver/deliveries/{order_id}/status"
    assert client.patch(url, headers=other_driver, json={"status": "out_for_delivery"}).status_code == 404
    assert client.patch(url, headers=customer, json={"status": "out_for_delivery"}).status_code == 403
    assert client.patch(url, headers=driver, json={"status": "processing"}).status_code == 400
    assert client.patch(url, headers=driver, json={"status": "delivered"}).status_code == 400
    assert client.get(f"/api/v1/driver/deliveries/{order_id}", headers=driver).json()["status"] == initial_status
    started = client.patch(url, headers=driver, json={"status": "out_for_delivery"})
    assert started.status_code == 200, started.text
    assert started.json()["status"] == "out_for_delivery"
    # Starting again must not reset an in-progress delivery.
    assert client.patch(url, headers=driver, json={"status": "out_for_delivery"}).status_code == 400


@pytest.mark.parametrize("surface", ["admin", "business"])
def test_reassignment_preserves_progress_and_removes_previous_driver_access(client, surface):
    _, customer = register_customer(client)
    order_id = create_order(client, customer)["id"]
    first_id = _create_account(Role.DRIVER, "0712000001", "first@example.com")
    second_id = _create_account(Role.DRIVER, "0712000004", "second@example.com")
    _create_account(Role.SALES_MANAGER, "0712000002", "staff@example.com")
    _, staff = _dashboard_login(client, "staff@example.com")
    _, first = _mobile_login(client, "first@example.com")
    _, second = _mobile_login(client, "second@example.com")
    assert assign(client, surface, staff, order_id, first_id).status_code == 200
    url = f"/api/v1/driver/deliveries/{order_id}/status"
    assert client.patch(url, headers=first, json={"status": "out_for_delivery"}).status_code == 200
    assert assign(client, surface, staff, order_id, second_id).status_code == 200
    assert client.get(f"/api/v1/driver/deliveries/{order_id}", headers=second).json()["status"] == "out_for_delivery"
    assert client.patch(url, headers=first, json={"status": "delivered"}).status_code == 404
    assert client.patch(url, headers=second, json={"status": "delivered"}).status_code == 200


@pytest.mark.parametrize("surface", ["admin", "business"])
def test_assignment_does_not_release_closed_orders_or_invalid_drivers(client, surface):
    _, customer = register_customer(client)
    address = create_address(client, customer)
    driver_id = _create_account(Role.DRIVER, "0712000001", "driver@example.com")
    inactive_id = _create_account(Role.DRIVER, "0712000004", "inactive@example.com", active=False)
    staff_id = _create_account(Role.SALES_MANAGER, "0712000002", "staff@example.com")
    _, staff = _dashboard_login(client, "staff@example.com")
    for closed_status in ["delivered", "received", "cancelled"]:
        order_id = create_order(client, customer, address=address)["id"]
        seed_status(order_id, closed_status)
        response = assign(client, surface, staff, order_id, driver_id)
        assert response.status_code == 409, response.text
        assert response.json()["detail"]["code"] == "DELIVERY_CLOSED"
        with SessionLocal() as db:
            order = db.get(Order, order_id)
            assert order.status == closed_status
            assert order.assigned_driver_id is None

    order_id = create_order(client, customer, address=address)["id"]
    for invalid_driver in [inactive_id, staff_id, "missing-driver"]:
        assert assign(client, surface, staff, order_id, invalid_driver).status_code == 404
    with SessionLocal() as db:
        order = db.get(Order, order_id)
        assert order.status == "pending"
        assert order.assigned_driver_id is None
        assert order.confirmed_at is None
