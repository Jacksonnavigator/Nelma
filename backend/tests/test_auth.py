from datetime import timedelta

from sqlalchemy import select

from app.core.security import sha256_token, utc_now, verify_password
from app.db.session import SessionLocal
from app.models.password_reset import PasswordResetToken
from app.models.refresh_session import RefreshSession
from app.models.user import User
from tests.conftest import register_customer


def test_registration_success_hashes_password_and_normalizes_phone(client):
    session, _ = register_customer(client, phone="0712345678")
    assert session["user"]["phone"] == "+255712345678"
    assert "accessToken" in session["tokens"]
    assert session["tokens"]["audience"] == "mobile"
    assert session["user"]["role"] == "USER"
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.phone == "+255712345678"))
        assert user is not None
        assert user.password_hash != "Password123"
        assert user.password_hash.startswith(("$argon2", "pbkdf2_sha256$"))
        assert verify_password("Password123", user.password_hash) is True


def test_duplicate_phone_is_rejected(client):
    register_customer(client, phone="0712345678", email="one@example.com")
    response = client.post(
        "/api/v1/auth/register",
        json={
            "fullName": "Other",
            "phone": "+255712345678",
            "email": "two@example.com",
            "password": "Password123",
            "confirmPassword": "Password123",
        },
    )
    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "PHONE_ALREADY_EXISTS"


def test_invalid_phone_is_rejected(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "fullName": "Other",
            "phone": "123456789",
            "email": "x@example.com",
            "password": "Password123",
            "confirmPassword": "Password123",
        },
    )
    assert response.status_code == 422


def test_login_supports_phone_and_email(client):
    register_customer(client, phone="0712345678", email="login@example.com")
    phone_login = client.post("/api/v1/auth/login", json={"identifier": "0712345678", "password": "Password123"})
    assert phone_login.status_code == 200
    assert phone_login.json()["tokens"]["audience"] == "mobile"
    email_login = client.post("/api/v1/auth/login", json={"identifier": "login@example.com", "password": "Password123"})
    assert email_login.status_code == 200
    assert email_login.json()["tokens"]["audience"] == "mobile"


def test_incorrect_password_is_rejected(client):
    register_customer(client)
    response = client.post("/api/v1/auth/login", json={"identifier": "0712345678", "password": "Password124"})
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "INVALID_CREDENTIALS"


def test_refresh_rotates_refresh_session(client):
    session, _ = register_customer(client)
    old_refresh = session["tokens"]["refreshToken"]
    response = client.post("/api/v1/auth/refresh", json={"refreshToken": old_refresh})
    assert response.status_code == 200
    assert response.json()["tokens"]["audience"] == "mobile"
    assert response.json()["tokens"]["refreshToken"] != old_refresh
    reused = client.post("/api/v1/auth/refresh", json={"refreshToken": old_refresh})
    assert reused.status_code == 401


def test_logout_revokes_refresh_token(client):
    session, _ = register_customer(client)
    refresh = session["tokens"]["refreshToken"]
    response = client.post("/api/v1/auth/logout", json={"refreshToken": refresh})
    assert response.status_code == 204
    reused = client.post("/api/v1/auth/refresh", json={"refreshToken": refresh})
    assert reused.status_code == 401


def test_protected_route_requires_token(client):
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401


def test_password_reset_valid_reuse_and_expired_paths(client):
    register_customer(client, phone="0712345678")
    forgot = client.post("/api/v1/auth/forgot-password", json={"identifier": "0712345678"})
    assert forgot.status_code == 200
    reset_token = forgot.json()["resetToken"]
    valid = client.post(
        "/api/v1/auth/reset-password",
        json={"identifier": "0712345678", "resetToken": reset_token, "newPassword": "NewPassword123", "confirmPassword": "NewPassword123"},
    )
    assert valid.status_code == 204
    reused = client.post(
        "/api/v1/auth/reset-password",
        json={"identifier": "0712345678", "resetToken": reset_token, "newPassword": "NewPassword123", "confirmPassword": "NewPassword123"},
    )
    assert reused.status_code == 400

    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.phone == "+255712345678"))
        db.add(PasswordResetToken(user_id=user.id, token_hash=sha256_token("111111"), expires_at=utc_now() - timedelta(minutes=1)))
        db.commit()
    expired = client.post(
        "/api/v1/auth/reset-password",
        json={"identifier": "0712345678", "resetToken": "111111", "newPassword": "NewPassword123", "confirmPassword": "NewPassword123"},
    )
    assert expired.status_code == 400


def test_reset_password_revokes_active_sessions(client):
    session, _ = register_customer(client)
    refresh = session["tokens"]["refreshToken"]
    reset = client.post("/api/v1/auth/forgot-password", json={"identifier": "0712345678"}).json()["resetToken"]
    client.post(
        "/api/v1/auth/reset-password",
        json={"identifier": "0712345678", "resetToken": reset, "newPassword": "NewPassword123", "confirmPassword": "NewPassword123"},
    )
    with SessionLocal() as db:
        session_row = db.scalar(select(RefreshSession).where(RefreshSession.token_hash == sha256_token(refresh)))
        assert session_row.revoked_at is not None


def test_registration_validation_errors_are_json_safe_and_do_not_echo_passwords(client):
    payload = {"fullName": "New User", "phone": "0712345678", "password": "Password123", "confirmPassword": "Different123"}
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "VALIDATION_ERROR"
    assert "Passwords must match" in response.text
    assert "Password123" not in response.text
    assert "Different123" not in response.text
    payload["confirmPassword"] = payload["password"]
    for forbidden in ["role", "audience", "is_active", "is_verified"]:
        response = client.post("/api/v1/auth/register", json={**payload, forbidden: "USER"})
        assert response.status_code == 422
        assert any(error["type"] == "extra_forbidden" for error in response.json()["detail"]["errors"])
