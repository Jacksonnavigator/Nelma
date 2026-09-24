from app.core.roles import Role
from tests.test_role_authorization import _create_account, _dashboard_login


def _login(client, path, identifier, password):
    return client.post(path, json={"identifier": identifier, "password": password})


def test_admin_created_driver_can_sign_in_to_the_mobile_app(client):
    _create_account(Role.SYSTEM_ADMIN, "0712000002", "admin@example.com")
    _, admin = _dashboard_login(client, "admin@example.com")

    # Same payload the admin "Add driver" form sends (camelCase, no email).
    created = client.post("/api/v1/admin/drivers", headers=admin, json={"fullName": "Juma Kileo", "phone": "+255 712 345 678", "password": "DriverPass123"})
    assert created.status_code == 201, created.text

    for identifier in ("+255712345678", "0712345678", "712345678"):
        response = _login(client, "/api/v1/auth/login", identifier, "DriverPass123")
        assert response.status_code == 200, (identifier, response.text)
        session = response.json()
        assert session["user"]["role"] == "DRIVER"
        headers = {"Authorization": "Bearer " + session["tokens"]["accessToken"]}
        assert client.get("/api/v1/driver/deliveries", headers=headers).status_code == 200

    assert _login(client, "/api/v1/auth/login", "0712345678", "wrong-password").status_code == 401
    # Drivers are mobile-only accounts and cannot use the admin dashboard.
    assert _login(client, "/api/v1/auth/dashboard/login", "0712345678", "DriverPass123").status_code == 403


def test_deactivated_driver_cannot_sign_in(client):
    _create_account(Role.SYSTEM_ADMIN, "0712000002", "admin@example.com")
    _, admin = _dashboard_login(client, "admin@example.com")
    created = client.post("/api/v1/admin/drivers", headers=admin, json={"fullName": "Asha Driver", "phone": "0713456789", "password": "DriverPass123"})
    assert created.status_code == 201, created.text
    driver_id = created.json()["id"]

    assert client.post(f"/api/v1/drivers/{driver_id}/deactivate", headers=admin).status_code == 200
    assert _login(client, "/api/v1/auth/login", "0713456789", "DriverPass123").status_code == 401
    assert client.post(f"/api/v1/drivers/{driver_id}/activate", headers=admin).status_code == 200
    assert _login(client, "/api/v1/auth/login", "0713456789", "DriverPass123").status_code == 200


def test_driver_creation_rejects_a_phone_already_registered_as_a_customer(client):
    _create_account(Role.SYSTEM_ADMIN, "0712000002", "admin@example.com")
    _create_account(Role.USER, "0714567890", "customer@example.com")
    _, admin = _dashboard_login(client, "admin@example.com")
    response = client.post("/api/v1/admin/drivers", headers=admin, json={"fullName": "Same Person", "phone": "0714567890", "password": "DriverPass123"})
    assert response.status_code == 409, response.text
