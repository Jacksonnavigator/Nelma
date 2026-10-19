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
    "acceptedTerms": True,
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

    message = {"name": "Baraka", "email": "baraka@example.com", "message": "Do you deliver to Moshi?", "acceptedTerms": True}
    assert client.post("/api/v1/website/contact", json=message).status_code == 201
    assert client.post("/api/v1/website/contact", json={**message, "website": "http://spam.example"}).status_code == 201
    assert client.post("/api/v1/website/contact", json={**message, "message": "hi"}).status_code == 422
    with SessionLocal() as db:
        assert db.query(WebsiteRequest).count() == 1
        assert db.query(WebsiteRequest).one().kind == "contact"


def test_website_forms_require_the_age_and_agreement_confirmation(client):
    message = {"name": "Baraka", "email": "baraka@example.com", "message": "Do you deliver to Moshi?"}
    without = {key: value for key, value in ORDER.items() if key != "acceptedTerms"}
    # Missing, unticked or anything other than a real true: refused, for both forms.
    for payload, path in ((without, "/api/v1/website/orders"), (message, "/api/v1/website/contact")):
        assert client.post(path, json=payload).status_code == 422
        assert client.post(path, json={**payload, "acceptedTerms": False}).status_code == 422
        assert client.post(path, json={**payload, "acceptedTerms": None}).status_code == 422
    # A bot that fills the hidden field is still told nothing useful, and nothing is stored.
    with SessionLocal() as db:
        assert db.query(WebsiteRequest).count() == 0


def test_website_forms_only_accept_real_looking_values(client):
    url = "/api/v1/website/orders"
    for bad_name in ("1234", "   ", "<script>alert(1)</script>", "Amina\x00Joseph", "_x", "!!"):
        assert client.post(url, json={**ORDER, "name": bad_name}).status_code == 422, bad_name
    for bad_company in ("<b>Shop</b>", "---", "!!!"):
        assert client.post(url, json={**ORDER, "company": bad_company}).status_code == 422, bad_company
    assert client.post(url, json={**ORDER, "area": "<>"}).status_code == 422
    assert client.post(url, json={**ORDER, "instructions": "gate\x07code"}).status_code == 422
    assert client.post("/api/v1/website/contact", json={"name": "Baraka", "email": "b@example.com", "message": "?????", "acceptedTerms": True}).status_code == 422
    assert client.post("/api/v1/website/contact", json={"name": "Baraka", "email": "b@example.com", "message": "x" * 2001, "acceptedTerms": True}).status_code == 422

    # Real names with apostrophes, hyphens, dots and non-English letters still go through, tidied up.
    good = client.post(url, json={**ORDER, "name": "  Mary-Ann   O'Neil Jr. ", "company": "  Njiro   Cafe 2 "})
    assert good.status_code == 201, good.text
    with SessionLocal() as db:
        row = db.query(WebsiteRequest).one()
        assert (row.name, row.company) == ("Mary-Ann O'Neil Jr.", "Njiro Cafe 2")
    assert client.post(url, json={**ORDER, "name": "Zuhura Mwalímu"}).status_code == 201


def test_website_requests_are_staff_only(client):
    _, mobile = register_customer(client)
    assert client.get("/api/v1/admin/website-requests").status_code == 401
    assert client.get("/api/v1/admin/website-requests", headers=mobile).status_code in {401, 403}
    _, _, _, _, _, sales = staff(client)
    assert client.post("/api/v1/admin/website-requests/missing/status", headers=sales, json={"status": "handled"}).status_code == 404


def test_public_website_forms_work_from_any_website_domain(client):
    # The website may be hosted on a domain missing from CORS_ORIGINS; its forms must still go through.
    origin = "https://nelma-website.example.org"
    for path in ("/api/v1/website/orders", "/api/v1/website/contact", "/api/v1/settings/public"):
        preflight = client.options(
            path,
            headers={"Origin": origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type"},
        )
        assert preflight.status_code == 204, (path, preflight.text)
        assert preflight.headers["access-control-allow-origin"] == "*"
        assert "content-type" in preflight.headers["access-control-allow-headers"].lower()

    sent = client.post("/api/v1/website/orders", json=ORDER, headers={"Origin": origin})
    assert sent.status_code == 201, sent.text
    assert sent.headers["access-control-allow-origin"] == "*"
    assert "access-control-allow-credentials" not in sent.headers

    # Staff and customer endpoints keep the strict list: an unknown site gets no CORS approval.
    private = client.options(
        "/api/v1/auth/login",
        headers={"Origin": origin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type"},
    )
    assert private.headers.get("access-control-allow-origin") not in ("*", origin)
