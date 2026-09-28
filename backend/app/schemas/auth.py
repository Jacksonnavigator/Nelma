from datetime import datetime

from pydantic import AliasChoices, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.schemas.address import DeliveryAddressPayload
from app.schemas.common import CamelModel
from app.schemas.user import AddressLocationPreference, LanguagePreference, UserRead


class AuthTokens(CamelModel):
    access_token: str = Field(validation_alias=AliasChoices("accessToken", "access_token"))
    refresh_token: str = Field(validation_alias=AliasChoices("refreshToken", "refresh_token"))
    expires_at: datetime = Field(validation_alias=AliasChoices("expiresAt", "expires_at"))
    audience: str


class AuthSession(CamelModel):
    user: UserRead
    tokens: AuthTokens


class RegisterRequest(CamelModel):
    model_config = CamelModel.model_config | ConfigDict(extra="forbid")

    full_name: str = Field(min_length=2, max_length=160, validation_alias=AliasChoices("fullName", "full_name"))
    phone: str = Field(min_length=9, max_length=24)
    email: EmailStr | None = None
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128, validation_alias=AliasChoices("confirmPassword", "confirm_password"))
    preferred_language: LanguagePreference = Field("en", validation_alias=AliasChoices("preferredLanguage", "preferred_language"))
    address_location_preference: AddressLocationPreference = Field(
        "single",
        validation_alias=AliasChoices("addressLocationPreference", "address_location_preference"),
    )
    signup_address: DeliveryAddressPayload | None = Field(None, validation_alias=AliasChoices("signupAddress", "signup_address"))

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, value: object) -> object:
        if value == "":
            return None
        return value

    @model_validator(mode="after")
    def passwords_match(self) -> "RegisterRequest":
        if self.password != self.confirm_password:
            raise ValueError("Passwords must match")
        return self


class LoginRequest(CamelModel):
    identifier: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)


class RefreshRequest(CamelModel):
    refresh_token: str = Field(min_length=20, validation_alias=AliasChoices("refreshToken", "refresh_token"))


class LogoutRequest(CamelModel):
    refresh_token: str = Field(min_length=20, validation_alias=AliasChoices("refreshToken", "refresh_token"))
    # This device's Expo token, so alerts for the old account stop arriving on a shared phone.
    push_token: str | None = Field(None, max_length=500, validation_alias=AliasChoices("pushToken", "push_token"))


class ForgotPasswordRequest(CamelModel):
    identifier: str = Field(min_length=3, max_length=255)


class ForgotPasswordResponse(CamelModel):
    message: str
    reset_token: str | None = Field(None, validation_alias=AliasChoices("resetToken", "reset_token"))


class ResetPasswordRequest(CamelModel):
    identifier: str = Field(min_length=3, max_length=255)
    reset_token: str = Field(min_length=4, max_length=32, validation_alias=AliasChoices("resetToken", "reset_token"))
    new_password: str = Field(min_length=8, max_length=128, validation_alias=AliasChoices("newPassword", "new_password"))
    confirm_password: str = Field(min_length=8, max_length=128, validation_alias=AliasChoices("confirmPassword", "confirm_password"))

    @model_validator(mode="after")
    def passwords_match(self) -> "ResetPasswordRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords must match")
        return self


class DeleteAccountRequest(CamelModel):
    password: str = Field(min_length=1, max_length=128)


class ChangePasswordRequest(CamelModel):
    current_password: str = Field(min_length=8, max_length=128, validation_alias=AliasChoices("currentPassword", "current_password"))
    new_password: str = Field(min_length=8, max_length=128, validation_alias=AliasChoices("newPassword", "new_password"))
    confirm_password: str = Field(min_length=8, max_length=128, validation_alias=AliasChoices("confirmPassword", "confirm_password"))

    @model_validator(mode="after")
    def passwords_match(self) -> "ChangePasswordRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords must match")
        return self
