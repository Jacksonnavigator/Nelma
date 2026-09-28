import secrets

from fastapi import status
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.core.permissions import Permission, authorize
from app.core.roles import Role
from app.core.security import hash_password, verify_password
from app.models.address import Address
from app.models.device_push_token import DevicePushToken
from app.models.order import Order
from app.models.refresh_session import RefreshSession
from app.models.user import User
from app.repositories.users import UserRepository
from app.schemas.auth import ChangePasswordRequest
from app.schemas.user import PushTokenCreate, PushTokenRead, UserRead, UserUpdate
from app.services.audit_service import audit_service
from app.services.serializers import iso, user_to_read
from app.utils.phone import normalize_tanzanian_phone

repo = UserRepository()


class UserService:
    def read_current(self, user: User) -> UserRead:
        return user_to_read(user)

    def update_profile(self, db: Session, user: User, data: UserUpdate) -> UserRead:
        authorize(user, Permission.PROFILE_UPDATE_SELF)
        payload = data.model_dump(exclude_unset=True)
        if "full_name" in payload and payload["full_name"] is not None:
            user.full_name = payload["full_name"].strip()
        if "phone" in payload and payload["phone"] is not None:
            phone = normalize_tanzanian_phone(payload["phone"])
            existing = repo.get_by_phone(db, phone)
            if existing and existing.id != user.id:
                raise AppException("PHONE_ALREADY_EXISTS", "An account already exists with this phone number.", status.HTTP_409_CONFLICT)
            user.phone = phone
        if "email" in payload:
            email = str(payload["email"]).lower() if payload["email"] else None
            if email:
                existing = repo.get_by_email(db, email)
                if existing and existing.id != user.id:
                    raise AppException(
                        "EMAIL_ALREADY_EXISTS", "An account already exists with this email address.", status.HTTP_409_CONFLICT
                    )
            user.email = email
        if "avatar_url" in payload:
            user.avatar_url = payload["avatar_url"]
        if "preferred_language" in payload and payload["preferred_language"] is not None:
            user.preferred_language = payload["preferred_language"]
        if "address_location_preference" in payload and payload["address_location_preference"] is not None:
            user.address_location_preference = payload["address_location_preference"]
        if "notification_preferences" in payload and payload["notification_preferences"] is not None:
            incoming = data.notification_preferences.model_dump(by_alias=True) if data.notification_preferences else {}
            # Assign a new dict: changing the stored one in place is invisible to SQLAlchemy and never saved.
            user.notification_preferences = {**(user.notification_preferences or {}), **incoming}
        db.commit()
        db.refresh(user)
        return user_to_read(user)

    def change_password(self, db: Session, user: User, data: ChangePasswordRequest) -> None:
        authorize(user, Permission.PROFILE_UPDATE_SELF)
        if not verify_password(data.current_password, user.password_hash):
            raise AppException("INVALID_PASSWORD", "Current password is incorrect.", status.HTTP_400_BAD_REQUEST)
        user.password_hash = hash_password(data.new_password)
        db.execute(delete(RefreshSession).where(RefreshSession.user_id == user.id))
        db.commit()

    def delete_account(self, db: Session, user: User, password: str) -> None:
        """Close a customer's account for good.

        Personal details are wiped and sign-in stops working. Past orders stay, without the name, phone or
        email attached to the account, because NELMA must keep its sales and cash records.
        """
        if user.role != Role.USER:
            raise AppException("FORBIDDEN", "Staff and driver accounts are closed by an administrator.", status.HTTP_403_FORBIDDEN)
        if not verify_password(password, user.password_hash):
            raise AppException("INVALID_PASSWORD", "Password is incorrect.", status.HTTP_400_BAD_REQUEST)
        open_order = db.scalar(
            select(Order.id).where(Order.user_id == user.id, Order.status.in_(("pending", "confirmed", "processing", "out_for_delivery")))
        )
        if open_order:
            raise AppException(
                "OPEN_ORDER", "You have an order in progress. Wait until it is delivered or cancel it first.", status.HTTP_409_CONFLICT
            )
        user.full_name = "Deleted customer"
        user.phone = "deleted-" + user.id.replace("-", "")[:14]
        user.email = None
        user.avatar_url = None
        user.is_active = False
        user.password_hash = hash_password(secrets.token_urlsafe(32))
        db.execute(delete(Address).where(Address.user_id == user.id))
        db.execute(delete(RefreshSession).where(RefreshSession.user_id == user.id))
        db.execute(update(DevicePushToken).where(DevicePushToken.user_id == user.id).values(is_active=False))
        audit_service.record(db, actor=user, event_type="ACCOUNT_DELETED", resource_type="user", resource_id=user.id)
        db.commit()

    def add_push_token(self, db: Session, user: User, data: PushTokenCreate) -> PushTokenRead:
        existing = db.scalar(select(DevicePushToken).where(DevicePushToken.token == data.token))
        if existing:
            existing.user_id = user.id
            existing.platform = data.platform
            existing.is_active = True
            token = existing
        else:
            token = DevicePushToken(user_id=user.id, token=data.token, platform=data.platform, is_active=True)
            db.add(token)
        db.commit()
        db.refresh(token)
        return PushTokenRead(
            id=token.id, token=token.token, platform=token.platform, is_active=token.is_active, created_at=iso(token.created_at) or ""
        )

    def delete_push_token(self, db: Session, user: User, token_id: str) -> None:
        token = db.scalar(select(DevicePushToken).where(DevicePushToken.id == token_id, DevicePushToken.user_id == user.id))
        if token is None:
            raise AppException("PUSH_TOKEN_NOT_FOUND", "Push token not found.", status.HTTP_404_NOT_FOUND)
        token.is_active = False
        db.commit()


user_service = UserService()
