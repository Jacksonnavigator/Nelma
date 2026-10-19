from urllib.parse import urlparse

from pydantic import Field, field_validator

from app.schemas.dashboard import StrictModel

# The server will POST to whatever address a browser reports, so only the real browser push services are accepted.
# Anything else (an internal address, a stranger's server) is refused, which also closes off server-side request forgery.
PUSH_SERVICE_HOSTS = (
    "fcm.googleapis.com",  # Chrome, Edge, Brave, Opera and other Chromium browsers
    "push.services.mozilla.com",  # Firefox
    "push.apple.com",  # Safari
    "notify.windows.com",  # Edge/Windows notification service
)


def is_push_service_url(url: str) -> bool:
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    if parsed.scheme != "https" or parsed.username or parsed.password or (parsed.port not in (None, 443)):
        return False
    return any(host == allowed or host.endswith("." + allowed) for allowed in PUSH_SERVICE_HOSTS)


class WebPushKeys(StrictModel):
    p256dh: str = Field(min_length=20, max_length=255)
    auth: str = Field(min_length=8, max_length=255)


class WebPushSubscribeInput(StrictModel):
    endpoint: str = Field(min_length=20, max_length=1000)
    keys: WebPushKeys

    @field_validator("endpoint")
    @classmethod
    def known_push_service(cls, value: str) -> str:
        if not is_push_service_url(value):
            raise ValueError("not a browser push service address")
        return value


class WebPushUnsubscribeInput(StrictModel):
    endpoint: str = Field(min_length=20, max_length=1000)
