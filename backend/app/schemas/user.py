from typing import Literal

from pydantic import AliasChoices, ConfigDict, EmailStr, Field, field_validator

from app.schemas.common import CamelModel

LanguagePreference = Literal["en", "sw"]
AddressLocationPreference = Literal["single", "multiple"]
UserRole = Literal["USER", "DRIVER", "SALES_MANAGER", "SYSTEM_ADMIN"]
DashboardAccountRole = Literal["SALES_MANAGER", "SYSTEM_ADMIN"]


class NotificationPreferences(CamelModel):
    order_updates: bool = Field(True, validation_alias=AliasChoices("orderUpdates", "order_updates"))
    payment_updates: bool = Field(True, validation_alias=AliasChoices("paymentUpdates", "payment_updates"))
    promotions: bool = False
    system_announcements: bool = Field(True, validation_alias=AliasChoices("systemAnnouncements", "system_announcements"))


class UserRead(CamelModel):
    id: str
    full_name: str = Field(validation_alias=AliasChoices("fullName", "full_name"))
    phone: str
    email: str | None = None
    role: UserRole = "USER"
    is_active: bool = Field(True, validation_alias=AliasChoices("isActive", "is_active"))
    avatar_url: str | None = Field(None, validation_alias=AliasChoices("avatarUrl", "avatar_url"))
    preferred_language: LanguagePreference = Field("en", validation_alias=AliasChoices("preferredLanguage", "preferred_language"))
    address_location_preference: AddressLocationPreference = Field(
        "single",
        validation_alias=AliasChoices("addressLocationPreference", "address_location_preference"),
    )
    notification_preferences: NotificationPreferences = Field(
        default_factory=NotificationPreferences,
        validation_alias=AliasChoices("notificationPreferences", "notification_preferences"),
    )
    created_at: str = Field(validation_alias=AliasChoices("createdAt", "created_at"))


class UserUpdate(CamelModel):
    full_name: str | None = Field(None, min_length=2, max_length=160, validation_alias=AliasChoices("fullName", "full_name"))
    phone: str | None = Field(None, min_length=9, max_length=24)
    email: EmailStr | None = None
    avatar_url: str | None = Field(None, max_length=500, validation_alias=AliasChoices("avatarUrl", "avatar_url"))
    preferred_language: LanguagePreference | None = Field(None, validation_alias=AliasChoices("preferredLanguage", "preferred_language"))
    address_location_preference: AddressLocationPreference | None = Field(
        None,
        validation_alias=AliasChoices("addressLocationPreference", "address_location_preference"),
    )
    notification_preferences: NotificationPreferences | None = Field(
        None,
        validation_alias=AliasChoices("notificationPreferences", "notification_preferences"),
    )

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, value: object) -> object:
        if value == "":
            return None
        return value


class AccountCreate(CamelModel):
    model_config = CamelModel.model_config | ConfigDict(extra="forbid")

    full_name: str = Field(min_length=2, max_length=160, validation_alias=AliasChoices("fullName", "full_name"))
    phone: str = Field(min_length=9, max_length=24)
    email: EmailStr | None = None
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, value: object) -> object:
        if value == "":
            return None
        return value


class DriverCreate(AccountCreate):
    pass


class DashboardAccountCreate(AccountCreate):
    role: DashboardAccountRole


class AccountUpdate(CamelModel):
    full_name: str | None = Field(None, min_length=2, max_length=160, validation_alias=AliasChoices("fullName", "full_name"))
    phone: str | None = Field(None, min_length=9, max_length=24)
    email: EmailStr | None = None

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, value: object) -> object:
        if value == "":
            return None
        return value


class PushTokenCreate(CamelModel):
    token: str = Field(min_length=10, max_length=500)
    platform: str = Field(min_length=2, max_length=40)


class PushTokenRead(CamelModel):
    id: str
    token: str
    platform: str
    is_active: bool = Field(validation_alias=AliasChoices("isActive", "is_active"))
    created_at: str = Field(validation_alias=AliasChoices("createdAt", "created_at"))
