import logging

logger = logging.getLogger(__name__)


class DevelopmentNotificationProvider:
    name = "development"

    def send_password_reset(self, *, destination: str, reset_code: str) -> None:
        logger.info("Development password reset code generated")

    def send_push(self, *, token: str, title: str, body: str) -> None:
        logger.info("Development push skipped")
