from tests.conftest import address_payload, create_address, register_customer


def test_create_list_update_delete_default_address(client):
    _, headers = register_customer(client)
    home = create_address(client, headers)
    assert home["isDefault"] is True
    assert home["phone"] == "+255712345678"
    work = create_address(
        client, headers, label="Work", area="Mikocheni", isDefault=True, latitude=None, longitude=None
    )
    assert work["isDefault"] is True
    addresses = client.get("/api/v1/addresses", headers=headers).json()
    assert addresses[0]["id"] == work["id"]
    assert addresses[1]["isDefault"] is False

    updated = client.patch("/api/v1/addresses/" + home["id"], headers=headers, json={"area": "Kijitonyama", "isDefault": True})
    assert updated.status_code == 200
    assert updated.json()["area"] == "Kijitonyama"
    addresses = client.get("/api/v1/addresses", headers=headers).json()
    assert addresses[0]["id"] == home["id"]

    deleted = client.delete("/api/v1/addresses/" + home["id"], headers=headers)
    assert deleted.status_code == 204
    remaining = client.get("/api/v1/addresses", headers=headers).json()
    assert len(remaining) == 1
    assert remaining[0]["isDefault"] is True


def test_address_ownership_is_enforced(client):
    _, headers_a = register_customer(client, phone="0712345678", email="a@example.com")
    address = create_address(client, headers_a)
    _, headers_b = register_customer(client, phone="0712345679", email="b@example.com")
    assert client.get("/api/v1/addresses/" + address["id"], headers=headers_b).status_code == 404
    assert client.patch("/api/v1/addresses/" + address["id"], headers=headers_b, json={"area": "Other"}).status_code == 404
    assert client.delete("/api/v1/addresses/" + address["id"], headers=headers_b).status_code == 404


def test_coordinate_validation_and_manual_address_without_gps(client):
    _, headers = register_customer(client)
    invalid = address_payload(latitude=-91)
    response = client.post("/api/v1/addresses", json=invalid, headers=headers)
    assert response.status_code == 422
    manual = create_address(client, headers, latitude=None, longitude=None)
    assert manual["latitude"] is None
    assert manual["longitude"] is None
