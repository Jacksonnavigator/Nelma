from app.core.roles import Role
from app.db.session import SessionLocal
from app.models.notification import Notification
from app.models.user import User
from app.services.notification_service import notification_service
from tests.conftest import create_address, create_order, register_customer
from tests.test_dashboard_integration import staff
from tests.test_role_authorization import _create_account


def _notifications(user_id: str) -> list[str]:
    with SessionLocal() as db:
        return [n.type for n in db.query(Notification).filter(Notification.user_id == user_id)]


def test_customer_messages_reach_staff_and_staff_can_reply(client):
    admin_id, sales_id, _, _, _, sales = staff(client)
    session, mobile = register_customer(client)
    customer_id = session["user"]["id"]
    order = create_order(client, mobile, customerRemarks="Leave it with the guard")

    sent = client.post(f"/api/v1/orders/{order['id']}/messages", headers=mobile, json={"body": "Please call before coming"})
    assert sent.status_code == 200, sent.text
    assert "staff_order_message" in _notifications(sales_id)
    assert "staff_order_message" in _notifications(admin_id)
    assert "staff_order_message" not in _notifications(customer_id)

    detail = client.get(f"/api/v1/admin/orders/{order['id']}", headers=sales).json()
    assert detail["customerRemarks"] == "Leave it with the guard"
    assert [m["body"] for m in detail["messages"]] == ["Leave it with the guard", "Please call before coming"]

    assert client.post(f"/api/v1/admin/orders/{order['id']}/messages", headers=mobile, json={"body": "x"}).status_code in {401, 403}
    reply = client.post(f"/api/v1/admin/orders/{order['id']}/messages", headers=sales, json={"body": "We will call at 10:00"})
    assert reply.status_code == 200, reply.text
    assert reply.json()["messages"][-1] == {**reply.json()["messages"][-1], "sender": "nelma", "body": "We will call at 10:00"}
    assert "order_message_reply" in _notifications(customer_id)
    customer_view = client.get(f"/api/v1/orders/{order['id']}", headers=mobile).json()
    assert customer_view["messages"][-1]["sender"] == "nelma"


def test_staff_can_cancel_an_order_even_on_the_road(client):
    _, _, _, _, admin, sales = staff(client)
    _, mobile = register_customer(client)
    driver_id = _create_account(Role.DRIVER, "0711000009", "driver@example.com")
    order = create_order(client, mobile)
    assigned = client.post(f"/api/v1/admin/deliveries/{order['id']}/assign", headers=sales, json={"driverId": driver_id})
    assert assigned.status_code == 200, assigned.text

    assert client.post(f"/api/v1/admin/orders/{order['id']}/cancel", headers=sales, json={"reason": "x"}).status_code == 422
    cancelled = client.post(f"/api/v1/admin/orders/{order['id']}/cancel", headers=sales, json={"reason": "Customer asked by phone"})
    assert cancelled.status_code == 200, cancelled.text
    assert cancelled.json()["status"] == "cancelled"
    assert cancelled.json()["messages"][-1]["body"] == "Cancelled by NELMA: Customer asked by phone"
    assert "driver_delivery_cancelled" in _notifications(driver_id)
    assert client.get(f"/api/v1/orders/{order['id']}", headers=mobile).json()["status"] == "cancelled"
    again = client.post(f"/api/v1/admin/orders/{order['id']}/cancel", headers=sales, json={"reason": "Twice"})
    assert again.status_code == 409
    # Order handling (cancel, reply) belongs to sales managers, like confirming and dispatching.
    assert client.post(f"/api/v1/admin/orders/{order['id']}/cancel", headers=admin, json={"reason": "Admin"}).status_code == 403


def test_delivery_fees_and_times_come_from_dashboard_settings(client):
    _, _, _, _, admin, _ = staff(client)
    public = client.get("/api/v1/settings/public").json()
    assert public["delivery"]["defaultFee"] == 1500
    assert public["delivery"]["timeWindows"] == ["09:00 - 12:00", "12:00 - 16:00", "16:00 - 19:00"]
    assert public["support"]["phone"]

    _, mobile = register_customer(client)
    # A generic word no longer earns the campus rate: "hostel" in town pays the standard fee.
    town = create_address(client, mobile, label="Town", deliveryAddress="Kijenge hostel block C", area="Arusha")
    assert create_order(client, mobile, address=town)["total"] == 4000 + 1500
    campus = create_address(client, mobile, label="Campus", isDefault=False)
    assert create_order(client, mobile, address=campus)["total"] == 4000

    config = client.get("/api/v1/admin/settings", headers=admin).json()
    config["delivery"]["zones"].append({"id": "njiro", "name": "Njiro", "fee": 700, "keywords": ["Njiro"]})
    config["delivery"]["defaultFee"] = 2000
    config["delivery"]["defaultTimeWindows"] = ["08:00 - 10:00"]
    saved = client.patch("/api/v1/admin/settings", headers=admin, json=config)
    assert saved.status_code == 200, saved.text
    assert saved.json()["delivery"]["zones"][-1]["keywords"] == ["njiro"]

    njiro = create_address(client, mobile, label="Njiro", deliveryAddress="Njiro complex 4A", area="Arusha", isDefault=False)
    assert create_order(client, mobile, address=njiro)["total"] == 4000 + 700
    assert create_order(client, mobile, address=town)["total"] == 4000 + 2000

    # Saving only the windows keeps the zones.
    assert client.patch("/api/v1/admin/settings", headers=admin, json={"delivery": {"defaultTimeWindows": ["08:00 - 10:00", "15:00 - 17:00"]}}).status_code == 200
    assert len(client.get("/api/v1/settings/public").json()["delivery"]["zones"]) == 3

    schedule = {"date": "2030-01-01", "label": "Tomorrow, Morning", "window": "08:00 - 10:00", "slot": "window_0"}
    ok = client.post("/api/v1/orders", headers=mobile, json={"orderType": "refill", "quantity": 1, "addressId": town["id"], "paymentMethodId": "cash", "deliverySchedule": schedule})
    assert ok.status_code == 201, ok.text
    stale = {**schedule, "window": "09:00 - 12:00", "slot": "morning"}
    rejected = client.post("/api/v1/orders", headers=mobile, json={"orderType": "refill", "quantity": 1, "addressId": town["id"], "paymentMethodId": "cash", "deliverySchedule": stale})
    assert rejected.status_code == 422
    assert rejected.json()["detail"]["code"] == "INVALID_DELIVERY_WINDOW"

    duplicate = {**config["delivery"], "zones": [config["delivery"]["zones"][0]] * 2}
    assert client.patch("/api/v1/admin/settings", headers=admin, json={"delivery": duplicate}).status_code == 422


