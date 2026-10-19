import pytest
from sqlalchemy import select

from app.core import rate_limit
from app.core.config import get_settings
from app.db.session import SessionLocal
from app.models.refresh_session import RefreshSession
from app.services.product_service import _matches_image_signature
from tests.conftest import register_customer

LOGIN = "/api/v1/auth/login"


@pytest.fixture
def limits_on(monkeypatch):
    rate_limit._buckets.clear()
    monkeypatch.setattr(get_settings(), "rate_limit_enabled", True)
    yield
    rate_limit._buckets.clear()


def login(client, password):
    return client.post(LOGIN, json={"identifier": "0712345678", "password": password})


def test_account_locks_after_repeated_wrong_passwords(client, limits_on):
    register_customer(client)
    for _ in range(10):
        assert login(client, "WrongPassword1").status_code == 401
    locked = login(client, "WrongPassword1")
    assert locked.status_code == 429
    assert locked.json()["detail"]["code"] == "ACCOUNT_LOCKED"
    # Even the right password is refused while locked, so guessing cannot succeed by luck.
    assert login(client, "Password123").status_code == 429


def test_successful_login_resets_the_failure_count(client, limits_on):
    register_customer(client)
    for _ in range(9):
        assert login(client, "WrongPassword1").status_code == 401
    assert login(client, "Password123").status_code == 200
    for _ in range(9):
        assert login(client, "WrongPassword1").status_code == 401
    assert login(client, "Password123").status_code == 200


def test_unknown_account_gets_the_same_error_as_a_wrong_password(client):
    register_customer(client)
    unknown = client.post(LOGIN, json={"identifier": "0799999999", "password": "Password123"})
    wrong = login(client, "WrongPassword1")
    assert unknown.status_code == wrong.status_code == 401
    assert unknown.json() == wrong.json()


def test_reusing_a_refreshed_token_signs_the_account_out_everywhere(client):
    session, _ = register_customer(client)
    old_refresh = session["tokens"]["refreshToken"]
    renewed = client.post("/api/v1/auth/refresh", json={"refreshToken": old_refresh})
    assert renewed.status_code == 200
    new_refresh = renewed.json()["tokens"]["refreshToken"]
    # A second use of the old token means a copy was stolen: both copies must stop working.
    assert client.post("/api/v1/auth/refresh", json={"refreshToken": old_refresh}).status_code == 401
    assert client.post("/api/v1/auth/refresh", json={"refreshToken": new_refresh}).status_code == 401
    with SessionLocal() as db:
        assert all(row.revoked_at is not None for row in db.scalars(select(RefreshSession)))


def test_reset_code_cannot_be_guessed(client, limits_on):
    register_customer(client)
    code = client.post("/api/v1/auth/forgot-password", json={"identifier": "0712345678"}).json()["resetToken"]
    body = {"identifier": "0712345678", "newPassword": "NewPassword123", "confirmPassword": "NewPassword123"}
    wrong = "000000" if code != "000000" else "000001"
    for _ in range(5):
        assert client.post("/api/v1/auth/reset-password", json={**body, "resetToken": wrong}).status_code == 400
    locked = client.post("/api/v1/auth/reset-password", json={**body, "resetToken": wrong})
    assert locked.status_code == 429
    assert locked.json()["detail"]["code"] == "RESET_LOCKED"
    # The real code was voided by the lockout, so a lucky guess on the last try does not help either.
    assert client.post("/api/v1/auth/reset-password", json={**body, "resetToken": code}).status_code in {400, 429}


def test_internal_token_must_match_exactly(client):
    url = "/api/v1/internal/orders/missing/status"
    body = {"status": "confirmed"}
    assert client.patch(url, json=body).status_code == 403
    assert client.patch(url, json=body, headers={"X-Internal-Admin-Token": ""}).status_code == 403
    assert client.patch(url, json=body, headers={"X-Internal-Admin-Token": "wrong"}).status_code == 403


def test_responses_carry_security_headers_and_api_is_not_cached(client):
    health = client.get("/health")
    assert health.headers["x-content-type-options"] == "nosniff"
    assert health.headers["x-frame-options"] == "DENY"
    assert health.headers["referrer-policy"] == "no-referrer"
    assert "frame-ancestors 'none'" in health.headers["content-security-policy"]
    assert client.get("/api/v1/settings/public").headers["cache-control"] == "no-store"


def test_oversized_requests_are_refused_before_they_are_read(client):
    response = client.post(LOGIN, content=b"{}", headers={"Content-Length": str(50 * 1024 * 1024), "Content-Type": "application/json"})
    assert response.status_code == 413
    assert response.json()["detail"]["code"] == "PAYLOAD_TOO_LARGE"


def test_uploaded_images_must_really_be_images():
    assert _matches_image_signature("image/png", b"\x89PNG\r\n\x1a\n" + b"x" * 20)
    assert _matches_image_signature("image/jpeg", b"\xff\xd8\xff\xe0" + b"x" * 20)
    assert _matches_image_signature("image/webp", b"RIFF\x00\x00\x00\x00WEBPVP8 ")
    # An HTML page or script renamed as an image is rejected, as is a real PNG labelled as a JPEG.
    assert not _matches_image_signature("image/png", b"<html><script>alert(1)</script></html>")
    assert not _matches_image_signature("image/jpeg", b"\x89PNG\r\n\x1a\n" + b"x" * 20)
    assert not _matches_image_signature("image/gif", b"GIF89a")
