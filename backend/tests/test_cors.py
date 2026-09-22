import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.api.router import api_router
from app.core.config import Settings, get_settings
from app.main import app, configure_cors


def cors_client(environment="development", origins=None):
    configuration = get_settings().model_copy(update={"app_env": environment, "cors_origins": origins or []})
    application = FastAPI(exception_handlers=app.exception_handlers)
    configure_cors(application, configuration)
    application.include_router(api_router, prefix="/api/v1")
    return TestClient(application)


def preflight(client, path, origin, method="POST"):
    return client.options(path, headers={
        "Origin": origin,
        "Access-Control-Request-Method": method,
        "Access-Control-Request-Headers": "authorization,content-type,idempotency-key",
    })


def test_development_preflights_allow_local_and_lan_origins():
    client = cors_client()
    for origin in ["http://localhost:8081", "http://127.0.0.1:19006", "http://[::1]:8081", "http://192.168.20.7:8081",
                   "https://10.2.3.4:8081", "exp://172.16.2.3:8081", "exps://172.31.2.3:19000"]:
        for path, method in [("/api/v1/auth/register", "POST"), ("/api/v1/settings/public", "GET")]:
            response = preflight(client, path, origin, method)
            assert response.status_code == 200
            assert response.headers["access-control-allow-origin"] == origin
            assert "authorization" in response.headers["access-control-allow-headers"].lower()
            assert "content-type" in response.headers["access-control-allow-headers"].lower()
            assert "Origin" in response.headers["vary"]
    for method in ["OPTIONS", "GET", "HEAD", "POST", "PATCH", "PUT", "DELETE"]:
        assert preflight(client, "/api/v1/auth/register", "http://localhost:8081", method).status_code == 200


def test_development_does_not_allow_arbitrary_external_origins():
    client = cors_client()
    for origin in ["https://evil.example", "null", "http://192.168.1.2.evil.example:8081", "http://172.32.0.1:8081"]:
        response = preflight(client, "/api/v1/auth/register", origin)
        assert response.status_code == 400
        assert "access-control-allow-origin" not in response.headers


def test_production_has_only_explicit_origins():
    client = cors_client("production", ["https://dashboard.nelma.example"])
    assert preflight(client, "/api/v1/auth/register", "https://dashboard.nelma.example").status_code == 200
    for origin in ["http://localhost:8081", "http://192.168.20.7:8081"]:
        assert preflight(client, "/api/v1/auth/register", origin).status_code == 400
    with pytest.raises(ValidationError):
        Settings(app_env="production", cors_origins=["*"])


def test_cors_origin_environment_supports_csv_and_json(monkeypatch):
    for value, expected in [
        ("http://localhost:8081, https://dashboard.example", ["http://localhost:8081", "https://dashboard.example"]),
        ('["https://dashboard.example"]', ["https://dashboard.example"]),
        ("", []),
    ]:
        monkeypatch.setenv("CORS_ORIGINS", value)
        assert Settings(_env_file=None).cors_origins == expected


def test_registration_post_after_preflight_reaches_real_auth_and_keeps_security():
    client = cors_client()
    origin = "http://192.168.20.7:8081"
    assert preflight(client, "/api/v1/auth/register", origin).status_code == 200
    response = client.post("/api/v1/auth/register", headers={"Origin": origin}, json={
        "fullName": "CORS Test User", "phone": "0712345678", "email": "cors@example.com",
        "password": "Password123", "confirmPassword": "Password123",
    })
    assert response.status_code == 201
    assert response.headers["access-control-allow-origin"] == origin
    session = response.json()
    assert session["user"]["role"] == "USER"
    assert session["tokens"]["audience"] == "mobile"
    headers = {"Origin": origin, "Authorization": "Bearer " + session["tokens"]["accessToken"]}
    assert client.get("/api/v1/users/me", headers=headers).json()["role"] == "USER"
    assert client.get("/api/v1/driver/deliveries", headers=headers).status_code == 403


def test_malformed_registration_is_422_with_cors_not_a_preflight_failure():
    client = cors_client()
    origin = "http://localhost:8081"
    response = client.post("/api/v1/auth/register", headers={"Origin": origin}, json={
        "fullName": "Validation Probe", "phone": "0710000999",
        "password": "ProbePassword123", "confirmPassword": "DifferentPassword123",
    })
    assert response.status_code == 422
    assert response.headers["access-control-allow-origin"] == origin
    assert "Passwords must match" in response.text
    assert client.options("/api/v1/auth/register").status_code == 405  # Not a CORS preflight without its headers.
