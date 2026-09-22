import re

from app.core.exceptions import AppException
from app.core.http_status import HTTP_422_UNPROCESSABLE_CONTENT


def normalize_tanzanian_phone(value: str) -> str:
    digits = re.sub(r"\D", "", value or "")
    digits = digits.removeprefix("00")

    if digits.startswith("255") and len(digits) == 12 and digits[3] in {"6", "7"}:
        return "+" + digits
    if digits.startswith("0") and len(digits) == 10 and digits[1] in {"6", "7"}:
        return "+255" + digits[1:]
    if len(digits) == 9 and digits[0] in {"6", "7"}:
        return "+255" + digits

    raise AppException(
        "INVALID_PHONE",
        "Enter a valid Tanzanian mobile phone number.",
        HTTP_422_UNPROCESSABLE_CONTENT,
    )
