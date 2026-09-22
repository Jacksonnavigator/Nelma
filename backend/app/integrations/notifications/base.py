from typing import Protocol


class NotificationProvider(Protocol):
    name: str

    def send_password_reset(self, *, destination: str, reset_code: str) -> None:
        raise NotImplementedError

    def send_push(self, *, token: str, title: str, body: str) -> None:
        raise NotImplementedError
