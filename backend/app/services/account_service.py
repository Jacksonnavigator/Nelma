from fastapi import status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.core.permissions import Permission, authorize
from app.core.roles import Role
from app.core.security import hash_password
from app.models.user import User
from app.repositories.users import UserRepository
from app.schemas.dashboard import DashboardAccountUpdate
from app.schemas.user import AccountUpdate, DashboardAccountCreate, DriverCreate, UserRead
from app.services.audit_service import audit_service
from app.services.serializers import user_to_read
from app.utils.phone import normalize_tanzanian_phone

repo = UserRepository()


class AccountService:
    def _email(self, email: object) -> str | None:
        return str(email).lower() if email else None

    def _assert_unique_identity(
        self, db: Session, *, phone: str | None = None, email: str | None = None, current_user_id: str | None = None
    ) -> None:
        if phone:
            existing = repo.get_by_phone(db, phone)
            if existing and existing.id != current_user_id:
                raise AppException("PHONE_ALREADY_EXISTS", "An account already exists with this phone number.", status.HTTP_409_CONFLICT)
        if email:
            existing = repo.get_by_email(db, email)
            if existing and existing.id != current_user_id:
                raise AppException("EMAIL_ALREADY_EXISTS", "An account already exists with this email address.", status.HTTP_409_CONFLICT)

    def _get_user(self, db: Session, user_id: str, *, role: Role | None = None) -> User:
        user = repo.get(db, user_id)
        if user is None or (role is not None and user.role != role):
            raise AppException("ACCOUNT_NOT_FOUND", "Account not found.", status.HTTP_404_NOT_FOUND)
        return user

    def list_drivers(self, db: Session, actor: User) -> list[UserRead]:
        authorize(actor, Permission.DRIVER_MANAGE)
        return [user_to_read(user) for user in repo.list_by_role(db, Role.DRIVER)]

    def create_driver(self, db: Session, actor: User, data: DriverCreate) -> UserRead:
        authorize(actor, Permission.DRIVER_MANAGE)
        phone = normalize_tanzanian_phone(data.phone)
        email = self._email(data.email)
        self._assert_unique_identity(db, phone=phone, email=email)
        driver = User(
            full_name=data.full_name.strip(), phone=phone, email=email, password_hash=hash_password(data.password), role=Role.DRIVER
        )
        try:
            repo.add(db, driver)
            audit_service.record(db, actor=actor, event_type="DRIVER_ACCOUNT_CREATED", resource_type="user", resource_id=driver.id)
            db.commit()
            db.refresh(driver)
            return user_to_read(driver)
        except IntegrityError as exc:
            db.rollback()
            raise AppException("ACCOUNT_ALREADY_EXISTS", "An account already exists with these details.", status.HTTP_409_CONFLICT) from exc

    def get_driver(self, db: Session, actor: User, driver_id: str) -> UserRead:
        authorize(actor, Permission.DRIVER_MANAGE)
        return user_to_read(self._get_user(db, driver_id, role=Role.DRIVER))

    def update_driver(self, db: Session, actor: User, driver_id: str, data: AccountUpdate) -> UserRead:
        authorize(actor, Permission.DRIVER_MANAGE)
        driver = self._get_user(db, driver_id, role=Role.DRIVER)
        self._apply_account_update(db, driver, data)
        audit_service.record(db, actor=actor, event_type="DRIVER_ACCOUNT_UPDATED", resource_type="user", resource_id=driver.id)
        db.commit()
        db.refresh(driver)
        return user_to_read(driver)

    def set_driver_active(self, db: Session, actor: User, driver_id: str, is_active: bool) -> UserRead:
        authorize(actor, Permission.DRIVER_MANAGE)
        driver = self._get_user(db, driver_id, role=Role.DRIVER)
        driver.is_active = is_active
        audit_service.record(
            db,
            actor=actor,
            event_type="DRIVER_ACCOUNT_ACTIVATED" if is_active else "DRIVER_ACCOUNT_DEACTIVATED",
            resource_type="user",
            resource_id=driver.id,
        )
        db.commit()
        db.refresh(driver)
        return user_to_read(driver)

    def list_dashboard_accounts(self, db: Session, actor: User) -> list[UserRead]:
        authorize(actor, Permission.ADMIN_ACCOUNT_MANAGE)
        return [user_to_read(user) for user in repo.list_dashboard_accounts(db)]

    def create_dashboard_account(self, db: Session, actor: User, data: DashboardAccountCreate) -> UserRead:
        authorize(actor, Permission.ADMIN_ACCOUNT_MANAGE)
        role = Role(data.role)
        phone = normalize_tanzanian_phone(data.phone)
        email = self._email(data.email)
        self._assert_unique_identity(db, phone=phone, email=email)
        account = User(full_name=data.full_name.strip(), phone=phone, email=email, password_hash=hash_password(data.password), role=role)
        try:
            repo.add(db, account)
            audit_service.record(
                db,
                actor=actor,
                event_type="ADMIN_ACCOUNT_CREATED",
                resource_type="user",
                resource_id=account.id,
                metadata={"createdRole": role.value},
            )
            db.commit()
            db.refresh(account)
            return user_to_read(account)
        except IntegrityError as exc:
            db.rollback()
            raise AppException("ACCOUNT_ALREADY_EXISTS", "An account already exists with these details.", status.HTTP_409_CONFLICT) from exc

    def update_dashboard_account(self, db: Session, actor: User, account_id: str, data: DashboardAccountUpdate) -> UserRead:
        authorize(actor, Permission.ADMIN_ACCOUNT_MANAGE)
        account = self._get_user(db, account_id)
        if account.role not in {Role.SALES_MANAGER, Role.SYSTEM_ADMIN}:
            raise AppException("ACCOUNT_NOT_FOUND", "Account not found.", status.HTTP_404_NOT_FOUND)
        if data.role is not None and data.role != account.role:
            if actor.id == account.id:
                raise AppException("SELF_ROLE_CHANGE", "You cannot change your own role.", status.HTTP_403_FORBIDDEN)
            account.role = Role(data.role)
        self._apply_account_update(db, account, AccountUpdate.model_validate(data.model_dump(exclude_unset=True, exclude={"role"})))
        audit_service.record(db, actor=actor, event_type="ADMIN_ACCOUNT_UPDATED", resource_type="user", resource_id=account.id)
        db.commit()
        db.refresh(account)
        return user_to_read(account)

    def set_dashboard_account_active(self, db: Session, actor: User, account_id: str, is_active: bool) -> UserRead:
        authorize(actor, Permission.ADMIN_ACCOUNT_MANAGE)
        account = self._get_user(db, account_id)
        if account.role not in {Role.SALES_MANAGER, Role.SYSTEM_ADMIN}:
            raise AppException("ACCOUNT_NOT_FOUND", "Account not found.", status.HTTP_404_NOT_FOUND)
        if not is_active and actor.id == account.id:
            raise AppException("SELF_DEACTIVATION", "You cannot deactivate your own account.", status.HTTP_403_FORBIDDEN)
        account.is_active = is_active
        audit_service.record(
            db,
            actor=actor,
            event_type="ADMIN_ACCOUNT_ACTIVATED" if is_active else "ADMIN_ACCOUNT_DEACTIVATED",
            resource_type="user",
            resource_id=account.id,
        )
        db.commit()
        db.refresh(account)
        return user_to_read(account)

    def _apply_account_update(self, db: Session, account: User, data: AccountUpdate) -> None:
        payload = data.model_dump(exclude_unset=True)
        if "full_name" in payload and payload["full_name"] is not None:
            account.full_name = payload["full_name"].strip()
        if "phone" in payload and payload["phone"] is not None:
            phone = normalize_tanzanian_phone(payload["phone"])
            self._assert_unique_identity(db, phone=phone, current_user_id=account.id)
            account.phone = phone
        if "email" in payload:
            email = self._email(payload["email"])
            self._assert_unique_identity(db, email=email, current_user_id=account.id)
            account.email = email


account_service = AccountService()
