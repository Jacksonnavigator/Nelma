from datetime import timedelta

from fastapi import status
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AppException
from app.core.roles import Role, SessionAudience, role_allowed_for_audience
from app.core.security import (
    create_jwt,
    decode_jwt,
    ensure_aware,
    generate_reset_code,
    hash_password,
    sha256_token,
    utc_now,
    verify_password,
)
from app.integrations.notifications.factory import get_notification_provider
from app.models.address import Address
from app.models.device_push_token import DevicePushToken
from app.models.password_reset import PasswordResetToken
from app.models.refresh_session import RefreshSession
from app.models.user import User
from app.repositories.users import UserRepository
from app.schemas.auth import (
    AuthSession,
    AuthTokens,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
)
from app.services.audit_service import audit_service
from app.services.serializers import user_to_read
from app.utils.phone import normalize_tanzanian_phone

repo = UserRepository()


class AuthService:
    def _email(self, email: object) -> str | None:
        return str(email).lower() if email else None

    def _find_user_by_identifier(self, db: Session, identifier: str) -> User | None:
        value = identifier.strip().lower()
        if "@" in value:
            return repo.get_by_email(db, value)
        try:
            phone = normalize_tanzanian_phone(value)
        except AppException:
            return None
        return repo.get_by_phone(db, phone)

    def _issue_session(
        self,
        db: Session,
        user: User,
        *,
        audience: SessionAudience,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> AuthSession:
        if not role_allowed_for_audience(user.role, audience):
            raise AppException(
                "INVALID_LOGIN_SURFACE", "This account cannot sign in to this application surface.", status.HTTP_403_FORBIDDEN
            )
        settings = get_settings()
        access_token, access_expires_at, _ = create_jwt(
            subject=user.id,
            token_type="access",
            settings=settings,
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
            audience=audience,
        )
        refresh_token, refresh_expires_at, refresh_jti = create_jwt(
            subject=user.id,
            token_type="refresh",
            settings=settings,
            expires_delta=timedelta(days=settings.refresh_token_expire_days),
            audience=audience,
        )
        session = RefreshSession(
            user_id=user.id,
            token_hash=sha256_token(refresh_token),
            jti=refresh_jti,
            audience=audience,
            expires_at=refresh_expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        db.add(session)
        db.flush()
        return AuthSession(
            user=user_to_read(user),
            tokens=AuthTokens(
                access_token=access_token,
                refresh_token=refresh_token,
                expires_at=access_expires_at,
                audience=audience.value,
            ),
        )

    def _create_signup_address(self, db: Session, user: User, data: RegisterRequest) -> None:
        if data.signup_address is None:
            return
        address = data.signup_address
        db.add(
            Address(
                user_id=user.id,
                label="My location",
                full_address=address.full_address.strip(),
                area=address.area.strip(),
                contact_phone=normalize_tanzanian_phone(address.contact_phone),
                delivery_instructions=(address.delivery_instructions or "").strip() or None,
                latitude=address.latitude,
                longitude=address.longitude,
                is_default=True,
            )
        )

    def register(self, db: Session, data: RegisterRequest, *, user_agent: str | None = None, ip_address: str | None = None) -> AuthSession:
        phone = normalize_tanzanian_phone(data.phone)
        email = self._email(data.email)
        if repo.get_by_phone(db, phone):
            raise AppException("PHONE_ALREADY_EXISTS", "An account already exists with this phone number.", status.HTTP_409_CONFLICT)
        if email and repo.get_by_email(db, email):
            raise AppException("EMAIL_ALREADY_EXISTS", "An account already exists with this email address.", status.HTTP_409_CONFLICT)
        user = User(
            full_name=data.full_name.strip(),
            phone=phone,
            email=email,
            password_hash=hash_password(data.password),
            role=Role.USER,
            preferred_language=data.preferred_language,
            address_location_preference=data.address_location_preference,
        )
        try:
            repo.add(db, user)
            self._create_signup_address(db, user, data)
            audit_service.record(db, actor=None, event_type="USER_REGISTERED", resource_type="user", resource_id=user.id)
            session = self._issue_session(db, user, audience=SessionAudience.MOBILE, user_agent=user_agent, ip_address=ip_address)
            db.commit()
            return session
        except IntegrityError as exc:
            db.rollback()
            raise AppException("ACCOUNT_ALREADY_EXISTS", "An account already exists with these details.", status.HTTP_409_CONFLICT) from exc

    def login(self, db: Session, data: LoginRequest, *, user_agent: str | None = None, ip_address: str | None = None) -> AuthSession:
        user = self._find_user_by_identifier(db, data.identifier)
        if user is None or not user.is_active or not verify_password(data.password, user.password_hash):
            raise AppException("INVALID_CREDENTIALS", "Phone/email or password is incorrect.", status.HTTP_401_UNAUTHORIZED)
        session = self._issue_session(db, user, audience=SessionAudience.MOBILE, user_agent=user_agent, ip_address=ip_address)
        db.commit()
        return session

    def dashboard_login(
        self, db: Session, data: LoginRequest, *, user_agent: str | None = None, ip_address: str | None = None
    ) -> AuthSession:
        user = self._find_user_by_identifier(db, data.identifier)
        if user is None or not user.is_active or not verify_password(data.password, user.password_hash):
            raise AppException("INVALID_CREDENTIALS", "Phone/email or password is incorrect.", status.HTTP_401_UNAUTHORIZED)
        session = self._issue_session(db, user, audience=SessionAudience.DASHBOARD, user_agent=user_agent, ip_address=ip_address)
        db.commit()
        return session

    def refresh(
        self,
        db: Session,
        data: RefreshRequest,
        *,
        audience: SessionAudience = SessionAudience.MOBILE,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> AuthSession:
        settings = get_settings()
        payload = decode_jwt(data.refresh_token, settings, "refresh", expected_audience=audience)
        token_hash = sha256_token(data.refresh_token)
        refresh_session = db.scalar(
            select(RefreshSession).where(RefreshSession.token_hash == token_hash, RefreshSession.jti == payload.get("jti"))
        )
        if refresh_session is None or refresh_session.revoked_at is not None or ensure_aware(refresh_session.expires_at) <= utc_now():
            raise AppException("REFRESH_REVOKED", "Please sign in again.", status.HTTP_401_UNAUTHORIZED)
        if refresh_session.audience != audience:
            raise AppException(
                "INVALID_TOKEN_AUDIENCE", "Authentication is not valid for this application surface.", status.HTTP_401_UNAUTHORIZED
            )
        user = repo.get(db, str(payload.get("sub")))
        if user is None or not user.is_active or not role_allowed_for_audience(user.role, audience):
            raise AppException("INVALID_TOKEN", "Authentication is required.", status.HTTP_401_UNAUTHORIZED)
        new_session = self._issue_session(db, user, audience=audience, user_agent=user_agent, ip_address=ip_address)
        refresh_session.revoked_at = utc_now()
        replacement = db.scalar(select(RefreshSession).where(RefreshSession.token_hash == sha256_token(new_session.tokens.refresh_token)))
        refresh_session.replaced_by_id = replacement.id if replacement else None
        db.commit()
        return new_session

    def logout(
        self, db: Session, refresh_token: str, *, audience: SessionAudience = SessionAudience.MOBILE, push_token: str | None = None
    ) -> None:
        payload = decode_jwt(refresh_token, get_settings(), "refresh", expected_audience=audience)
        session = db.scalar(
            select(RefreshSession).where(RefreshSession.token_hash == sha256_token(refresh_token), RefreshSession.jti == payload.get("jti"))
        )
        if session is None or session.audience != audience:
            return
        if session.revoked_at is None:
            session.revoked_at = utc_now()
        if push_token:
            # Only the signed-out account's own registration is switched off.
            db.execute(
                update(DevicePushToken)
                .where(DevicePushToken.token == push_token, DevicePushToken.user_id == session.user_id)
                .values(is_active=False)
            )
        db.commit()

    def forgot_password(self, db: Session, data: ForgotPasswordRequest) -> ForgotPasswordResponse:
        settings = get_settings()
        user = self._find_user_by_identifier(db, data.identifier)
        message = "If the account exists, a password reset code has been sent."
        if user is None or not user.is_active:
            return ForgotPasswordResponse(message=message)
        reset_code = generate_reset_code()
        db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=sha256_token(reset_code),
                expires_at=utc_now() + timedelta(minutes=settings.password_reset_expire_minutes),
            )
        )
        destination = user.email if "@" in data.identifier else user.phone
        if not destination:
            return ForgotPasswordResponse(message=message)
        try:
            get_notification_provider().send_password_reset(destination=destination, reset_code=reset_code)
        except AppException:
            db.rollback()
            raise
        # A successful resend replaces earlier codes. Failed delivery preserves the previous code.
        db.execute(
            update(PasswordResetToken)
            .where(PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None))
            .values(used_at=utc_now())
        )
        db.commit()
        return ForgotPasswordResponse(
            message=message,
            reset_token=reset_code
            if settings.app_env in {"development", "test"} and settings.notification_provider == "development"
            else None,
        )

    def reset_password(self, db: Session, data: ResetPasswordRequest) -> None:
        user = self._find_user_by_identifier(db, data.identifier)
        if user is None or not user.is_active:
            raise AppException("INVALID_RESET_TOKEN", "The reset code is invalid or expired.", status.HTTP_400_BAD_REQUEST)
        token_hash = sha256_token(data.reset_token)
        reset = db.scalar(
            select(PasswordResetToken)
            .where(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.used_at.is_(None),
            )
            .order_by(PasswordResetToken.created_at.desc())
        )
        if reset is None or ensure_aware(reset.expires_at) <= utc_now():
            raise AppException("INVALID_RESET_TOKEN", "The reset code is invalid or expired.", status.HTTP_400_BAD_REQUEST)
        claimed = db.execute(
            update(PasswordResetToken)
            .where(PasswordResetToken.id == reset.id, PasswordResetToken.used_at.is_(None), PasswordResetToken.expires_at > utc_now())
            .values(used_at=utc_now())
            .execution_options(synchronize_session=False)
        )
        if claimed.rowcount != 1:
            db.rollback()
            raise AppException("INVALID_RESET_TOKEN", "The reset code is invalid or expired.", status.HTTP_400_BAD_REQUEST)
        user.password_hash = hash_password(data.new_password)
        db.execute(
            update(PasswordResetToken)
            .where(PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None))
            .values(used_at=utc_now())
        )
        db.execute(
            update(RefreshSession)
            .where(RefreshSession.user_id == user.id, RefreshSession.revoked_at.is_(None))
            .values(revoked_at=utc_now())
        )
        db.commit()


auth_service = AuthService()
