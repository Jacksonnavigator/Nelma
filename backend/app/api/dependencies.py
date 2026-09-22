from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, Header, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.exceptions import AppException
from app.core.permissions import Permission, authorize
from app.core.roles import SessionAudience, role_allowed_for_audience
from app.core.security import decode_jwt
from app.db.session import get_db
from app.models.user import User
from app.repositories.users import UserRepository

bearer = HTTPBearer(auto_error=False)
user_repo = UserRepository()


def current_settings() -> Settings:
    return get_settings()


def client_ip(request: Request) -> str | None:
    settings = get_settings()
    forwarded = request.headers.get("x-forwarded-for")
    if settings.trust_proxy_headers and forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


def _load_current_user(
    credentials: HTTPAuthorizationCredentials | None,
    db: Session,
    settings: Settings,
    audience: SessionAudience,
) -> User:
    if credentials is None:
        raise AppException("UNAUTHENTICATED", "Authentication is required.", status.HTTP_401_UNAUTHORIZED)
    payload = decode_jwt(credentials.credentials, settings, "access", expected_audience=audience)
    user = user_repo.get(db, str(payload.get("sub")))
    if user is None or not user.is_active:
        raise AppException("UNAUTHENTICATED", "Authentication is required.", status.HTTP_401_UNAUTHORIZED)
    if not role_allowed_for_audience(user.role, audience):
        raise AppException("INVALID_SESSION_AUDIENCE", "Authentication is not valid for this application surface.", status.HTTP_403_FORBIDDEN)
    return user


def get_current_mobile_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(current_settings)],
) -> User:
    return _load_current_user(credentials, db, settings, SessionAudience.MOBILE)


def get_current_dashboard_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(current_settings)],
) -> User:
    return _load_current_user(credentials, db, settings, SessionAudience.DASHBOARD)


def require_permission(permission: Permission, audience: SessionAudience = SessionAudience.MOBILE) -> Callable[..., User]:
    def dependency(
        credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
        db: Annotated[Session, Depends(get_db)],
        settings: Annotated[Settings, Depends(current_settings)],
    ) -> User:
        user = _load_current_user(credentials, db, settings, audience)
        authorize(user, permission)
        return user

    return dependency


def require_internal_admin(
    settings: Annotated[Settings, Depends(current_settings)],
    x_internal_admin_token: Annotated[str | None, Header(alias="X-Internal-Admin-Token")] = None,
) -> None:
    if x_internal_admin_token != settings.internal_admin_token:
        raise AppException("INTERNAL_FORBIDDEN", "Internal operation is not allowed.", status.HTTP_403_FORBIDDEN)


CurrentUser = Annotated[User, Depends(get_current_mobile_user)]
DashboardUser = Annotated[User, Depends(get_current_dashboard_user)]
DbSession = Annotated[Session, Depends(get_db)]
IdempotencyKey = Annotated[str | None, Header(alias="Idempotency-Key")]
InternalAdmin = Annotated[None, Depends(require_internal_admin)]

