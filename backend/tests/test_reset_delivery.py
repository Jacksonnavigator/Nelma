import re
import smtplib
from unittest.mock import MagicMock

import httpx
import pytest
from pydantic import ValidationError
from sqlalchemy import func, select

from app.core.config import Settings, get_settings
from app.core.exceptions import AppException
from app.db.session import SessionLocal
from app.integrations.notifications.production import ProductionNotificationProvider
from app.models.password_reset import PasswordResetToken
from tests.conftest import register_customer


def configure(monkeypatch):
    cfg = get_settings()
    values = {
        "notification_provider": "smtp_twilio",
        "smtp_host": "smtp.example.com",
        "smtp_from_email": "reset@example.com",
        "smtp_username": "mailer",
        "smtp_password": "secret",
        "smtp_security": "starttls",
        "twilio_account_sid": "AC" + "1" * 32,
        "twilio_auth_token": "token",
        "twilio_from_number": "+15551234567",
        "twilio_messaging_service_sid": "",
    }
    for key, value in values.items():
        monkeypatch.setattr(cfg, key, value)
    return cfg


def test_smtp_reset_flow_tls_stored_address_and_resend(client, monkeypatch):
    register_customer(client)
    cfg = configure(monkeypatch)
    smtp = MagicMock()
    smtp.__enter__.return_value = smtp
    smtp.send_message.return_value = {}
    factory = MagicMock(return_value=smtp)
    monkeypatch.setattr("app.integrations.notifications.production.smtplib.SMTP", factory)
    tokens = []
    for _ in range(2):
        response = client.post("/api/v1/auth/forgot-password", json={"identifier": "CUSTOMER@example.com"})
        assert response.status_code == 200, response.text
        assert response.json()["resetToken"] is None
        message = smtp.send_message.call_args.args[0]
        assert message["To"] == "customer@example.com"
        assert message["From"] == "reset@example.com"
        tokens.append(re.search(r"code is (\d+)", message.get_content()).group(1))
    smtp.starttls.assert_called()
    smtp.login.assert_called_with("mailer", "secret")
    factory.assert_called_with(cfg.smtp_host, cfg.smtp_port, timeout=cfg.notification_timeout_seconds)
    payload = {
        "identifier": "customer@example.com",
        "resetToken": tokens[0],
        "newPassword": "NewPassword123",
        "confirmPassword": "NewPassword123",
    }
    assert client.post("/api/v1/auth/reset-password", json=payload).status_code == 400
    payload["resetToken"] = tokens[1]
    assert client.post("/api/v1/auth/reset-password", json=payload).status_code == 204
    assert client.post("/api/v1/auth/reset-password", json=payload).status_code == 400
    assert client.post("/api/v1/auth/login", json={"identifier": "customer@example.com", "password": "NewPassword123"}).status_code == 200


def test_sms_routes_to_normalized_stored_phone_and_hides_code(client, monkeypatch):
    register_customer(client)
    cfg = configure(monkeypatch)
    post = MagicMock(
        return_value=httpx.Response(
            201, json={"sid": "SM-test", "status": "queued"}, request=httpx.Request("POST", "https://api.twilio.com")
        )
    )
    monkeypatch.setattr("app.integrations.notifications.production.httpx.post", post)
    response = client.post("/api/v1/auth/forgot-password", json={"identifier": "0712345678"})
    assert response.status_code == 200
    assert response.json()["resetToken"] is None
    call = post.call_args
    assert call.kwargs["data"]["To"] == "+255712345678"
    assert call.kwargs["data"]["From"] == cfg.twilio_from_number
    assert call.kwargs["auth"] == (cfg.twilio_account_sid, cfg.twilio_auth_token)
    code = re.search(r"code is (\d+)", call.kwargs["data"]["Body"]).group(1)
    assert (
        client.post(
            "/api/v1/auth/reset-password",
            json={"identifier": "0712345678", "resetToken": code, "newPassword": "NewPassword123", "confirmPassword": "NewPassword123"},
        ).status_code
        == 204
    )


def test_delivery_failure_rolls_back_and_unknown_accounts_send_nothing(client, monkeypatch):
    register_customer(client)
    configure(monkeypatch)
    smtp = MagicMock(side_effect=smtplib.SMTPException("provider secret error"))
    monkeypatch.setattr("app.integrations.notifications.production.smtplib.SMTP", smtp)
    assert client.post("/api/v1/auth/forgot-password", json={"identifier": "unknown@example.com"}).status_code == 200
    smtp.assert_not_called()
    response = client.post("/api/v1/auth/forgot-password", json={"identifier": "customer@example.com"})
    assert response.status_code == 503
    assert "provider secret" not in response.text
    with SessionLocal() as db:
        assert db.scalar(select(func.count()).select_from(PasswordResetToken)) == 0


