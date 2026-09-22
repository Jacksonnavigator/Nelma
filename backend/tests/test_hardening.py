from datetime import timedelta

import pytest
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.config import Settings, get_settings
from app.core.security import create_jwt
from app.db.session import SessionLocal
from app.models.address import Address
from app.models.user import User
from tests.conftest import create_address, create_order, register_customer


def _provider_reference(payment: dict) -> str:
    reference = payment.get("providerReference")
    assert reference
    return reference


def test_order_pagination_reports_navigation_metadata(client):
    _, headers = register_customer(client)
    address = create_address(client, headers)
    for quantity in [1, 2, 3]:
        create_order(client, headers, quantity=quantity, address=address)

    first_page = client.get("/api/v1/orders?page=1&page_size=2", headers=headers)
    assert first_page.status_code == 200
    first = first_page.json()
    assert first["total"] == 3
    assert first["page"] == 1
    assert first["pageSize"] == 2
    assert first["totalPages"] == 2
    assert first["hasNext"] is True
    assert first["hasPrevious"] is False
    assert len(first["items"]) == 2

    second_page = client.get("/api/v1/orders?page=2&page_size=2", headers=headers)
    assert second_page.status_code == 200
    second = second_page.json()
    assert second["hasNext"] is False
    assert second["hasPrevious"] is True
    assert len(second["items"]) == 1


def test_notification_pagination_and_read_all(client):
    _, headers = register_customer(client)
    address = create_address(client, headers)
    for _ in range(3):
        create_order(client, headers, address=address)

    response = client.get("/api/v1/notifications?page=1&page_size=2", headers=headers)
    assert response.status_code == 200
    page = response.json()
    assert page["total"] == 3
    assert page["hasNext"] is True
    assert page["hasPrevious"] is False

    read_all = client.post("/api/v1/notifications/read-all", headers=headers)
    assert read_all.status_code == 204
    unread = client.get("/api/v1/notifications", headers=headers).json()
    assert all(item["read"] is True for item in unread["items"])


def test_internal_order_status_transitions_and_delivery_tracking(client):
    _, headers = register_customer(client)
    order = create_order(client, headers)
    internal_headers = {"X-Internal-Admin-Token": get_settings().internal_admin_token}

    forbidden = client.patch("/api/v1/internal/orders/" + order["id"] + "/status", json={"status": "processing"})
    assert forbidden.status_code == 403

    invalid = client.patch("/api/v1/internal/orders/" + order["id"] + "/status", headers=internal_headers, json={"status": "delivered"})
    assert invalid.status_code == 400
    assert invalid.json()["detail"]["code"] == "INVALID_ORDER_TRANSITION"

    for next_status in ["confirmed", "processing", "out_for_delivery", "delivered"]:
        transitioned = client.patch(
            "/api/v1/internal/orders/" + order["id"] + "/status", headers=internal_headers, json={"status": next_status}
        )
        assert transitioned.status_code == 200, transitioned.text
        assert transitioned.json()["status"] == next_status

    delivered = client.get("/api/v1/orders/" + order["id"], headers=headers).json()
    delivered_step = next(item for item in delivered["timeline"] if item["status"] == "delivered")
    received_step = next(item for item in delivered["timeline"] if item["status"] == "received")
    assert delivered_step["completedAt"] is not None
    assert received_step["completedAt"] is None
    assert "mark_received" in delivered["availableActions"]
    assert "cancel" not in delivered["availableActions"]
    assert client.post("/api/v1/orders/" + order["id"] + "/cancel", headers=headers).status_code == 400

    notifications = client.get("/api/v1/notifications", headers=headers).json()
    assert "order_delivered" in {item["type"] for item in notifications["items"]}


def test_cash_payment_webhook_persists_status_failure_and_retry(client):
    _, headers = register_customer(client)
    order = create_order(client, headers, paymentMethodId="cash")

    pending_payment = client.post("/api/v1/payments/initialize", headers=headers, json={"orderId": order["id"], "methodId": "cash"})
    assert pending_payment.status_code == 201
    pending = pending_payment.json()
    assert pending["status"] == "pending"

    duplicate = client.post("/api/v1/payments/initialize", headers=headers, json={"orderId": order["id"], "methodId": "cash"})
    assert duplicate.status_code == 201
    assert duplicate.json()["id"] == pending["id"]

    secret = {"x-development-webhook-secret": get_settings().development_webhook_secret}
    missing_secret = client.post(
        "/api/v1/payments/webhooks/development", json={"providerReference": _provider_reference(pending), "status": "processing"}
    )
    assert missing_secret.status_code == 403

    processing = client.post(
        "/api/v1/payments/webhooks/development",
        headers=secret,
        json={"providerReference": _provider_reference(pending), "status": "processing"},
    )
    assert processing.status_code == 200
    assert processing.json()["status"] == "processing"

    failed = client.post(
        "/api/v1/payments/webhooks/development",
        headers=secret,
        json={"providerReference": _provider_reference(pending), "status": "failed", "failureReason": "Customer unavailable"},
    )
    assert failed.status_code == 200
    assert failed.json()["status"] == "failed"

    fetched = client.get("/api/v1/payments/" + pending["id"], headers=headers).json()
    assert fetched["status"] == "failed"
    assert fetched["failureReason"] == "Customer unavailable"
    assert client.get("/api/v1/orders/" + order["id"], headers=headers).json()["paymentStatus"] == "failed"

    retry = client.post("/api/v1/payments/initialize", headers=headers, json={"orderId": order["id"], "methodId": "cash"})
    assert retry.status_code == 201
    assert retry.json()["id"] != pending["id"]
    assert retry.json()["status"] == "pending"


