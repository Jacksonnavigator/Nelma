from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.order import Order
from tests.conftest import create_address, create_order, register_customer


def test_public_settings_expose_server_prices(client):
    response = client.get("/api/v1/settings/public")
    assert response.status_code == 200
    data = response.json()
    assert data["currency"] == "TZS"
    assert data["products"]["first_purchase"]["unitPrice"] == 18000
    assert data["products"]["refill"]["unitPrice"] == 4000


def test_critical_pricing_cases_are_server_calculated(client):
    _, headers = register_customer(client)
    address = create_address(client, headers)
    cases = [
        ("first_purchase", 1, 18000),
        ("first_purchase", 2, 36000),
        ("refill", 1, 4000),
        ("refill", 3, 12000),
    ]
    for order_type, quantity, total in cases:
        order = create_order(client, headers, order_type=order_type, quantity=quantity, address=address, unitPrice=1, subtotal=1, total=1)
        assert order["subtotal"] == total
        assert order["total"] == total
        assert order["items"][0]["unitPrice"] == total // quantity


def test_order_address_snapshot_survives_saved_address_update(client):
    _, headers = register_customer(client)
    address = create_address(client, headers, area="Sinza")
    order = create_order(client, headers, order_type="first_purchase", quantity=2, address=address)
    updated = client.patch("/api/v1/addresses/" + address["id"], headers=headers, json={"area": "Mikocheni"})
    assert updated.status_code == 200
    fetched = client.get("/api/v1/orders/" + order["id"], headers=headers).json()
    assert fetched["deliveryAddress"]["area"] == "Sinza"
    assert fetched["total"] == 36000


def test_order_listing_and_ownership(client):
    _, headers_a = register_customer(client, phone="0712345678", email="a@example.com")
    order = create_order(client, headers_a)
    _, headers_b = register_customer(client, phone="0712345679", email="b@example.com")
    listed = client.get("/api/v1/orders?page=1&page_size=10", headers=headers_a).json()
    assert listed["total"] == 1
    assert listed["items"][0]["id"] == order["id"]
    assert client.get("/api/v1/orders/" + order["id"], headers=headers_b).status_code == 404


def test_cancellation_allowed_and_forbidden_after_processing(client):
    _, headers = register_customer(client)
    order = create_order(client, headers)
    cancelled = client.post("/api/v1/orders/" + order["id"] + "/cancel", headers=headers)
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"

    second = create_order(client, headers)
    with SessionLocal() as db:
        model = db.scalar(select(Order).where(Order.id == second["id"]))
        model.status = "processing"
        db.commit()
    forbidden = client.post("/api/v1/orders/" + second["id"] + "/cancel", headers=headers)
    assert forbidden.status_code == 400
    assert forbidden.json()["detail"]["code"] == "ORDER_NOT_CANCELLABLE"


def test_payment_amount_uses_order_total_and_idempotency(client):
    _, headers = register_customer(client)
    order = create_order(client, headers, order_type="refill", quantity=3)
    idempotency = {**headers, "Idempotency-Key": "pay-123"}
    first = client.post(
        "/api/v1/payments/initialize", headers=idempotency, json={"orderId": order["id"], "methodId": "mobile_money", "amount": 1}
    )
    second = client.post(
        "/api/v1/payments/initialize", headers=idempotency, json={"orderId": order["id"], "methodId": "mobile_money", "amount": 1}
    )
    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["id"] == second.json()["id"]
    assert first.json()["amount"] == 12000
    assert first.json()["status"] == "paid"
    payment_id = first.json()["id"]
    fetched = client.get("/api/v1/payments/" + payment_id, headers=headers)
    assert fetched.json()["amount"] == 12000


def test_payment_order_ownership_is_enforced(client):
    _, headers_a = register_customer(client, phone="0712345678", email="a@example.com")
    order = create_order(client, headers_a)
    _, headers_b = register_customer(client, phone="0712345679", email="b@example.com")
    response = client.post("/api/v1/payments/initialize", headers=headers_b, json={"orderId": order["id"], "methodId": "mobile_money"})
    assert response.status_code == 404


def test_notifications_are_created_listed_and_marked_read(client):
    _, headers = register_customer(client)
    order = create_order(client, headers)
    payment = client.post("/api/v1/payments/initialize", headers=headers, json={"orderId": order["id"], "methodId": "mobile_money"})
    assert payment.status_code == 201
    notifications = client.get("/api/v1/notifications", headers=headers).json()
    types = {item["type"] for item in notifications["items"]}
    assert "order_received" in types
    assert "payment_successful" in types
    first_id = notifications["items"][0]["id"]
    read = client.patch("/api/v1/notifications/" + first_id + "/read", headers=headers)
    assert read.status_code == 200
    assert read.json()["read"] is True


def test_notification_ownership_is_enforced(client):
    _, headers_a = register_customer(client, phone="0712345678", email="a@example.com")
    create_order(client, headers_a)
    notification_id = client.get("/api/v1/notifications", headers=headers_a).json()["items"][0]["id"]
    _, headers_b = register_customer(client, phone="0712345679", email="b@example.com")
    assert client.patch("/api/v1/notifications/" + notification_id + "/read", headers=headers_b).status_code == 404