def test_sms_failure_is_sanitized_and_service_sid_supported(monkeypatch):
    cfg = configure(monkeypatch)
    monkeypatch.setattr(cfg, "twilio_messaging_service_sid", "MG" + "2" * 32)
    post = MagicMock(
        return_value=httpx.Response(401, json={"message": "credentials secret"}, request=httpx.Request("POST", "https://api.twilio.com"))
    )
    monkeypatch.setattr("app.integrations.notifications.production.httpx.post", post)
    with pytest.raises(AppException) as error:
        ProductionNotificationProvider(cfg).send_password_reset(destination="+255712345678", reset_code="123456")
    assert error.value.status_code == 503
    assert "secret" not in error.value.message
    assert post.call_args.kwargs["data"]["MessagingServiceSid"] == cfg.twilio_messaging_service_sid
    assert "From" not in post.call_args.kwargs["data"]


def test_smtp_ssl_and_configuration_validation(monkeypatch):
    cfg = configure(monkeypatch)
    monkeypatch.setattr(cfg, "smtp_security", "ssl")
    smtp = MagicMock()
    smtp.__enter__.return_value = smtp
    smtp.send_message.return_value = {}
    factory = MagicMock(return_value=smtp)
    monkeypatch.setattr("app.integrations.notifications.production.smtplib.SMTP_SSL", factory)
    ProductionNotificationProvider(cfg).send_password_reset(destination="customer@example.com", reset_code="123456")
    factory.assert_called_once()
    smtp.starttls.assert_not_called()
    with pytest.raises(ValidationError):
        Settings(_env_file=None, notification_provider="smtp_twilio", smtp_host="", smtp_from_email=None)


def test_cash_only_production_configuration_does_not_require_mobile_money():
    config = Settings(
        _env_file=None,
        app_env="production",
        debug=False,
        database_url="postgresql+psycopg://user:pass@db/nelma",
        jwt_secret_key="x" * 40,
        internal_admin_token="y" * 40,
        cors_origins=["https://admin.example.com"],
        payment_provider="cash",
        payment_provider_api_key=None,
        payment_provider_merchant_id=None,
        payment_provider_webhook_secret=None,
        notification_provider="smtp_twilio",
        smtp_host="smtp.example.com",
        smtp_from_email="reset@example.com",
        twilio_account_sid="AC" + "1" * 32,
        twilio_auth_token="token",
        twilio_from_number="+15551234567",
    )
    assert config.payment_provider == "cash"


def test_cash_only_methods_and_initialization(client, monkeypatch):
    from tests.conftest import create_order

    _, customer = register_customer(client)
    monkeypatch.setattr(get_settings(), "payment_provider", "cash")
    methods = client.get("/api/v1/payments/methods").json()
    assert next(m for m in methods if m["id"] == "mobile_money")["enabled"] is False
    order = create_order(client, customer, paymentMethodId="cash")
    response = client.post("/api/v1/payments/initialize", headers=customer, json={"orderId": order["id"], "methodId": "cash"})
    assert response.status_code == 201, response.text
    assert response.json()["status"] == "pending"
    assert (
        client.post(
            "/api/v1/payments/webhooks/cash", json={"providerReference": response.json()["providerReference"], "status": "paid"}
        ).status_code
        == 403
    )
    assert (
        client.post("/api/v1/payments/initialize", headers=customer, json={"orderId": order["id"], "methodId": "mobile_money"}).status_code
        == 422
    )


def test_reset_submission_rate_limit(client, monkeypatch):
    from app.core.rate_limit import _buckets

    _buckets.clear()
    monkeypatch.setattr(get_settings(), "rate_limit_enabled", True)
    for _ in range(10):
        assert (
            client.post(
                "/api/v1/auth/reset-password",
                json={
                    "identifier": "missing@example.com",
                    "resetToken": "123456",
                    "newPassword": "Password123",
                    "confirmPassword": "Password123",
                },
            ).status_code
            == 400
        )
    assert (
        client.post(
            "/api/v1/auth/reset-password",
            json={
                "identifier": "missing@example.com",
                "resetToken": "123456",
                "newPassword": "Password123",
                "confirmPassword": "Password123",
            },
        ).status_code
        == 429
    )
    _buckets.clear()
