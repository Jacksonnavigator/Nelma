from datetime import timedelta

from app.core.roles import Role
from app.core.security import utc_now
from tests.conftest import create_address, register_customer
from tests.test_role_authorization import _create_account, _dashboard_login


def staff(client):
    admin_id = _create_account(Role.SYSTEM_ADMIN, "0711000001", "admin@example.com")
    sales_id = _create_account(Role.SALES_MANAGER, "0711000002", "sales@example.com")
    admin_session, admin = _dashboard_login(client, "admin@example.com")
    sales_session, sales = _dashboard_login(client, "sales@example.com")
    return admin_id, sales_id, admin_session, sales_session, admin, sales


def test_dashboard_persistence_and_permissions(client):
    admin_id, _, _, _, admin, sales = staff(client)
    assert client.get("/api/v1/admin/settings", headers=sales).status_code == 403
    assert client.get("/api/v1/admin/accounts", headers=sales).status_code == 403
    assert client.get("/api/v1/admin/dashboard").status_code == 401
    config = client.get("/api/v1/admin/settings", headers=admin).json()
    config["business"]["name"] = "Verified Water"
    assert client.patch("/api/v1/admin/settings", headers=admin, json=config).status_code == 200
    assert client.get("/api/v1/admin/settings", headers=admin).json()["business"]["name"] == "Verified Water"
    config["payments"]["mobileMoneyEnabled"] = True
    assert client.patch("/api/v1/admin/settings", headers=admin, json=config).status_code == 422
    assert client.get("/api/v1/admin/order-options", headers=sales).status_code == 200
    assert client.post(f"/api/v1/admin/accounts/{admin_id}/deactivate", headers=admin).status_code == 403
    assert client.patch(f"/api/v1/admin/accounts/{admin_id}", headers=admin, json={"role": "SALES_MANAGER"}).status_code == 403
    created = client.post(
        "/api/v1/admin/accounts",
        headers=admin,
        json={
            "fullName": "New Staff",
            "phone": "0711000003",
            "email": "new@example.com",
            "password": "Password123",
            "role": "SALES_MANAGER",
        },
    )
    assert created.status_code == 201, created.text
    identifier = created.json()["id"]
    assert "password" not in created.json()
    assert (
        client.patch(f"/api/v1/admin/accounts/{identifier}", headers=admin, json={"role": "SYSTEM_ADMIN"}).json()["role"] == "SYSTEM_ADMIN"
    )
    assert client.post(f"/api/v1/admin/accounts/{identifier}/deactivate", headers=admin).status_code == 200
    assert client.post("/api/v1/auth/dashboard/login", json={"identifier": "new@example.com", "password": "Password123"}).status_code in {
        401,
        403,
    }
    assert client.post(f"/api/v1/admin/accounts/{identifier}/activate", headers=admin).status_code == 200
    assert client.post("/api/v1/auth/dashboard/login", json={"identifier": "new@example.com", "password": "Password123"}).status_code == 200
    for headers in [admin, sales]:
        response = client.patch("/api/v1/auth/dashboard/me", headers=headers, json={"fullName": "Updated Profile"})
        assert response.status_code == 200, response.text
        assert client.get("/api/v1/auth/dashboard/me", headers=headers).json()["fullName"] == "Updated Profile"
    audit = client.get("/api/v1/admin/audit-logs", headers=admin).json()
    assert audit["total"] > 0
    assert client.get("/api/v1/admin/audit-logs", headers=sales).status_code == 403


