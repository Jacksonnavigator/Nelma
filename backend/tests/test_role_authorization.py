from app.core.permissions import Permission, has_permission
from app.core.roles import Role
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User
from tests.conftest import create_address, create_order, register_customer


def _phone(local: str) -> str:
    return "+255" + local[-9:]


def _create_account(role: Role, phone: str, email: str, name: str = "NELMA Account", *, active: bool = True) -> str:
    with SessionLocal() as db:
        user = User(
            full_name=name,
            phone=_phone(phone),
            email=email,
            password_hash=hash_password("Password123"),
            role=role,
            is_active=active,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user.id


def _mobile_login(client, identifier: str):
    response = client.post("/api/v1/auth/login", json={"identifier": identifier, "password": "Password123"})
    assert response.status_code == 200, response.text
    session = response.json()
    return session, {"Authorization": "Bearer " + session["tokens"]["accessToken"]}


def _dashboard_login(client, identifier: str):
    response = client.post("/api/v1/auth/dashboard/login", json={"identifier": identifier, "password": "Password123"})
    assert response.status_code == 200, response.text
    session = response.json()
    return session, {"Authorization": "Bearer " + session["tokens"]["accessToken"]}


def _advance_dashboard(client, headers: dict[str, str], order_id: str, statuses: list[str]) -> dict:
    result = None
    for next_status in statuses:
        response = client.patch("/api/v1/business/orders/" + order_id + "/status", headers=headers, json={"status": next_status})
        assert response.status_code == 200, response.text
        result = response.json()
    assert result is not None
    return result


def test_permission_matrix_is_explicit_and_denies_undecided_actions():
    expected = {
        Role.USER: {
            Permission.ORDER_PLACE_SELF,
            Permission.ORDER_VIEW_SELF,
            Permission.ADDRESS_MANAGE_SELF,
            Permission.NOTIFICATION_VIEW_SELF,
            Permission.PAYMENT_MANAGE_SELF,
            Permission.PROFILE_UPDATE_SELF,
            Permission.CUSTOMER_RECEIPT_CONFIRM,
        },
        Role.DRIVER: {
            Permission.NOTIFICATION_VIEW_SELF,
            Permission.PROFILE_UPDATE_SELF,
            Permission.DELIVERY_VIEW_ASSIGNED,
            Permission.DELIVERY_UPDATE,
        },
        Role.SALES_MANAGER: {
            Permission.PROFILE_UPDATE_SELF,
            Permission.NOTIFICATION_VIEW_SELF,
            Permission.ORDER_PLACE_FOR_CUSTOMER,
            Permission.CASH_COLLECTION_RECORD,
            Permission.ORDER_VIEW_ALL,
            Permission.DELIVERY_VIEW_ALL,
            Permission.DELIVERY_UPDATE,
            Permission.ORDER_PROCESS,
            Permission.DRIVER_ASSIGN,
            Permission.DRIVER_MANAGE,
            Permission.SALES_REPORT_VIEW,
            Permission.PRICING_MANAGE,
        },
        Role.SYSTEM_ADMIN: {
            Permission.PROFILE_UPDATE_SELF,
            Permission.NOTIFICATION_VIEW_SELF,
            Permission.ORDER_VIEW_ALL,
            Permission.DELIVERY_VIEW_ALL,
            Permission.DRIVER_ASSIGN,
            Permission.DRIVER_MANAGE,
            Permission.SALES_REPORT_VIEW,
            Permission.PRICING_MANAGE,
            Permission.SYSTEM_SETTINGS_MANAGE,
            Permission.ADMIN_ACCOUNT_MANAGE,
            Permission.AUDIT_LOG_VIEW,
        },
    }

    for role, permissions in expected.items():
        for permission in Permission:
            assert has_permission(role, permission) is (permission in permissions)

    assert has_permission(Role.SYSTEM_ADMIN, Permission.DELIVERY_UPDATE) is False
    assert has_permission(Role.SALES_MANAGER, Permission.CUSTOMER_RECEIPT_CONFIRM) is False


def test_mobile_and_dashboard_login_surfaces_are_separated(client):
    user_session, _ = register_customer(client, phone="0712345678", email="customer@example.com")
    assert user_session["user"]["role"] == "USER"

    _create_account(Role.DRIVER, "0712000001", "driver@example.com", "NELMA Driver")
    _create_account(Role.SALES_MANAGER, "0712000002", "sales@example.com", "NELMA Sales")
    _create_account(Role.SYSTEM_ADMIN, "0712000003", "admin@example.com", "NELMA Admin")

    driver_session, _ = _mobile_login(client, "0712000001")
    assert driver_session["user"]["role"] == "DRIVER"
    assert driver_session["tokens"]["audience"] == "mobile"

    for identifier in ["0712000002", "0712000003"]:
        response = client.post("/api/v1/auth/login", json={"identifier": identifier, "password": "Password123"})
        assert response.status_code == 403
        assert response.json()["detail"]["code"] == "INVALID_LOGIN_SURFACE"

    for identifier in ["0712345678", "0712000001"]:
        response = client.post("/api/v1/auth/dashboard/login", json={"identifier": identifier, "password": "Password123"})
        assert response.status_code == 403
        assert response.json()["detail"]["code"] == "INVALID_LOGIN_SURFACE"

    sales_session, _ = _dashboard_login(client, "0712000002")
    admin_session, _ = _dashboard_login(client, "0712000003")
    assert sales_session["user"]["role"] == "SALES_MANAGER"
    assert admin_session["user"]["role"] == "SYSTEM_ADMIN"
    assert sales_session["tokens"]["audience"] == "dashboard"
    assert admin_session["tokens"]["audience"] == "dashboard"


def test_session_audience_prevents_cross_surface_token_use(client):
    mobile_session, mobile_headers = register_customer(client, phone="0712345678", email="customer@example.com")
    _create_account(Role.SALES_MANAGER, "0712000002", "sales@example.com", "NELMA Sales")
    dashboard_session, dashboard_headers = _dashboard_login(client, "0712000002")

    mobile_on_dashboard = client.get("/api/v1/business/dashboard", headers=mobile_headers)
    assert mobile_on_dashboard.status_code == 401
    assert mobile_on_dashboard.json()["detail"]["code"] == "INVALID_TOKEN_AUDIENCE"

    dashboard_on_mobile = client.get("/api/v1/users/me", headers=dashboard_headers)
    assert dashboard_on_mobile.status_code == 401
    assert dashboard_on_mobile.json()["detail"]["code"] == "INVALID_TOKEN_AUDIENCE"

    mobile_refresh_on_dashboard = client.post(
        "/api/v1/auth/dashboard/refresh",
        json={"refreshToken": mobile_session["tokens"]["refreshToken"]},
    )
    assert mobile_refresh_on_dashboard.status_code == 401

    dashboard_refresh_on_mobile = client.post(
        "/api/v1/auth/refresh",
        json={"refreshToken": dashboard_session["tokens"]["refreshToken"]},
    )
    assert dashboard_refresh_on_mobile.status_code == 401


def test_public_registration_and_driver_creation_reject_privileged_field_injection(client):
    injected_user = client.post(
        "/api/v1/auth/register",
        json={
            "fullName": "Injected Admin",
            "phone": "0712345678",
            "email": "inject@example.com",
            "password": "Password123",
            "confirmPassword": "Password123",
            "role": "SYSTEM_ADMIN",
        },
    )
    assert injected_user.status_code == 422

    _create_account(Role.SALES_MANAGER, "0712000002", "sales@example.com", "NELMA Sales")
    _, sales_headers = _dashboard_login(client, "0712000002")
    injected_driver = client.post(
        "/api/v1/drivers",
        headers=sales_headers,
        json={
            "fullName": "Injected Driver",
            "phone": "0712000004",
            "email": "driver-inject@example.com",
            "password": "Password123",
            "role": "SYSTEM_ADMIN",
        },
    )
    assert injected_driver.status_code == 422

    valid_driver = client.post(
        "/api/v1/drivers",
        headers=sales_headers,
        json={
            "fullName": "Valid Driver",
            "phone": "0712000008",
            "email": "valid-driver@example.com",
            "password": "Password123",
        },
    )
    assert valid_driver.status_code == 201, valid_driver.text
    assert valid_driver.json()["role"] == "DRIVER"


def test_account_management_permissions_are_role_scoped(client):
    _create_account(Role.SALES_MANAGER, "0712000002", "sales@example.com", "NELMA Sales")
    _create_account(Role.SYSTEM_ADMIN, "0712000003", "admin@example.com", "NELMA Admin")
    _, sales_headers = _dashboard_login(client, "0712000002")
    _, admin_headers = _dashboard_login(client, "0712000003")

    driver = client.post(
        "/api/v1/drivers",
        headers=sales_headers,
        json={"fullName": "Route Driver", "phone": "0712000005", "email": "route-driver@example.com", "password": "Password123"},
    )
    assert driver.status_code == 201, driver.text
    assert driver.json()["role"] == "DRIVER"

    drivers = client.get("/api/v1/drivers", headers=sales_headers)
    assert drivers.status_code == 200
    assert drivers.json()[0]["id"] == driver.json()["id"]

    delete_driver = client.delete("/api/v1/drivers/" + driver.json()["id"], headers=sales_headers)
    assert delete_driver.status_code == 405

    sales_creates_admin = client.post(
        "/api/v1/admin/accounts",
        headers=sales_headers,
        json={"fullName": "Blocked Admin", "phone": "0712000006", "email": "blocked-admin@example.com", "password": "Password123", "role": "SYSTEM_ADMIN"},
    )
    assert sales_creates_admin.status_code == 403

    admin_creates_sales = client.post(
        "/api/v1/admin/accounts",
        headers=admin_headers,
        json={"fullName": "New Sales", "phone": "0712000007", "email": "new-sales@example.com", "password": "Password123", "role": "SALES_MANAGER"},
    )
    assert admin_creates_sales.status_code == 201, admin_creates_sales.text
    assert admin_creates_sales.json()["role"] == "SALES_MANAGER"


def test_business_order_permissions_and_admin_view_only_rules(client):
    customer_session, customer_headers = register_customer(client, phone="0712345678", email="customer@example.com")
    address = create_address(client, customer_headers)
    _create_account(Role.DRIVER, "0712000001", "driver@example.com", "NELMA Driver")
    _create_account(Role.SALES_MANAGER, "0712000002", "sales@example.com", "NELMA Sales")
    _create_account(Role.SYSTEM_ADMIN, "0712000003", "admin@example.com", "NELMA Admin")
    driver_session, driver_headers = _mobile_login(client, "0712000001")
    sales_session, sales_headers = _dashboard_login(client, "0712000002")
    _, admin_headers = _dashboard_login(client, "0712000003")

    driver_create_order = client.post(
        "/api/v1/orders",
        headers=driver_headers,
        json={"orderType": "refill", "quantity": 1, "addressId": address["id"], "paymentMethodId": "mobile_money"},
    )
    assert driver_create_order.status_code == 403

    order_payload = {"customerId": customer_session["user"]["id"], "orderType": "refill", "quantity": 2, "addressId": address["id"], "paymentMethodId": "cash"}
    sales_order = client.post("/api/v1/business/orders", headers=sales_headers, json=order_payload)
    assert sales_order.status_code == 201, sales_order.text
    order = sales_order.json()
    assert order["customerId"] == customer_session["user"]["id"]
    assert order["createdByUserId"] == sales_session["user"]["id"]
    assert order["source"] == "SALES_MANAGER_DASHBOARD"
    assert order["total"] == 8000

    admin_create_order = client.post("/api/v1/business/orders", headers=admin_headers, json=order_payload)
    assert admin_create_order.status_code == 403

    admin_view = client.get("/api/v1/business/orders/" + order["id"], headers=admin_headers)
    assert admin_view.status_code == 200

    admin_process = client.patch("/api/v1/business/orders/" + order["id"] + "/status", headers=admin_headers, json={"status": "confirmed"})
    assert admin_process.status_code == 403

    sales_receipt = client.patch("/api/v1/business/orders/" + order["id"] + "/status", headers=sales_headers, json={"status": "received"})
    assert sales_receipt.status_code == 403

    assign_driver = client.patch("/api/v1/business/orders/" + order["id"] + "/driver", headers=sales_headers, json={"driverId": driver_session["user"]["id"]})
    assert assign_driver.status_code == 200
    assert assign_driver.json()["assignedDriverId"] == driver_session["user"]["id"]


def test_driver_delivery_boundary_and_received_actor_tracking(client):
    _, customer_headers = register_customer(client, phone="0712345678", email="customer@example.com")
    order_one = create_order(client, customer_headers)
    order_two = create_order(client, customer_headers)
    order_three = create_order(client, customer_headers)
    driver_id = _create_account(Role.DRIVER, "0712000001", "driver@example.com", "NELMA Driver")
    driver_b_id = _create_account(Role.DRIVER, "0712000004", "driver-b@example.com", "NELMA Driver B")
    _create_account(Role.SALES_MANAGER, "0712000002", "sales@example.com", "NELMA Sales")
    _, sales_headers = _dashboard_login(client, "0712000002")
    _, driver_headers = _mobile_login(client, "0712000001")
    _, driver_b_headers = _mobile_login(client, "0712000004")

    _advance_dashboard(client, sales_headers, order_one["id"], ["confirmed", "processing"])
    _advance_dashboard(client, sales_headers, order_three["id"], ["confirmed", "processing"])
    assigned = client.patch("/api/v1/business/orders/" + order_one["id"] + "/driver", headers=sales_headers, json={"driverId": driver_id})
    assert assigned.status_code == 200, assigned.text
    assert assigned.json()["customerName"] == "Jane Customer"
    assert assigned.json()["customerPhone"].startswith("+255")
    assigned_two = client.patch("/api/v1/business/orders/" + order_three["id"] + "/driver", headers=sales_headers, json={"driverId": driver_id})
    assert assigned_two.status_code == 200, assigned_two.text

    driver_notifications = client.get("/api/v1/notifications", headers=driver_headers)
    assert driver_notifications.status_code == 200, driver_notifications.text
    driver_items = driver_notifications.json()["items"]
    assert any(item["type"] == "driver_delivery_assigned" and item["orderId"] == order_one["id"] for item in driver_items)
    first_notification_id = driver_items[0]["id"]
    marked = client.patch("/api/v1/notifications/" + first_notification_id + "/read", headers=driver_headers)
    assert marked.status_code == 200, marked.text
    assert marked.json()["read"] is True
    read_all = client.post("/api/v1/notifications/read-all", headers=driver_headers)
    assert read_all.status_code == 204

    deliveries = client.get("/api/v1/driver/deliveries", headers=driver_headers)
    assert deliveries.status_code == 200
    assert {item["id"] for item in deliveries.json()} == {order_one["id"], order_three["id"]}

    driver_b_deliveries = client.get("/api/v1/driver/deliveries", headers=driver_b_headers)
    assert driver_b_deliveries.status_code == 200
    assert driver_b_deliveries.json() == []

    unassigned = client.get("/api/v1/driver/deliveries/" + order_two["id"], headers=driver_headers)
    assert unassigned.status_code == 404

    wrong_driver = client.get("/api/v1/driver/deliveries/" + order_one["id"], headers=driver_b_headers)
    assert wrong_driver.status_code == 404
    wrong_driver_update = client.patch("/api/v1/driver/deliveries/" + order_one["id"] + "/status", headers=driver_b_headers, json={"status": "out_for_delivery"})
    assert wrong_driver_update.status_code == 404

    customer_orders_for_driver = client.get("/api/v1/orders", headers=driver_headers)
    assert customer_orders_for_driver.status_code == 403

    delivered_too_early = client.patch("/api/v1/driver/deliveries/" + order_three["id"] + "/status", headers=driver_headers, json={"status": "delivered"})
    assert delivered_too_early.status_code == 400
    assert delivered_too_early.json()["detail"]["code"] == "INVALID_ORDER_TRANSITION"

    receipt_too_early = client.post("/api/v1/driver/deliveries/" + order_three["id"] + "/received", headers=driver_headers)
    assert receipt_too_early.status_code == 403
    assert receipt_too_early.json()["detail"]["code"] == "FORBIDDEN"

    reassigned = client.patch("/api/v1/business/orders/" + order_three["id"] + "/driver", headers=sales_headers, json={"driverId": driver_b_id})
    assert reassigned.status_code == 200, reassigned.text
    assert reassigned.json()["assignedDriverId"] == driver_b_id
    old_driver_after_reassign = client.get("/api/v1/driver/deliveries/" + order_three["id"], headers=driver_headers)
    assert old_driver_after_reassign.status_code == 404
    new_driver_after_reassign = client.get("/api/v1/driver/deliveries/" + order_three["id"], headers=driver_b_headers)
    assert new_driver_after_reassign.status_code == 200
    driver_b_notifications = client.get("/api/v1/notifications", headers=driver_b_headers)
    assert driver_b_notifications.status_code == 200
    assert any(item["type"] == "driver_delivery_reassigned" and item["orderId"] == order_three["id"] for item in driver_b_notifications.json()["items"])

    out_for_delivery = client.patch("/api/v1/driver/deliveries/" + order_one["id"] + "/status", headers=driver_headers, json={"status": "out_for_delivery"})
    assert out_for_delivery.status_code == 200, out_for_delivery.text
    delivered = client.patch("/api/v1/driver/deliveries/" + order_one["id"] + "/status", headers=driver_headers, json={"status": "delivered"})
    assert delivered.status_code == 200, delivered.text
    received = client.post("/api/v1/driver/deliveries/" + order_one["id"] + "/received", headers=driver_headers)
    assert received.status_code == 403, received.text
    received = client.post("/api/v1/orders/" + order_one["id"] + "/received", headers=customer_headers)
    assert received.status_code == 200, received.text
    assert received.json()["status"] == "received"
    assert received.json()["customerReceivedByUserId"] == order_one["customerId"]

def test_audit_system_settings_and_pricing_permissions(client):
    _create_account(Role.SALES_MANAGER, "0712000002", "sales@example.com", "NELMA Sales")
    _create_account(Role.SYSTEM_ADMIN, "0712000003", "admin@example.com", "NELMA Admin")
    _, sales_headers = _dashboard_login(client, "0712000002")
    _, admin_headers = _dashboard_login(client, "0712000003")

    pricing = client.patch("/api/v1/admin/pricing/refill", headers=sales_headers, json={"price": 2500})
    assert pricing.status_code == 200, pricing.text
    assert client.get("/api/v1/settings/public").json()["products"]["refill"]["unitPrice"] == 2500

    business = {"name": "NELMA", "supportPhone": "+255700000000", "supportEmail": "help@nelma.co.tz", "address": "Arusha", "operatingHours": "07:00 - 20:00"}
    sales_system = client.patch("/api/v1/admin/settings", headers=sales_headers, json={"business": business})
    assert sales_system.status_code == 403

    admin_system = client.patch("/api/v1/admin/settings", headers=admin_headers, json={"business": business})
    assert admin_system.status_code == 200, admin_system.text
    assert client.get("/api/v1/settings/public").json()["support"]["email"] == "help@nelma.co.tz"

    sales_audit = client.get("/api/v1/audit-logs", headers=sales_headers)
    assert sales_audit.status_code == 403

    admin_audit = client.get("/api/v1/audit-logs", headers=admin_headers)
    assert admin_audit.status_code == 200
    assert {entry["eventType"] for entry in admin_audit.json()} >= {"PRODUCT_UPDATED", "SYSTEM_SETTING_UPDATED"}

