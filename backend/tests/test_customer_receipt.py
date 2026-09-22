from app.core.roles import Role
from tests.conftest import create_order, register_customer
from tests.test_role_authorization import _create_account, _dashboard_login, _mobile_login


def test_handover_requires_the_order_owner_to_confirm_and_notifies_driver(client):
    _, owner = register_customer(client)
    _, other = register_customer(client, phone="0712345679", email="other@example.com")
    order = create_order(client, owner)
    driver_id = _create_account(Role.DRIVER, "0712000001", "driver@example.com")
    _create_account(Role.SALES_MANAGER, "0712000002", "sales@example.com")
    _, sales = _dashboard_login(client, "sales@example.com")
    _, driver = _mobile_login(client, "driver@example.com")
    oid = order["id"]
    assert client.patch(f"/api/v1/business/orders/{oid}/driver", headers=sales, json={"driverId": driver_id}).status_code == 200
    assert client.post(f"/api/v1/orders/{oid}/received", headers=owner).status_code == 400
    for status in ["out_for_delivery", "delivered"]:
        response = client.patch(f"/api/v1/driver/deliveries/{oid}/status", headers=driver, json={"status": status})
        assert response.status_code == 200, response.text
    delivered = client.get(f"/api/v1/orders/{oid}", headers=owner).json()
    assert delivered["status"] == "delivered"
    assert delivered["customerReceivedAt"] is None
    assert "mark_received" in delivered["availableActions"]
    assert client.post(f"/api/v1/orders/{oid}/received", headers=other).status_code == 404
    assert client.post(f"/api/v1/driver/deliveries/{oid}/received", headers=driver).status_code == 403
    assert client.patch(f"/api/v1/driver/deliveries/{oid}/status", headers=driver, json={"status": "received"}).status_code == 403
    received = client.post(f"/api/v1/orders/{oid}/received", headers=owner)
    assert received.status_code == 200, received.text
    assert received.json()["customerReceivedByUserId"] == order["customerId"]
    assert received.json()["customerReceivedAt"] is not None
    repeated = client.post(f"/api/v1/orders/{oid}/received", headers=owner)
    assert repeated.json()["customerReceivedAt"] == received.json()["customerReceivedAt"]
    assert client.get(f"/api/v1/driver/deliveries/{oid}", headers=driver).json()["status"] == "received"
    notes = client.get("/api/v1/notifications", headers=driver).json()["items"]
    assert len([note for note in notes if note["type"] == "driver_customer_received" and note["orderId"] == oid]) == 1
