from typing import Literal

from pydantic import EmailStr, Field, field_validator

from app.schemas.dashboard import StrictModel


class _WebsiteForm(StrictModel):
    # Hidden field real people never see or fill. Bots that fill every input are quietly ignored.
    website: str | None = Field(None, max_length=200)

    @field_validator("*", mode="before")
    @classmethod
    def blank_is_none(cls, value):
        return None if isinstance(value, str) and not value.strip() else value


class WebsiteContactInput(_WebsiteForm):
    name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    phone: str | None = Field(None, max_length=32)
    message: str = Field(min_length=5, max_length=2000)


class WebsiteOrderInput(_WebsiteForm):
    customer_type: Literal["new", "existing"]
    name: str = Field(min_length=2, max_length=160)
    company: str | None = Field(None, max_length=160)
    email: EmailStr
    phone: str = Field(min_length=9, max_length=32)
    city: str | None = Field(None, max_length=80)
    area: str = Field(min_length=2, max_length=120)
    product_code: str = Field(min_length=2, max_length=32, pattern=r"^[a-z0-9_]+$")
    quantity: int = Field(ge=1, le=500)
    address: str | None = Field(None, max_length=1000)
    instructions: str | None = Field(None, max_length=1000)


class WebsiteRequestStatusInput(StrictModel):
    status: Literal["new", "handled"]
