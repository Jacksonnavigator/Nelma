from app.core.roles import Role
from tests.conftest import create_address, create_order, register_customer
from tests.test_dashboard_integration import staff
from tests.test_role_authorization import _create_account

PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="


def test_launch_products_are_seeded_and_public(client):
    products = client.get("/api/v1/settings/public").json()["products"]
    assert list(products) == ["first_purchase", "refill"]
    assert products["first_purchase"]["unitPrice"] == 18000
    assert products["refill"]["unitPrice"] == 4000
    assert "imageUrl" in products["refill"]


def test_new_product_can_be_added_ordered_and_hidden(client):
    _, _, _, _, admin, sales = staff(client)
    created = client.post(
        "/api/v1/admin/products",
        headers=sales,
        json={"name": "10L Water Refill", "description": "Smaller bottle", "price": 2500, "imageUrl": "https://example.com/10l.png"},
    )
    assert created.status_code == 201, created.text
    product = created.json()
    assert product["code"] == "10l_water_refill"
    assert product["isActive"] is True

    public = client.get("/api/v1/settings/public").json()["products"]
    assert public["10l_water_refill"] == {
        "name": "10L Water Refill",
        "unitPrice": 2500,
        "description": "Smaller bottle",
        "imageUrl": "https://example.com/10l.png",
        "sortOrder": 2,
    }

    _, mobile = register_customer(client)
    address = create_address(client, mobile)
    order = create_order(client, mobile, order_type="10l_water_refill", quantity=3, address=address)
    assert order["orderType"] == "10l_water_refill"
    assert order["items"][0]["productName"] == "10L Water Refill"
    assert order["subtotal"] == 7500

    listed = client.get("/api/v1/admin/products", headers=admin).json()
    assert next(p for p in listed if p["code"] == "10l_water_refill")["orderCount"] == 1

    hidden = client.patch(f"/api/v1/admin/products/{product['id']}", headers=sales, json={"isActive": False, "imageUrl": ""})
    assert hidden.status_code == 200, hidden.text
    assert hidden.json()["imageUrl"] is None
    assert "10l_water_refill" not in client.get("/api/v1/settings/public").json()["products"]
    rejected = client.post("/api/v1/orders", headers=mobile, json={"orderType": "10l_water_refill", "quantity": 1, "addressId": address["id"], "paymentMethodId": "mobile_money"})
    assert rejected.status_code == 422
    # The existing order still reads fine after its product is hidden.
    assert client.get(f"/api/v1/orders/{order['id']}", headers=mobile).status_code == 200
    report = client.get("/api/v1/admin/reports/sales", headers=sales, params={"period": "week"}).json()
    assert any(row["product"] == "10l_water_refill" for row in report["productMix"])


def test_product_edits_keep_legacy_price_endpoints_in_step(client):
    _, _, _, _, _, sales = staff(client)
    refill = next(p for p in client.get("/api/v1/admin/products", headers=sales).json() if p["code"] == "refill")
    assert client.patch(f"/api/v1/admin/products/{refill['id']}", headers=sales, json={"price": 4500, "name": "Refill 20L"}).status_code == 200
    assert client.get("/api/v1/settings/public").json()["products"]["refill"] == {
        "name": "Refill 20L",
        "unitPrice": 4500,
        "description": "Fresh drinking water for the NELMA bottle you already have.",
        "imageUrl": None,
        "sortOrder": 1,
    }
    assert next(p for p in client.get("/api/v1/admin/pricing", headers=sales).json() if p["product"] == "refill")["price"] == 4500
    assert client.patch("/api/v1/admin/pricing/refill", headers=sales, json={"price": 4200}).status_code == 200
    assert client.get("/api/v1/settings/public").json()["products"]["refill"]["unitPrice"] == 4200
    assert client.patch("/api/v1/admin/pricing/unknown", headers=sales, json={"price": 4200}).status_code == 404


def test_product_validation_and_permissions(client):
    _, _, _, _, _, sales = staff(client)
    _, mobile = register_customer(client)
    driver_id = _create_account(Role.DRIVER, "0711000009", "driver@example.com")
    assert driver_id
    assert client.get("/api/v1/admin/products", headers=mobile).status_code in {401, 403}
    assert client.post("/api/v1/admin/products", headers=sales, json={"name": "X", "price": 100}).status_code == 422
    assert client.post("/api/v1/admin/products", headers=sales, json={"name": "Free", "price": 0}).status_code == 422
    assert client.post("/api/v1/admin/products", headers=sales, json={"name": "Link", "price": 100, "imageUrl": "http://insecure"}).status_code == 422
    first = client.post("/api/v1/admin/products", headers=sales, json={"name": "Big Jar", "price": 100}).json()
    second = client.post("/api/v1/admin/products", headers=sales, json={"name": "Big Jar", "price": 200}).json()
    assert (first["code"], second["code"]) == ("big_jar", "big_jar_2")
    assert client.patch("/api/v1/admin/products/missing", headers=sales, json={"price": 5}).status_code == 404


def test_image_upload_explains_missing_storage_and_rejects_bad_files(client):
    _, _, _, _, _, sales = staff(client)
    refill = next(p for p in client.get("/api/v1/admin/products", headers=sales).json() if p["code"] == "refill")
    url = f"/api/v1/admin/products/{refill['id']}/image"
    missing = client.post(url, headers=sales, json={"contentType": "image/png", "data": PNG})
    assert missing.status_code == 503
    assert missing.json()["detail"]["code"] == "IMAGE_STORAGE_NOT_CONFIGURED"
    assert client.post(url, headers=sales, json={"contentType": "image/gif", "data": PNG}).status_code == 422


def test_admin_can_list_every_account(client):
    admin_id, _, _, _, admin, sales = staff(client)
    _, mobile = register_customer(client)
    create_order(client, mobile)
    register_customer(client, phone="0712345699", email="second@example.com", name="Second Buyer")
    _create_account(Role.DRIVER, "0711000009", "driver@example.com")

    assert client.get("/api/v1/admin/users", headers=sales).status_code == 403
    everyone = client.get("/api/v1/admin/users", headers=admin).json()
    assert everyone["total"] == 5
    assert everyone["roleCounts"] == {"SYSTEM_ADMIN": 1, "SALES_MANAGER": 1, "USER": 2, "DRIVER": 1}
    created = [row["createdAt"] for row in everyone["items"]]
    assert created == sorted(created, reverse=True)
    assert "password" not in str(everyone)

    customers = client.get("/api/v1/admin/users", headers=admin, params={"role": "USER"}).json()
    assert {row["fullName"] for row in customers["items"]} == {"Jane Customer", "Second Buyer"}
    jane = next(row for row in customers["items"] if row["fullName"] == "Jane Customer")
    assert jane["orderCount"] == 1

    found = client.get("/api/v1/admin/users", headers=admin, params={"search": "second@"}).json()
    assert [row["fullName"] for row in found["items"]] == ["Second Buyer"]
    paged = client.get("/api/v1/admin/users", headers=admin, params={"page_size": 2, "page": 3}).json()
    assert len(paged["items"]) == 1
    assert admin_id
