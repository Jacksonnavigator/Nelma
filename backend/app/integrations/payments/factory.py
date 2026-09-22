from fastapi import status

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.integrations.payments.cash import CashPaymentProvider
from app.integrations.payments.development import DevelopmentPaymentProvider


def get_payment_provider(provider_name: str | None = None):
    settings = get_settings()
    provider = provider_name or settings.payment_provider
    if provider == "cash":
        return CashPaymentProvider()
    if provider == "development":
        if settings.app_env == "production":
            raise AppException("PAYMENT_PROVIDER_UNAVAILABLE", "Payment provider is not configured.", status.HTTP_500_INTERNAL_SERVER_ERROR)
        return DevelopmentPaymentProvider()
    raise AppException("PAYMENT_PROVIDER_UNAVAILABLE", "Payment provider is not configured.", status.HTTP_500_INTERNAL_SERVER_ERROR)