def test_operational_flow_uses_real_prices_and_deliveries(client):
    _, _, _, _, admin, sales = staff(client)
    _, mobile = register_customer(client)
    create_address(client, mobile)
    assert client.get("/api/v1/admin/orders", headers=mobile).status_code in {401, 403}
    customer = client.get("/api/v1/admin/customers", headers=sales, params={"search": "Jane"}).json()[0]
    assert customer["savedLocations"]
    assert client.patch("/api/v1/admin/pricing/refill", headers=sales, json={"price": 5000}).status_code == 200
    assert client.get("/api/v1/settings/public").json()["products"]["refill"]["unitPrice"] == 5000
    driver = client.post(
        "/api/v1/admin/drivers", headers=sales, json={"fullName": "Test Driver", "phone": "0711000010", "password": "Password123"}
    )
    assert driver.status_code == 201, driver.text
    driver_id = driver.json()["id"]
    assert client.get("/api/v1/admin/drivers/available", headers=admin).json()[0]["id"] == driver_id
    windows = client.get("/api/v1/admin/order-options", headers=sales).json()["delivery"]["defaultTimeWindows"]
    payload = {
        "customerId": customer["id"],
        "product": "refill",
        "quantity": 2,
        "deliveryLocation": {"label": "Home", "area": "NM-AIST", "addressLine": "Campus Block A", "phone": customer["phone"]},
        "deliveryDate": (utc_now() + timedelta(days=1)).date().isoformat(),
        "deliveryWindow": windows[0],
        "paymentMethod": "cash",
    }
    assert client.post("/api/v1/admin/orders", headers=admin, json=payload).status_code == 403
    result = client.post("/api/v1/admin/orders", headers=sales, json=payload)
    assert result.status_code == 201, result.text
    order = result.json()
    identifier = order["id"]
    assert order["total"] == 10000
    assert client.post(f"/api/v1/admin/orders/{identifier}/collect-cash", headers=sales, json={"amount": 10000}).status_code == 409
    assert client.get(f"/api/v1/admin/deliveries/{identifier}", headers=sales).json()["orderStatus"] == "pending"
    rejected = client.patch(f"/api/v1/admin/deliveries/{identifier}", headers=sales, json={"status": "out_for_delivery"})
    assert rejected.status_code == 400
    assert rejected.json()["detail"]["code"] == "INVALID_ORDER_TRANSITION"
    assert order["createdBy"]["role"] == "SALES_MANAGER"
    assert client.get("/api/v1/admin/orders", headers=sales, params={"search": "Jane", "status": "pending"}).json()["total"] == 1
    assert client.get("/api/v1/admin/orders", headers=sales, params={"search": "missing"}).json()["total"] == 0
    assert client.post(f"/api/v1/admin/orders/{identifier}/confirm", headers=admin).status_code == 403
    assert client.post(f"/api/v1/admin/orders/{identifier}/confirm", headers=sales).json()["status"] == "confirmed"
    assert client.post(f"/api/v1/admin/orders/{identifier}/process", headers=sales).json()["status"] == "processing"
    assert (
        client.post(f"/api/v1/admin/deliveries/{identifier}/assign", headers=admin, json={"driverId": driver_id}).json()["status"]
        == "assigned"
    )
    assert client.get(f"/api/v1/admin/drivers/{driver_id}/deliveries", headers=sales).json()[0]["id"] == identifier
    assert client.patch(f"/api/v1/admin/deliveries/{identifier}", headers=admin, json={"status": "delivered"}).status_code == 403
    for status in ["out_for_delivery", "delivered"]:
        response = client.patch(f"/api/v1/admin/deliveries/{identifier}", headers=sales, json={"status": status})
        assert response.status_code == 200, response.text
        assert response.json()["status"] == status
    assert client.post(f"/api/v1/admin/deliveries/{identifier}/assign", headers=admin, json={"driverId": driver_id}).status_code == 409
    assert client.get(f"/api/v1/orders/{identifier}", headers=mobile).json()["status"] == "delivered"
    report = client.get("/api/v1/admin/reports/sales", headers=sales).json()
    assert report["summary"]["totalOrders"] == 1
    assert report["summary"]["totalSales"] == 0  # Cash is pending, not collected revenue.
    assert report["summary"]["pendingPayments"] == 1
    initialized = client.post("/api/v1/payments/initialize", headers=mobile, json={"orderId": identifier, "methodId": "cash"})
    assert initialized.status_code == 201
    cash_url = f"/api/v1/admin/orders/{identifier}/collect-cash"
    assert client.post(cash_url, headers=admin, json={"amount": 10000}).status_code == 403
    assert client.post(cash_url, headers=mobile, json={"amount": 10000}).status_code == 401
    assert client.post(cash_url, headers=sales, json={"amount": 9999}).status_code == 422
    assert client.post(cash_url, headers=sales, json={"amount": 10000.5}).status_code == 422
    from concurrent.futures import ThreadPoolExecutor

    with ThreadPoolExecutor(max_workers=2) as pool:
        attempts = list(pool.map(lambda _: client.post(cash_url, headers=sales, json={"amount": 10000}), range(2)))
    assert any(r.status_code == 200 for r in attempts)
    assert all(r.status_code in {200, 409} for r in attempts)
    paid = client.post(cash_url, headers=sales, json={"amount": 10000})
    assert paid.status_code == 200, paid.text
    assert paid.json()["paymentStatus"] == "paid"
    assert paid.json()["cashReceipt"]["amount"] == 10000
    assert client.get(f"/api/v1/orders/{identifier}", headers=mobile).json()["paymentStatus"] == "paid"
    report = client.get("/api/v1/admin/reports/sales", headers=sales).json()
    assert report["summary"]["totalSales"] == 10000
    assert report["summary"]["pendingPayments"] == 0
    from app.core.config import get_settings

    late_callback = client.post(
        "/api/v1/payments/webhooks/development",
        headers={"x-development-webhook-secret": get_settings().development_webhook_secret},
        json={"providerReference": initialized.json()["providerReference"], "status": "paid"},
    )
    assert late_callback.status_code == 400
    assert client.get(f"/api/v1/admin/orders/{identifier}", headers=sales).json()["paymentStatus"] == "paid"
    audits = client.get("/api/v1/admin/audit-logs", headers=admin, params={"action": "CASH_COLLECTED"}).json()
    assert audits["total"] == 1
    from sqlalchemy import select

    from app.db.session import SessionLocal
    from app.models.payment import Payment

    with SessionLocal() as db:
        assert len(list(db.scalars(select(Payment).where(Payment.order_id == identifier, Payment.status == "paid")))) == 1
    from app.models.order import Order

    with SessionLocal() as db:
        db.get(Order, identifier).created_at = utc_now() - timedelta(days=35)
        db.commit()
    today_report = client.get("/api/v1/admin/reports/sales", headers=sales, params={"period": "today"}).json()
    assert today_report["summary"]["totalSales"] == 10000
    assert client.get("/api/v1/admin/dashboard", headers=sales).json()["todaySales"] == 10000
    notifications = client.get("/api/v1/admin/notifications", headers=admin).json()
    assert notifications
    notification_id = notifications[0]["id"]
    assert client.post(f"/api/v1/admin/notifications/{notification_id}/read", headers=sales).status_code == 404
    assert client.post(f"/api/v1/admin/notifications/{notification_id}/read", headers=admin).status_code == 204
    assert client.post("/api/v1/admin/notifications/read-all", headers=admin).status_code == 204
    assert all(n["read"] for n in client.get("/api/v1/admin/notifications", headers=admin).json())


