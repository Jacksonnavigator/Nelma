from app.core.roles import Role
from tests.conftest import create_address, create_order, register_customer
from tests.test_driver_assignment import assign, seed_status
from tests.test_role_authorization import _create_account, _dashboard_login, _mobile_login


def test_driver_summary_counts_only_this_drivers_completed_work(client):
    _, customer = register_customer(client)
    address = create_address(client, customer)
    _create_account(Role.SYSTEM_ADMIN, "0712000002", "staff@example.com")
    driver_id = _create_account(Role.DRIVER, "0712000001", "driver@example.com")
    _create_account(Role.DRIVER, "0712000003", "other@example.com")
    _, staff = _dashboard_login(client, "staff@example.com")
    _, driver = _mobile_login(client, "driver@example.com")
    _, other = _mobile_login(client, "other@example.com")

    empty = client.get("/api/v1/driver/summary", headers=driver)
    assert empty.status_code == 200, empty.text
    assert empty.json()["allTime"] == {"deliveries": 0, "bottles": 0, "value": 0}
    assert empty.json()["activeDeliveries"] == 0

    delivered_ids = []
    for quantity in (2, 3):
        order_id = create_order(client, customer, address=address, quantity=quantity)["id"]
        seed_status(order_id, "pending")
        assert assign(client, "admin", staff, order_id, driver_id).status_code == 200
        delivered_ids.append(order_id)
    open_id = create_order(client, customer, address=address)["id"]
    seed_status(open_id, "pending")
    assert assign(client, "admin", staff, open_id, driver_id).status_code == 200

    for order_id in delivered_ids:
        for next_status in ("out_for_delivery", "delivered"):
            assert client.patch(f"/api/v1/driver/deliveries/{order_id}/status", headers=driver, json={"status": next_status}).status_code == 200

    summary = client.get("/api/v1/driver/summary", headers=driver).json()
    assert summary["activeDeliveries"] == 1
    for period in ("today", "week", "month", "allTime"):
        assert summary[period]["deliveries"] == 2
        assert summary[period]["bottles"] == 5
        assert summary[period]["value"] > 0

    other_summary = client.get("/api/v1/driver/summary", headers=other).json()
    assert other_summary["allTime"]["deliveries"] == 0


def test_driver_summary_is_not_available_to_customers(client):
    _, customer = register_customer(client)
    assert client.get("/api/v1/driver/summary", headers=customer).status_code == 403
