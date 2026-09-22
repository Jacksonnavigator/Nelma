from fastapi import APIRouter, Depends, Request, Response, status

from app.api.dependencies import DbSession, client_ip
from app.core.rate_limit import rate_limit
from app.core.roles import SessionAudience
from app.schemas.auth import (
    AuthSession,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
)
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=AuthSession,
    status_code=status.HTTP_201_CREATED,
    summary="Register a customer mobile USER account",
    dependencies=[Depends(rate_limit("register", 20, 3600))],
)
def register(data: RegisterRequest, request: Request, db: DbSession) -> AuthSession:
    return auth_service.register(db, data, user_agent=request.headers.get("user-agent"), ip_address=client_ip(request))


@router.post(
    "/login",
    response_model=AuthSession,
    summary="Mobile login for USER and DRIVER accounts",
    dependencies=[Depends(rate_limit("login", 30, 900))],
)
def login(data: LoginRequest, request: Request, db: DbSession) -> AuthSession:
    return auth_service.login(db, data, user_agent=request.headers.get("user-agent"), ip_address=client_ip(request))


@router.post(
    "/dashboard/login",
    response_model=AuthSession,
    summary="Dashboard login for SALES_MANAGER and SYSTEM_ADMIN accounts",
    dependencies=[Depends(rate_limit("dashboard-login", 30, 900))],
)
def dashboard_login(data: LoginRequest, request: Request, db: DbSession) -> AuthSession:
    return auth_service.dashboard_login(db, data, user_agent=request.headers.get("user-agent"), ip_address=client_ip(request))


@router.post("/refresh", response_model=AuthSession, summary="Rotate a mobile refresh token")
def refresh(data: RefreshRequest, request: Request, db: DbSession) -> AuthSession:
    return auth_service.refresh(
        db, data, audience=SessionAudience.MOBILE, user_agent=request.headers.get("user-agent"), ip_address=client_ip(request)
    )


@router.post("/dashboard/refresh", response_model=AuthSession, summary="Rotate a dashboard refresh token")
def dashboard_refresh(data: RefreshRequest, request: Request, db: DbSession) -> AuthSession:
    return auth_service.refresh(
        db, data, audience=SessionAudience.DASHBOARD, user_agent=request.headers.get("user-agent"), ip_address=client_ip(request)
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Revoke a mobile refresh session")
def logout(data: LogoutRequest, db: DbSession) -> Response:
    auth_service.logout(db, data.refresh_token, audience=SessionAudience.MOBILE)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/dashboard/logout", status_code=status.HTTP_204_NO_CONTENT, summary="Revoke a dashboard refresh session")
def dashboard_logout(data: LogoutRequest, db: DbSession) -> Response:
    auth_service.logout(db, data.refresh_token, audience=SessionAudience.DASHBOARD)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    summary="Request password reset code",
    dependencies=[Depends(rate_limit("forgot-password", 10, 3600))],
)
def forgot_password(data: ForgotPasswordRequest, db: DbSession) -> ForgotPasswordResponse:
    return auth_service.forgot_password(db, data)


@router.post(
    "/reset-password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Reset password using a one-time code",
    dependencies=[Depends(rate_limit("reset-password", 10, 900))],
)
def reset_password(data: ResetPasswordRequest, db: DbSession) -> Response:
    auth_service.reset_password(db, data)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# Dashboard sessions remain separate from mobile sessions.
from app.api.dependencies import DashboardUser
from app.schemas.auth import ChangePasswordRequest
from app.schemas.user import UserRead, UserUpdate
from app.services.user_service import user_service


@router.get("/dashboard/me", response_model=UserRead)
def dashboard_me(user: DashboardUser) -> UserRead:
    return user_service.read_current(user)


@router.patch("/dashboard/me", response_model=UserRead)
def update_dashboard_me(data: UserUpdate, user: DashboardUser, db: DbSession) -> UserRead:
    return user_service.update_profile(db, user, data)


@router.patch("/dashboard/security", status_code=204)
def dashboard_password(data: ChangePasswordRequest, user: DashboardUser, db: DbSession) -> Response:
    user_service.change_password(db, user, data)
    return Response(status_code=204)
