from app.db.session import SessionLocal
from app.models.notification import Notification
from app.models.website_request import WebsiteRequest
from tests.conftest import register_customer
from tests.test_dashboard_integration import staff

ORDER = {
    "customerType": "new",
    "name": "Amina Joseph",
    "company": "",
    "email": "Amina@Example.com",
    "phone": "0712 345 999",
    "city": "Arusha",
    "area": "Njiro",
    "productCode": "refill",
    "quantity": 20,
    "address": "Njiro block C, house 12",
    "instructions": "Call at the gate",
}


def test_website_order_request_reaches_staff_and_can_be_handled(client):
    admin_id, sales_id, _, _, admin, sales = staff(client)
    sent = client.post("/api/v1/website/orders", json=ORDER)
    assert sent.status_code == 201, sent.text
    assert sent.json() == {"received": True}
    with SessionLocal() as db:
        assert {n.user_id for n in db.query(Notification).filter(Notification.type == "staff_website_order")} == {admin_id, sales_id}

    listed = client.get("/api/v1/admin/website-requests", headers=sales, params={"kind": "order"}).json()
    assert listed["total"] == 1
    assert listed["newCounts"] == {"order": 1, "contact": 0}
    item = listed["items"][0]
    assert item["phone"] == "+255712345999"
    assert item["email"] == "amina@example.com"
    assert item["company"] is None
    assert (item["productName"], item["quantity"], item["message"]) == ("20L water refill", 20, "Call at the gate")

    done = client.post(f"/api/v1/admin/website-requests/{item['id']}/status", headers=sales, json={"status": "handled"})
    assert done.status_code == 200, done.text
    assert done.json()["status"] == "handled" and done.json()["handledAt"]
    assert client.get("/api/v1/admin/website-requests", headers=admin, params={"status": "new"}).json()["total"] == 0


def test_website_forms_validate_and_ignore_bots(client):
    assert client.post("/api/v1/website/orders", json={**ORDER, "productCode": "no_such_product"}).status_code == 422
    assert client.post("/api/v1/website/orders", json={**ORDER, "phone": "12345"}).status_code == 422
    assert client.post("/api/v1/website/orders", json={**ORDER, "quantity": 0}).status_code == 422
    assert client.post("/api/v1/website/orders", json={**ORDER, "email": "not-an-email"}).status_code == 422

    message = {"name": "Baraka", "email": "baraka@example.com", "message": "Do you deliver to Moshi?"}
    assert client.post("/api/v1/website/contact", json=message).status_code == 201
    assert client.post("/api/v1/website/contact", json={**message, "website": "http://spam.example"}).status_code == 201
    assert client.post("/api/v1/website/contact", json={**message, "message": "hi"}).status_code == 422
    with SessionLocal() as db:
        assert db.query(WebsiteRequest).count() == 1
        assert db.query(WebsiteRequest).one().kind == "contact"


def test_website_requests_are_staff_only(client):
    _, mobile = register_customer(client)
    assert client.get("/api/v1/admin/website-requests").status_code == 401
    assert client.get("/api/v1/admin/website-requests", headers=mobile).status_code in {401, 403}
    _, _, _, _, _, sales = staff(client)
    assert client.post("/api/v1/admin/website-requests/missing/status", headers=sales, json={"status": "handled"}).status_code == 404
