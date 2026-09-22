from fastapi import status

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.integrations.notifications.development import DevelopmentNotificationProvider
from app.integrations.notifications.production import ProductionNotificationProvider


def get_notification_provider():
    settings = get_settings()
    if settings.notification_provider == "smtp_twilio":
        return ProductionNotificationProvider(settings)
    if settings.app_env in {"development", "test"}:
        return DevelopmentNotificationProvider()
    raise AppException(
        "NOTIFICATION_PROVIDER_UNAVAILABLE", "Password reset delivery is not configured.", status.HTTP_500_INTERNAL_SERVER_ERROR
    )
