from tests.conftest import address_payload


def test_end_to_end_customer_flow_and_cross_customer_protection(client):
    registered = client.post(
        "/api/v1/auth/register",
        json={
            "fullName": "A Customer",
            "phone": "0712345678",
            "email": "a@example.com",
            "password": "Password123",
            "confirmPassword": "Password123",
        },
    )
    assert registered.status_code == 201
    login = client.post("/api/v1/auth/login", json={"identifier": "0712345678", "password": "Password123"})
    assert login.status_code == 200
    headers_a = {"Authorization": "Bearer " + login.json()["tokens"]["accessToken"]}

    profile = client.get("/api/v1/users/me", headers=headers_a)
    assert profile.status_code == 200
    assert profile.json()["phone"] == "+255712345678"

    address = client.post("/api/v1/addresses", json=address_payload(label="Home"), headers=headers_a)
    assert address.status_code == 201
    address_id = address.json()["id"]

    first_purchase = client.post(
        "/api/v1/orders",
        headers={**headers_a, "Idempotency-Key": "order-first-2"},
        json={"orderType": "first_purchase", "quantity": 2, "addressId": address_id, "paymentMethodId": "mobile_money"},
    )
    assert first_purchase.status_code == 201
    first_order = first_purchase.json()
    assert first_order["total"] == 36000

    payment = client.post(
        "/api/v1/payments/initialize",
        headers={**headers_a, "Idempotency-Key": "payment-first-2"},
        json={"orderId": first_order["id"], "methodId": "mobile_money"},
    )
    assert payment.status_code == 201
    assert payment.json()["amount"] == 36000
    assert payment.json()["status"] == "paid"

    checked_payment = client.get("/api/v1/payments/" + payment.json()["id"], headers=headers_a)
    assert checked_payment.status_code == 200

    viewed_order = client.get("/api/v1/orders/" + first_order["id"], headers=headers_a)
    assert viewed_order.status_code == 200
    assert viewed_order.json()["paymentStatus"] == "paid"

    notifications = client.get("/api/v1/notifications", headers=headers_a)
    assert notifications.status_code == 200
    assert notifications.json()["total"] >= 2

    refill = client.post(
        "/api/v1/orders",
        headers=headers_a,
        json={"orderType": "refill", "quantity": 3, "addressId": address_id, "paymentMethodId": "mobile_money"},
    )
    assert refill.status_code == 201
    assert refill.json()["total"] == 12000

    registered_b = client.post(
        "/api/v1/auth/register",
        json={
            "fullName": "B Customer",
            "phone": "0712345679",
            "email": "b@example.com",
            "password": "Password123",
            "confirmPassword": "Password123",
        },
    )
    headers_b = {"Authorization": "Bearer " + registered_b.json()["tokens"]["accessToken"]}
    assert client.get("/api/v1/orders/" + first_order["id"], headers=headers_b).status_code == 404
    assert client.get("/api/v1/addresses/" + address_id, headers=headers_b).status_code == 404
    assert client.get("/api/v1/payments/" + payment.json()["id"], headers=headers_b).status_code == 404
    notification_id = notifications.json()["items"][0]["id"]
    assert client.patch("/api/v1/notifications/" + notification_id + "/read", headers=headers_b).status_code == 404