def test_customer_can_delete_their_account(client):
    session, mobile = register_customer(client)
    customer_id = session["user"]["id"]
    order = create_order(client, mobile)

    assert client.post("/api/v1/users/me/delete-account", headers=mobile, json={"password": "Password123"}).status_code == 409
    assert client.post(f"/api/v1/orders/{order['id']}/cancel", headers=mobile).status_code == 200
    assert client.post("/api/v1/users/me/delete-account", headers=mobile, json={"password": "wrong-password"}).status_code == 400
    assert client.post("/api/v1/users/me/delete-account", headers=mobile, json={"password": "Password123"}).status_code == 204

    assert client.get("/api/v1/users/me", headers=mobile).status_code == 401
    assert client.post("/api/v1/auth/login", json={"identifier": "0712345678", "password": "Password123"}).status_code == 401
    with SessionLocal() as db:
        user = db.get(User, customer_id)
        assert (user.full_name, user.email, user.is_active) == ("Deleted customer", None, False)
        assert not user.addresses
    # The phone number is free to register again.
    register_customer(client)

    _, _, _, _, admin, _ = staff(client)
    reopen = client.post(f"/api/v1/admin/users/{customer_id}/status", headers=admin, json={"active": True})
    assert reopen.status_code == 409


def test_admin_can_deactivate_and_reset_any_account(client):
    admin_id, _, _, _, admin, sales = staff(client)
    session, mobile = register_customer(client)
    customer_id = session["user"]["id"]

    assert client.post(f"/api/v1/admin/users/{customer_id}/status", headers=sales, json={"active": False}).status_code == 403
    assert client.post(f"/api/v1/admin/users/{admin_id}/status", headers=admin, json={"active": False}).status_code == 409
    off = client.post(f"/api/v1/admin/users/{customer_id}/status", headers=admin, json={"active": False})
    assert off.status_code == 200, off.text
    assert off.json()["isActive"] is False
    assert client.get("/api/v1/users/me", headers=mobile).status_code == 401
    assert client.post(f"/api/v1/admin/users/{customer_id}/status", headers=admin, json={"active": True}).json()["isActive"] is True

    assert client.post(f"/api/v1/admin/users/{customer_id}/password", headers=admin, json={"password": "short"}).status_code == 422
    assert client.post(f"/api/v1/admin/users/{customer_id}/password", headers=admin, json={"password": "NewPassword9"}).status_code == 204
    assert client.post("/api/v1/auth/login", json={"identifier": "0712345678", "password": "Password123"}).status_code == 401
    assert client.post("/api/v1/auth/login", json={"identifier": "0712345678", "password": "NewPassword9"}).status_code == 200
    assert client.post("/api/v1/admin/users/missing/password", headers=admin, json={"password": "NewPassword9"}).status_code == 404


def test_notification_switches_silence_phone_alerts_only(client):
    session, mobile = register_customer(client)
    customer_id = session["user"]["id"]
    driver_id = _create_account(Role.DRIVER, "0711000009", "driver@example.com")
    with SessionLocal() as db:
        assert notification_service._wants_push(db, customer_id, "order_confirmed") is True
    off = {"notificationPreferences": {"orderUpdates": False, "paymentUpdates": True, "promotions": False, "systemAnnouncements": True}}
    assert client.patch("/api/v1/users/me", headers=mobile, json=off).status_code == 200
    with SessionLocal() as db:
        assert notification_service._wants_push(db, customer_id, "order_confirmed") is False
        assert notification_service._wants_push(db, customer_id, "payment_successful") is True
        assert notification_service._wants_push(db, driver_id, "driver_delivery_assigned") is True
    create_order(client, mobile)
    # The inbox copy is still written.
    assert "order_received" in _notifications(customer_id)
