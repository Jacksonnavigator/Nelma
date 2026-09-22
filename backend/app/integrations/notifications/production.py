"""Password reset delivery. Never logs credentials, destinations or reset codes."""

import smtplib
import ssl
from email.message import EmailMessage

import httpx

from app.core.config import Settings
from app.core.exceptions import AppException


class ProductionNotificationProvider:
    name = "smtp_twilio"

    def __init__(self, settings: Settings):
        self.settings = settings

    def send_password_reset(self, *, destination: str, reset_code: str) -> None:
        text = f"Your NELMA password reset code is {reset_code}. It expires in {self.settings.password_reset_expire_minutes} minutes. If you did not request this, ignore this message."
        try:
            if "@" in destination:
                self._email(destination, text)
            else:
                self._sms(destination, text)
        except (smtplib.SMTPException, OSError, httpx.HTTPError, ValueError, KeyError) as exc:
            raise AppException(
                "RESET_DELIVERY_FAILED", "Unable to send the reset code. Please try again later or contact support.", 503
            ) from exc

    def _email(self, destination: str, body: str) -> None:
        cfg = self.settings
        message = EmailMessage()
        message["From"] = str(cfg.smtp_from_email)
        message["To"] = destination
        message["Subject"] = "NELMA password reset"
        message.set_content(body)
        context = ssl.create_default_context()
        if cfg.smtp_security == "ssl":
            connection = smtplib.SMTP_SSL(cfg.smtp_host, cfg.smtp_port, timeout=cfg.notification_timeout_seconds, context=context)
        else:
            connection = smtplib.SMTP(cfg.smtp_host, cfg.smtp_port, timeout=cfg.notification_timeout_seconds)
        with connection as smtp:
            if cfg.smtp_security == "starttls":
                smtp.ehlo()
                smtp.starttls(context=context)
                smtp.ehlo()
            if cfg.smtp_username:
                smtp.login(cfg.smtp_username, cfg.smtp_password)
            refused = smtp.send_message(message)
            if refused:
                raise smtplib.SMTPRecipientsRefused(refused)

    def _sms(self, destination: str, body: str) -> None:
        cfg = self.settings
        payload = {"To": destination, "Body": body}
        if cfg.twilio_messaging_service_sid:
            payload["MessagingServiceSid"] = cfg.twilio_messaging_service_sid
        else:
            payload["From"] = cfg.twilio_from_number
        response = httpx.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{cfg.twilio_account_sid}/Messages.json",
            data=payload,
            auth=(cfg.twilio_account_sid, cfg.twilio_auth_token),
            timeout=cfg.notification_timeout_seconds,
            follow_redirects=False,
        )
        response.raise_for_status()
        result = response.json()
        if not isinstance(result, dict) or not result.get("sid") or result.get("status") in {"failed", "undelivered", "canceled"}:
            raise ValueError("SMS provider did not accept the message")
