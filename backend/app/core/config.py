import json
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal

from pydantic import EmailStr, Field, field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "NELMA API"
    app_env: Literal["development", "test", "production"] = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"

    database_url: str = "sqlite:///./nelma.db"
    database_pool_size: int = Field(3, ge=1, le=50)
    database_max_overflow: int = Field(2, ge=0, le=50)

    jwt_secret_key: str = "development-only-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30
    password_reset_expire_minutes: int = 15

    notification_provider: Literal["development", "smtp_twilio"] = "development"
    smtp_host: str = ""
    smtp_port: int = Field(587, ge=1, le=65535)
    smtp_username: str = ""
    smtp_password: str = Field("", repr=False)
    smtp_from_email: EmailStr | None = None
    smtp_security: Literal["starttls", "ssl"] = "starttls"
    notification_timeout_seconds: float = Field(10, gt=0, le=60)
    twilio_account_sid: str = ""
    twilio_auth_token: str = Field("", repr=False)
    twilio_from_number: str = ""
    twilio_messaging_service_sid: str = ""

    first_purchase_price: int = 18000
    refill_price: int = 4000
    currency: str = "TZS"
    max_order_quantity: int = 50

    payment_provider: str = "development"
    payment_provider_api_key: str | None = None
    payment_provider_merchant_id: str | None = None
    payment_provider_webhook_secret: str | None = None
    development_webhook_secret: str = "development-webhook-secret"

    cors_origins: Annotated[list[str], NoDecode] = Field(default_factory=list)
    rate_limit_enabled: bool = True
    trust_proxy_headers: bool = False
    internal_admin_token: str = "development-internal-admin-token"

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("smtp_from_email", mode="before")
    @classmethod
    def empty_sender(cls, value):
        return value or None

    @field_validator("database_url", mode="before")
    @classmethod
    def postgres_driver(cls, value: str) -> str:
        # Supabase supplies a plain PostgreSQL URI; use the installed Psycopg 3 driver.
        for prefix in ("postgres://", "postgresql://"):
            if value.startswith(prefix):
                return "postgresql+psycopg://" + value[len(prefix):]
        return value

    @field_validator("debug", "rate_limit_enabled", "trust_proxy_headers", mode="before")
    @classmethod
    def parse_boolish(cls, value: object) -> object:
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in {"release", "production", "prod", "false", "0", "no", "off"}:
                return False
            if lowered in {"debug", "development", "dev", "true", "1", "yes", "on"}:
                return True
        return value

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str] | None) -> list[str]:
        if value is None or value == "":
            return []
        if isinstance(value, list):
            return value
        if value.strip().startswith("["):
            return json.loads(value)
        return [origin.strip() for origin in value.split(",") if origin.strip()]

    @property
    def development_cors_origin_regex(self) -> str | None:
        if self.app_env != "development":
            return None
        # Browser/Expo origins on this machine or an RFC1918 development LAN.
        octet = r"(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)"
        host = (
            r"localhost|127\.0\.0\.1|\[::1\]|"
            rf"10\.{octet}\.{octet}\.{octet}|"
            rf"192\.168\.{octet}\.{octet}|"
            rf"172\.(?:1[6-9]|2\d|3[01])\.{octet}\.{octet}"
        )
        return rf"(?:https?|exp|exps)://(?:{host})(?::\d+)?"

    @field_validator("first_purchase_price", "refill_price", "max_order_quantity")
    @classmethod
    def positive_integer(cls, value: int) -> int:
        if value < 1:
            raise ValueError("must be positive")
        return value

    @model_validator(mode="after")
    def reject_insecure_production_configuration(self) -> "Settings":
        if self.notification_provider == "smtp_twilio":
            if not self.smtp_host or not self.smtp_from_email:
                raise ValueError("SMTP_HOST and SMTP_FROM_EMAIL are required")
            if bool(self.smtp_username) != bool(self.smtp_password):
                raise ValueError("Configure both SMTP_USERNAME and SMTP_PASSWORD or neither for an authenticated relay")
            import re

            if not re.fullmatch(r"AC[0-9a-fA-F]{32}", self.twilio_account_sid) or not self.twilio_auth_token:
                raise ValueError("Valid TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required")
            if not self.twilio_from_number and not self.twilio_messaging_service_sid:
                raise ValueError("Configure TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID")
            if self.twilio_from_number and not re.fullmatch(r"\+[1-9]\d{7,14}", self.twilio_from_number):
                raise ValueError("TWILIO_FROM_NUMBER must be in E.164 format")
            if self.twilio_messaging_service_sid and not re.fullmatch(r"MG[0-9a-fA-F]{32}", self.twilio_messaging_service_sid):
                raise ValueError("TWILIO_MESSAGING_SERVICE_SID must be a valid Messaging Service SID")
        if self.app_env == "production":
            if self.notification_provider == "development":
                raise ValueError("Production password resets require NOTIFICATION_PROVIDER=smtp_twilio")
            if self.debug:
                raise ValueError("DEBUG must be false in production")
            if self.jwt_secret_key in {"", "development-only-change-me", "change-me"} or len(self.jwt_secret_key) < 32:
                raise ValueError("JWT_SECRET_KEY must be configured securely in production")
            if self.database_url.startswith("sqlite"):
                raise ValueError("Production DATABASE_URL must use a production database such as PostgreSQL")
            if self.payment_provider == "development":
                raise ValueError("PAYMENT_PROVIDER=development is not allowed in production")
            if self.payment_provider != "cash" and (
                not self.payment_provider_api_key or not self.payment_provider_merchant_id or not self.payment_provider_webhook_secret
            ):
                raise ValueError("Production payment provider credentials must be configured")
            if not self.cors_origins or "*" in self.cors_origins:
                raise ValueError("Explicit non-wildcard CORS origins are required in production")
            if self.internal_admin_token in {"", "development-internal-admin-token", "change-me"} or len(self.internal_admin_token) < 32:
                raise ValueError("INTERNAL_ADMIN_TOKEN must be configured securely in production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
