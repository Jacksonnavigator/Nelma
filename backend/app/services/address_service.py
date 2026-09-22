from fastapi import status
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.core.permissions import Permission, authorize
from app.models.address import Address
from app.models.user import User
from app.repositories.addresses import AddressRepository
from app.schemas.address import AddressCreate, AddressRead, AddressUpdate, DeliveryAddressPayload
from app.services.serializers import address_to_read
from app.utils.phone import normalize_tanzanian_phone

repo = AddressRepository()


class AddressService:
    def list(self, db: Session, user: User) -> list[AddressRead]:
        authorize(user, Permission.ADDRESS_MANAGE_SELF)
        return [address_to_read(address) for address in repo.list_for_user(db, user.id)]

    def get_model(self, db: Session, user: User, address_id: str) -> Address:
        address = repo.get_for_user(db, user.id, address_id)
        if address is None:
            raise AppException("ADDRESS_NOT_FOUND", "Delivery address not found.", status.HTTP_404_NOT_FOUND)
        return address

    def get(self, db: Session, user: User, address_id: str) -> AddressRead:
        authorize(user, Permission.ADDRESS_MANAGE_SELF)
        return address_to_read(self.get_model(db, user, address_id))

    def create(self, db: Session, user: User, data: AddressCreate) -> AddressRead:
        authorize(user, Permission.ADDRESS_MANAGE_SELF)
        should_default = data.is_default or repo.count_for_user(db, user.id) == 0
        if should_default:
            repo.unset_defaults(db, user.id)
            db.flush()
        address = Address(
            user_id=user.id,
            label=data.label.strip(),
            full_address=data.full_address.strip(),
            area=data.area.strip(),
            contact_phone=normalize_tanzanian_phone(data.contact_phone),
            delivery_instructions=(data.delivery_instructions or "").strip() or None,
            latitude=data.latitude,
            longitude=data.longitude,
            is_default=should_default,
        )
        repo.add(db, address)
        db.commit()
        db.refresh(address)
        return address_to_read(address)

    def update(self, db: Session, user: User, address_id: str, data: AddressUpdate) -> AddressRead:
        authorize(user, Permission.ADDRESS_MANAGE_SELF)
        address = self.get_model(db, user, address_id)
        payload = data.model_dump(exclude_unset=True)
        if payload.get("is_default") is True:
            repo.unset_defaults(db, user.id)
            db.flush()
            address.is_default = True
        for key in ["label", "full_address", "area"]:
            if key in payload and payload[key] is not None:
                setattr(address, key, payload[key].strip())
        if "contact_phone" in payload and payload["contact_phone"] is not None:
            address.contact_phone = normalize_tanzanian_phone(payload["contact_phone"])
        if "delivery_instructions" in payload:
            address.delivery_instructions = (payload["delivery_instructions"] or "").strip() or None
        if "latitude" in payload:
            address.latitude = payload["latitude"]
        if "longitude" in payload:
            address.longitude = payload["longitude"]
        db.commit()
        db.refresh(address)
        return address_to_read(address)

    def delete(self, db: Session, user: User, address_id: str) -> None:
        authorize(user, Permission.ADDRESS_MANAGE_SELF)
        address = self.get_model(db, user, address_id)
        was_default = address.is_default
        db.delete(address)
        db.flush()
        if was_default:
            next_address = repo.list_for_user(db, user.id)
            if next_address:
                next_address[0].is_default = True
        db.commit()

    def snapshot_from_payload(self, payload: DeliveryAddressPayload) -> dict:
        return {
            "full_address": payload.full_address.strip(),
            "area": payload.area.strip(),
            "contact_phone": normalize_tanzanian_phone(payload.contact_phone),
            "delivery_instructions": (payload.delivery_instructions or "").strip() or None,
            "latitude": payload.latitude,
            "longitude": payload.longitude,
        }

    def snapshot_from_saved(self, address: Address) -> dict:
        return {
            "full_address": address.full_address,
            "area": address.area,
            "contact_phone": address.contact_phone,
            "delivery_instructions": address.delivery_instructions,
            "latitude": address.latitude,
            "longitude": address.longitude,
        }


address_service = AddressService()
