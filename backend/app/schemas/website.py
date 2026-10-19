import re
from typing import Literal

from pydantic import EmailStr, Field, field_validator

from app.schemas.dashboard import StrictModel

_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
# A person's name: starts with a letter, then letters, spaces, apostrophes, full stops and hyphens.
_PERSON_NAME = re.compile(r"^[^\W\d_](?:[^\W\d_]|[ '.\-])*$")
_HAS_LETTER_OR_DIGIT = re.compile(r"[^\W_]")


def _one_line(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


class _WebsiteForm(StrictModel):
    # Hidden field real people never see or fill. Bots that fill every input are quietly ignored.
    website: str | None = Field(None, max_length=200)
    # The tick-box next to the send button: 18 or older (or a parent's permission) and agreement to the
    # Privacy Policy and Terms. Required, so a request that skips the page and calls the API directly is refused too.
    accepted_terms: bool = Field(...)

    @field_validator("*", mode="before")
    @classmethod
    def blank_is_none(cls, value):
        return None if isinstance(value, str) and not value.strip() else value

    @field_validator("*", mode="after")
    @classmethod
    def no_control_characters(cls, value):
        if isinstance(value, str) and _CONTROL_CHARS.search(value):
            raise ValueError("contains characters that are not allowed")
        return value

    @field_validator("accepted_terms", mode="after")
    @classmethod
    def must_be_accepted(cls, value: bool) -> bool:
        if value is not True:
            raise ValueError("Confirm that you are 18 or older (or have a parent or guardian's permission) and accept the Terms and Privacy Policy.")
        return value

    @field_validator("name", check_fields=False)
    @classmethod
    def real_name(cls, value: str) -> str:
        value = _one_line(value)
        if not _PERSON_NAME.match(value):
            raise ValueError("use letters only in the name")
        return value

    @field_validator("company", "city", "area", check_fields=False)
    @classmethod
    def tidy_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = _one_line(value)
        if not _HAS_LETTER_OR_DIGIT.search(value) or "<" in value or ">" in value:
            raise ValueError("enter a real value")
        return value


class WebsiteContactInput(_WebsiteForm):
    name: str = Field(min_length=2, max_length=160)
    email: EmailStr
    phone: str | None = Field(None, max_length=32)
    message: str = Field(min_length=5, max_length=2000)

    @field_validator("message")
    @classmethod
    def message_has_words(cls, value: str) -> str:
        if not _HAS_LETTER_OR_DIGIT.search(value):
            raise ValueError("write the message in words")
        return value


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
