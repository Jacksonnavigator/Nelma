from fastapi import APIRouter, Response, status

from app.api.dependencies import DashboardUser, DbSession
from app.schemas.user import AccountUpdate, DriverCreate, UserRead
from app.services.account_service import account_service

router = APIRouter(prefix="/drivers", tags=["Drivers"])


@router.get("", response_model=list[UserRead], summary="List driver accounts")
def list_drivers(user: DashboardUser, db: DbSession) -> list[UserRead]:
    return account_service.list_drivers(db, user)


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED, summary="Create a DRIVER account")
def create_driver(data: DriverCreate, user: DashboardUser, db: DbSession) -> UserRead:
    return account_service.create_driver(db, user, data)


@router.get("/{driver_id}", response_model=UserRead, summary="Read a DRIVER account")
def get_driver(driver_id: str, user: DashboardUser, db: DbSession) -> UserRead:
    return account_service.get_driver(db, user, driver_id)


@router.patch("/{driver_id}", response_model=UserRead, summary="Edit non-sensitive DRIVER account details")
def update_driver(driver_id: str, data: AccountUpdate, user: DashboardUser, db: DbSession) -> UserRead:
    return account_service.update_driver(db, user, driver_id, data)


@router.post("/{driver_id}/activate", response_model=UserRead, summary="Activate a DRIVER account")
def activate_driver(driver_id: str, user: DashboardUser, db: DbSession) -> UserRead:
    return account_service.set_driver_active(db, user, driver_id, True)


@router.post("/{driver_id}/deactivate", response_model=UserRead, summary="Deactivate a DRIVER account without deleting history")
def deactivate_driver(driver_id: str, user: DashboardUser, db: DbSession) -> UserRead:
    return account_service.set_driver_active(db, user, driver_id, False)


@router.delete("/{driver_id}", status_code=status.HTTP_405_METHOD_NOT_ALLOWED, summary="Driver history is retained; deletion is not supported")
def delete_driver_not_supported(driver_id: str, user: DashboardUser, db: DbSession) -> Response:
    return Response(status_code=status.HTTP_405_METHOD_NOT_ALLOWED)
