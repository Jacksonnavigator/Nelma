from pydantic import AliasChoices, Field, field_validator

from app.schemas.common import CamelModel


class DeliveryAddressPayload(CamelModel):
    full_address: str = Field(
        min_length=5,
        max_length=500,
        serialization_alias="deliveryAddress",
        validation_alias=AliasChoices("deliveryAddress", "fullAddress", "full_address"),
    )
    area: str = Field(min_length=2, max_length=120)
    contact_phone: str = Field(
        min_length=9,
        max_length=24,
        serialization_alias="phone",
        validation_alias=AliasChoices("phone", "contactPhone", "contact_phone"),
    )
    delivery_instructions: str | None = Field(
        None,
        max_length=800,
        validation_alias=AliasChoices("deliveryInstructions", "delivery_instructions"),
    )
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)

    @field_validator("delivery_instructions", mode="before")
    @classmethod
    def empty_instructions_to_none(cls, value: object) -> object:
        if value == "":
            return None
        return value


class AddressCreate(DeliveryAddressPayload):
    label: str = Field(min_length=2, max_length=80)
    is_default: bool = Field(False, validation_alias=AliasChoices("isDefault", "is_default"))


class AddressUpdate(CamelModel):
    label: str | None = Field(None, min_length=2, max_length=80)
    full_address: str | None = Field(
        None,
        min_length=5,
        max_length=500,
        serialization_alias="deliveryAddress",
        validation_alias=AliasChoices("deliveryAddress", "fullAddress", "full_address"),
    )
    area: str | None = Field(None, min_length=2, max_length=120)
    contact_phone: str | None = Field(
        None,
        min_length=9,
        max_length=24,
        serialization_alias="phone",
        validation_alias=AliasChoices("phone", "contactPhone", "contact_phone"),
    )
    delivery_instructions: str | None = Field(
        None,
        max_length=800,
        validation_alias=AliasChoices("deliveryInstructions", "delivery_instructions"),
    )
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    is_default: bool | None = Field(None, validation_alias=AliasChoices("isDefault", "is_default"))


class AddressRead(DeliveryAddressPayload):
    id: str
    label: str
    is_default: bool = Field(validation_alias=AliasChoices("isDefault", "is_default"))
    created_at: str = Field(validation_alias=AliasChoices("createdAt", "created_at"))
    updated_at: str = Field(validation_alias=AliasChoices("updatedAt", "updated_at"))
