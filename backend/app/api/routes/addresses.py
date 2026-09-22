from fastapi import APIRouter, Response, status

from app.api.dependencies import CurrentUser, DbSession
from app.schemas.address import AddressCreate, AddressRead, AddressUpdate
from app.services.address_service import address_service

router = APIRouter(tags=["Delivery Addresses"])


@router.get("/users/me/addresses", response_model=list[AddressRead], include_in_schema=False)
@router.get("/addresses", response_model=list[AddressRead], summary="List saved delivery addresses")
def list_addresses(user: CurrentUser, db: DbSession) -> list[AddressRead]:
    return address_service.list(db, user)


@router.post("/users/me/addresses", response_model=AddressRead, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/addresses", response_model=AddressRead, status_code=status.HTTP_201_CREATED, summary="Create a saved delivery address")
def create_address(data: AddressCreate, user: CurrentUser, db: DbSession) -> AddressRead:
    return address_service.create(db, user, data)


@router.get("/addresses/{address_id}", response_model=AddressRead, summary="Read a saved delivery address")
def get_address(address_id: str, user: CurrentUser, db: DbSession) -> AddressRead:
    return address_service.get(db, user, address_id)


@router.patch("/users/me/addresses/{address_id}", response_model=AddressRead, include_in_schema=False)
@router.patch("/addresses/{address_id}", response_model=AddressRead, summary="Update a saved delivery address")
def update_address(address_id: str, data: AddressUpdate, user: CurrentUser, db: DbSession) -> AddressRead:
    return address_service.update(db, user, address_id, data)


@router.delete("/users/me/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT, include_in_schema=False)
@router.delete("/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a saved delivery address")
def delete_address(address_id: str, user: CurrentUser, db: DbSession) -> Response:
    address_service.delete(db, user, address_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
