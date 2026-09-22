from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class PaymentInitialization:
    provider_reference: str
    status: str


class PaymentProvider(Protocol):
    name: str

    def initialize_payment(self, *, order_id: str, amount: int, currency: str, method: str) -> PaymentInitialization:
        raise NotImplementedError

    def get_payment_status(self, provider_reference: str) -> str:
        raise NotImplementedError

    def process_callback(self, payload: dict, headers: dict[str, str]) -> dict:
        raise NotImplementedError
