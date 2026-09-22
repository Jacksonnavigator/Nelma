from fastapi import APIRouter

from app.api.dependencies import DashboardUser, DbSession
from app.schemas.dashboard import DashboardAccountUpdate
from app.schemas.user import DashboardAccountCreate, UserRead
from app.services.account_service import account_service

router = APIRouter(prefix="/admin/accounts", tags=["Admin Accounts"])


@router.get("", response_model=list[UserRead], summary="List dashboard accounts")
def list_dashboard_accounts(user: DashboardUser, db: DbSession) -> list[UserRead]:
    return account_service.list_dashboard_accounts(db, user)


@router.post("", response_model=UserRead, status_code=201, summary="Create a SALES_MANAGER or SYSTEM_ADMIN account")
def create_dashboard_account(data: DashboardAccountCreate, user: DashboardUser, db: DbSession) -> UserRead:
    return account_service.create_dashboard_account(db, user, data)


@router.patch("/{account_id}", response_model=UserRead, summary="Edit non-sensitive dashboard account details")
def update_dashboard_account(account_id: str, data: DashboardAccountUpdate, user: DashboardUser, db: DbSession) -> UserRead:
    return account_service.update_dashboard_account(db, user, account_id, data)


@router.post("/{account_id}/activate", response_model=UserRead, summary="Activate a dashboard account")
def activate_dashboard_account(account_id: str, user: DashboardUser, db: DbSession) -> UserRead:
    return account_service.set_dashboard_account_active(db, user, account_id, True)


@router.post("/{account_id}/deactivate", response_model=UserRead, summary="Deactivate a dashboard account")
def deactivate_dashboard_account(account_id: str, user: DashboardUser, db: DbSession) -> UserRead:
    return account_service.set_dashboard_account_active(db, user, account_id, False)
