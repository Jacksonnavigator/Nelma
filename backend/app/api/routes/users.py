from fastapi import APIRouter, Response, status

from app.api.dependencies import CurrentUser, DbSession
from app.schemas.auth import ChangePasswordRequest
from app.schemas.user import PushTokenCreate, PushTokenRead, UserRead, UserUpdate
from app.services.user_service import user_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserRead, summary="Read current customer profile")
def me(user: CurrentUser) -> UserRead:
    return user_service.read_current(user)


@router.patch("/me", response_model=UserRead, summary="Update current customer profile")
def update_me(data: UserUpdate, user: CurrentUser, db: DbSession) -> UserRead:
    return user_service.update_profile(db, user, data)


@router.patch("/me/security", status_code=status.HTTP_204_NO_CONTENT, summary="Change current customer password")
def change_password(data: ChangePasswordRequest, user: CurrentUser, db: DbSession) -> Response:
    user_service.change_password(db, user, data)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/me/push-tokens", response_model=PushTokenRead, status_code=status.HTTP_201_CREATED, summary="Register a future Expo push token"
)
def add_push_token(data: PushTokenCreate, user: CurrentUser, db: DbSession) -> PushTokenRead:
    return user_service.add_push_token(db, user, data)


@router.delete("/me/push-tokens/{token_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Deactivate a push token")
def delete_push_token(token_id: str, user: CurrentUser, db: DbSession) -> Response:
    user_service.delete_push_token(db, user, token_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
