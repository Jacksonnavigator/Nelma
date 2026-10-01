from sqlalchemy import select

from app.core.config import get_settings
from app.core.roles import Role
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.order import Order
from app.models.user import User
from tests.conftest import address_payload, create_address, create_order, register_customer


def _create_staff(role: Role, phone: str = "0712000000", email: str = "staff@example.com", name: str = "NELMA Staff") -> None:
    with SessionLocal() as db:
        user = User(
            full_name=name,
            phone="+255" + phone[-9:],
            email=email,
            password_hash=hash_password("Password123"),
            role=role,
            is_verified=True,
        )
        db.add(user)
        db.commit()


def _dashboard_headers(client, identifier: str = "0712000000"):
    response = client.post("/api/v1/auth/dashboard/login", json={"identifier": identifier, "password": "Password123"})
    assert response.status_code == 200, response.text
    session = response.json()
    return session, {"Authorization": "Bearer " + session["tokens"]["accessToken"]}


def _deliver_order(client, order_id: str) -> None:
    lifecycle = ["pending", "confirmed", "processing", "out_for_delivery", "delivered"]
    with SessionLocal() as db:
        order = db.scalar(select(Order).where(Order.id == order_id))
        assert order is not None
        current_status = order.status
    start_index = lifecycle.index(current_status) + 1 if current_status in lifecycle else 1
    headers = {"X-Internal-Admin-Token": get_settings().internal_admin_token}
    for next_status in lifecycle[start_index:]:
        response = client.patch("/api/v1/internal/orders/" + order_id + "/status", headers=headers, json={"status": next_status})
        assert response.status_code == 200, response.text


def test_registration_persists_language_preference_and_signup_address(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "fullName": "Asha Customer",
            "phone": "0712345678",
            "email": "asha@example.com",
            "password": "Password123",
            "confirmPassword": "Password123",
            "preferredLanguage": "sw",
            "addressLocationPreference": "multiple",
            "signupAddress": address_payload(),
        },
    )

    assert response.status_code == 201, response.text
    session = response.json()
    assert session["user"]["role"] == "USER"
    assert session["tokens"]["audience"] == "mobile"
    assert session["user"]["preferredLanguage"] == "sw"
    assert session["user"]["addressLocationPreference"] == "multiple"

    headers = {"Authorization": "Bearer " + session["tokens"]["accessToken"]}
    addresses = client.get("/api/v1/addresses", headers=headers).json()
    assert len(addresses) == 1
    assert addresses[0]["label"] == "My location"
    assert addresses[0]["area"] == "NM-AIST"
    assert addresses[0]["isDefault"] is True


def test_order_schedule_delivery_charges_messages_and_received_confirmation(client):
    _, headers = register_customer(client)
    address = create_address(
        client,
        headers,
        deliveryAddress="Tengeru market road",
        area="Tengeru",
        latitude=-3.377,
        longitude=36.821,
    )
    schedule = {"date": "2026-09-01", "slot": "morning", "label": "Today, Morning", "window": "09:00 - 12:00"}
    order = create_order(
        client,
        headers,
        address=address,
        deliverySchedule=schedule,
        customerRemarks="Call when at the gate",
        charges=[{"id": "fake", "label": "Fake", "amount": 999999}],
    )

    assert order["subtotal"] == 4000
    # Delivery is free by default, and a fee sent by the app is never trusted.
    assert order["charges"] == []
    assert order["total"] == 4000
    assert order["deliverySchedule"] == schedule
    assert order["customerRemarks"] == "Call when at the gate"
    assert order["messages"][0]["body"] == "Call when at the gate"

    message = client.post("/api/v1/orders/" + order["id"] + "/messages", headers=headers, json={"body": "Bring change"})
    assert message.status_code == 200, message.text
    assert [item["body"] for item in message.json()["messages"]][-1] == "Bring change"

    too_early = client.post("/api/v1/orders/" + order["id"] + "/received", headers=headers)
    assert too_early.status_code == 400
    assert too_early.json()["detail"]["code"] == "ORDER_NOT_DELIVERED"

    _deliver_order(client, order["id"])
    delivered = client.get("/api/v1/orders/" + order["id"], headers=headers).json()
    assert "mark_received" in delivered["availableActions"]

    received = client.post("/api/v1/orders/" + order["id"] + "/received", headers=headers)
    assert received.status_code == 200, received.text
    payload = received.json()
    assert payload["status"] == "received"
    assert payload["customerReceivedAt"] is not None
    assert payload["customerReceivedByUserId"] == order["customerId"]
    assert payload["timeline"][-1]["status"] == "received"
    assert "mark_received" not in payload["availableActions"]


def test_business_dashboard_uses_real_customer_database(client):
    customer_session, customer_headers = register_customer(client, phone="0712345678", email="customer@example.com", name="Jane Customer")
    address = create_address(
        client,
        customer_headers,
        deliveryAddress="Tengeru market road",
        area="Tengeru",
        latitude=-3.377,
        longitude=36.821,
    )
    order = create_order(client, customer_headers, address=address)
    payment = client.post("/api/v1/payments/initialize", headers=customer_headers, json={"orderId": order["id"], "methodId": "mobile_money"})
    assert payment.status_code == 201
    _deliver_order(client, order["id"])
    received = client.post("/api/v1/orders/" + order["id"] + "/received", headers=customer_headers)
    assert received.status_code == 200

    customer_forbidden = client.get("/api/v1/business/dashboard", headers=customer_headers)
    assert customer_forbidden.status_code == 401
    assert customer_forbidden.json()["detail"]["code"] == "INVALID_TOKEN_AUDIENCE"

    _create_staff(Role.SALES_MANAGER)
    staff_session, business_headers = _dashboard_headers(client)
    assert staff_session["user"]["role"] == "SALES_MANAGER"
    assert staff_session["tokens"]["audience"] == "dashboard"

    dashboard = client.get("/api/v1/business/dashboard", headers=business_headers)

    assert dashboard.status_code == 200, dashboard.text
    data = dashboard.json()
    assert data["monthlyReport"]["metrics"]["orders"] == 1
    assert data["monthlyReport"]["metrics"]["receivedOrders"] == 1
    assert data["monthlyReport"]["metrics"]["revenue"] == 4000
    assert data["monthlyReport"]["metrics"]["deliveryFees"] == 0
    assert data["receivedOrders"][0]["orderId"] == order["id"]
    assert data["customers"][0]["id"] == customer_session["user"]["id"]
    assert data["customers"][0]["totalOrders"] == 1
    assert data["customers"][0]["totalSpend"] == 4000