def test_payment_webhook_idempotency_and_transition_validation(client):
    _, headers = register_customer(client)
    order = create_order(client, headers)
    payment = client.post("/api/v1/payments/initialize", headers=headers, json={"orderId": order["id"], "methodId": "mobile_money"})
    assert payment.status_code == 201
    paid = payment.json()
    assert paid["status"] == "paid"
    secret = {"x-development-webhook-secret": get_settings().development_webhook_secret}

    before_count = client.get("/api/v1/notifications", headers=headers).json()["total"]
    duplicate_paid = client.post(
        "/api/v1/payments/webhooks/development",
        headers=secret,
        json={"providerReference": _provider_reference(paid), "status": "paid"},
    )
    assert duplicate_paid.status_code == 200
    after_count = client.get("/api/v1/notifications", headers=headers).json()["total"]
    assert after_count == before_count

    invalid_transition = client.post(
        "/api/v1/payments/webhooks/development",
        headers=secret,
        json={"providerReference": _provider_reference(paid), "status": "failed"},
    )
    assert invalid_transition.status_code == 400
    assert invalid_transition.json()["detail"]["code"] == "INVALID_PAYMENT_TRANSITION"

    unknown = client.post("/api/v1/payments/webhooks/development", headers=secret, json={"providerReference": "missing", "status": "paid"})
    assert unknown.status_code == 404

    unsupported = client.post(
        "/api/v1/payments/webhooks/development",
        headers=secret,
        json={"providerReference": _provider_reference(paid), "status": "unknown"},
    )
    assert unsupported.status_code == 422


def test_database_foreign_keys_and_single_default_address_constraint(client):
    register_customer(client)
    with SessionLocal() as db:
        missing_user_address = Address(
            user_id="missing-user",
            label="Broken",
            full_address="Unknown",
            area="Nowhere",
            contact_phone="+255700000000",
            is_default=False,
        )
        db.add(missing_user_address)
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()

        user = db.scalar(select(User).where(User.phone == "+255712345678"))
        assert user is not None
        db.add_all(
            [
                Address(
                    user_id=user.id,
                    label="Home",
                    full_address="House 1",
                    area="Sinza",
                    contact_phone="+255712345678",
                    is_default=True,
                ),
                Address(
                    user_id=user.id,
                    label="Work",
                    full_address="Office 2",
                    area="Mikocheni",
                    contact_phone="+255712345678",
                    is_default=True,
                ),
            ]
        )
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()


def test_production_settings_reject_insecure_configuration():
    secure_values = {
        "app_env": "production",
        "notification_provider": "smtp_twilio",
        "smtp_host": "smtp.example.com",
        "smtp_from_email": "reset@example.com",
        "twilio_account_sid": "AC" + "1" * 32,
        "twilio_auth_token": "test-token",
        "twilio_from_number": "+15551234567",
        "debug": False,
        "database_url": "postgresql+psycopg://nelma:secret@db.example.com/nelma",
        "jwt_secret_key": "x" * 40,
        "payment_provider": "external_provider",
        "payment_provider_api_key": "payment-api-key",
        "payment_provider_merchant_id": "nelma-merchant",
        "payment_provider_webhook_secret": "payment-webhook-secret",
        "cors_origins": ["https://app.nelma.example"],
        "internal_admin_token": "y" * 40,
    }
    valid = Settings(**secure_values, _env_file=None)
    assert valid.app_env == "production"

    for override in [
        {"debug": True},
        {"database_url": "sqlite:///./prod.db"},
        {"jwt_secret_key": "development-only-change-me"},
        {"payment_provider": "development"},
        {"payment_provider_api_key": None},
        {"cors_origins": ["*"]},
        {"internal_admin_token": "development-internal-admin-token"},
    ]:
        with pytest.raises(ValidationError):
            Settings(**{**secure_values, **override}, _env_file=None)


def test_expired_access_token_is_rejected(client):
    register_customer(client)
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.phone == "+255712345678"))
        assert user is not None
        user_id = user.id
    expired, _, _ = create_jwt(
        subject=user_id,
        token_type="access",
        settings=get_settings(),
        expires_delta=-timedelta(minutes=1),
    )
    response = client.get("/api/v1/users/me", headers={"Authorization": "Bearer " + expired})
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "TOKEN_EXPIRED"


def test_no_bottle_management_tables_exist():
    forbidden_names = {"bottles", "bottle_inventory", "bottle_exchanges", "bottle_scans"}
    tables = {table.name for table in User.metadata.sorted_tables}
    assert tables.isdisjoint(forbidden_names)
