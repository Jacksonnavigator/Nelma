import os

os.environ["APP_ENV"] = "test"
os.environ["DEBUG"] = "false"
os.environ["DATABASE_URL"] = os.environ.get("NELMA_TEST_DATABASE_URL", "sqlite:///./test_nelma.db")
os.environ["JWT_SECRET_KEY"] = "test-secret-key-with-enough-length"
os.environ["RATE_LIMIT_ENABLED"] = "false"
os.environ["PAYMENT_PROVIDER"] = "development"
os.environ["NOTIFICATION_PROVIDER"] = "development"

import pytest
from fastapi.testclient import TestClient

import app.models  # noqa: F401
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.main import app as fastapi_app
from app.services.settings_service import settings_service


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        settings_service.seed_defaults(db)
    yield


@pytest.fixture
def client():
    return TestClient(fastapi_app)


def register_customer(client, phone="0712345678", email="customer@example.com", name="Jane Customer"):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "fullName": name,
            "phone": phone,
            "email": email,
            "password": "Password123",
            "confirmPassword": "Password123",
        },
    )
    assert response.status_code == 201, response.text
    session = response.json()
    return session, {"Authorization": "Bearer " + session["tokens"]["accessToken"]}


def address_payload(**overrides):
    payload = {
        "label": "Home",
        "deliveryAddress": "Nelson Mandela African Institute of Science and Technology, Block A",
        "area": "NM-AIST",
        "phone": "0712345678",
        "deliveryInstructions": "Call on arrival",
        "latitude": -3.3995,
        "longitude": 36.7946,
        "isDefault": True,
    }
    payload.update(overrides)
    return payload


def create_address(client, headers, **overrides):
    response = client.post("/api/v1/addresses", json=address_payload(**overrides), headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def create_order(client, headers, order_type="refill", quantity=1, address=None, **overrides):
    if address is None:
        address = create_address(client, headers)
    payload = {
        "orderType": order_type,
        "quantity": quantity,
        "addressId": address["id"],
        "paymentMethodId": "mobile_money",
    }
    payload.update(overrides)
    response = client.post("/api/v1/orders", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()