def test_password_change_reset_and_refresh_revocation(client):
    _, _, session, _, admin, _ = staff(client)
    response = client.patch(
        "/api/v1/auth/dashboard/security",
        headers=admin,
        json={"currentPassword": "Password123", "newPassword": "ChangedPassword123", "confirmPassword": "ChangedPassword123"},
    )
    assert response.status_code == 204, response.text
    assert client.post("/api/v1/auth/dashboard/refresh", json={"refreshToken": session["tokens"]["refreshToken"]}).status_code == 401
    reset = client.post("/api/v1/auth/forgot-password", json={"identifier": "admin@example.com"}).json()
    payload = {
        "identifier": "admin@example.com",
        "resetToken": reset["resetToken"],
        "newPassword": "ResetPassword123",
        "confirmPassword": "ResetPassword123",
    }
    assert client.post("/api/v1/auth/reset-password", json=payload).status_code == 204
    assert client.post("/api/v1/auth/reset-password", json=payload).status_code == 400
    login = client.post("/api/v1/auth/dashboard/login", json={"identifier": "admin@example.com", "password": "ResetPassword123"})
    assert login.status_code == 200
    token = login.json()["tokens"]["refreshToken"]
    assert client.post("/api/v1/auth/dashboard/logout", json={"refreshToken": token}).status_code == 204
    assert client.post("/api/v1/auth/dashboard/refresh", json={"refreshToken": token}).status_code == 401


def test_dashboard_validation_filters_and_missing_records(client):
    _, _, _, _, admin, sales = staff(client)
    for windows in [[], [" "]]:
        response = client.patch(
            "/api/v1/admin/settings",
            headers=admin,
            json={"delivery": {"feeRuleSource": "Server-defined (FastAPI)", "defaultTimeWindows": windows}},
        )
        assert response.status_code == 422
    assert (
        client.patch(
            "/api/v1/admin/settings", headers=admin, json={"payments": {"cashEnabled": False, "mobileMoneyEnabled": False}}
        ).status_code
        == 422
    )
    normalized = client.patch("/api/v1/admin/settings", headers=admin, json={"delivery": {"defaultTimeWindows": ["09:00", "09:00"]}})
    assert normalized.status_code == 200
    assert normalized.json()["delivery"]["defaultTimeWindows"] == ["09:00"]
    for params in [
        {"period": "custom"},
        {"period": "custom", "from": "2026-09-16", "to": "2026-09-15"},
        {"period": "custom", "from": "2024-01-01", "to": "2026-09-16"},
    ]:
        assert client.get("/api/v1/admin/reports/sales", headers=sales, params=params).status_code == 422
    for resource in ["orders", "deliveries", "drivers"]:
        assert client.get(f"/api/v1/admin/{resource}/missing", headers=sales).status_code == 404
        assert client.get(f"/api/v1/admin/{resource}", headers=sales, params={"page": 0}).status_code == 422
        assert client.get(f"/api/v1/admin/{resource}", headers=sales, params={"search": "no match"}).json()["total"] == 0
    assert client.get("/api/v1/admin/audit-logs", headers=admin, params={"actor": "no match"}).json()["total"] == 0
    assert client.patch("/api/v1/admin/pricing/refill", headers=sales, json={"price": 0}).status_code == 422
    assert client.patch("/api/v1/admin/pricing/refill", headers=sales, json={"price": 1.5}).status_code == 422
