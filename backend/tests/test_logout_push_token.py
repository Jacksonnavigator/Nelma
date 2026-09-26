from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.device_push_token import DevicePushToken
from tests.conftest import register_customer


def _active(token):
    with SessionLocal() as db:
        return db.scalar(select(DevicePushToken.is_active).where(DevicePushToken.token == token))


def test_logout_switches_off_this_devices_push_token(client):
    session, headers = register_customer(client)
    token = "ExponentPushToken[this-phone]"
    assert client.post("/api/v1/users/me/push-tokens", headers=headers, json={"token": token, "platform": "android"}).status_code == 201

    response = client.post("/api/v1/auth/logout", json={"refreshToken": session["tokens"]["refreshToken"], "pushToken": token})
    assert response.status_code == 204
    assert _active(token) is False


def test_logout_cannot_switch_off_another_accounts_token(client):
    _, owner = register_customer(client)
    other_session, _ = register_customer(client, phone="0713000000", email="other@example.com", name="Other")
    token = "ExponentPushToken[owner-phone]"
    client.post("/api/v1/users/me/push-tokens", headers=owner, json={"token": token, "platform": "ios"})

    client.post("/api/v1/auth/logout", json={"refreshToken": other_session["tokens"]["refreshToken"], "pushToken": token})
    assert _active(token) is True


def test_logout_without_a_push_token_still_works(client):
    session, _ = register_customer(client)
    assert client.post("/api/v1/auth/logout", json={"refreshToken": session["tokens"]["refreshToken"]}).status_code == 204
