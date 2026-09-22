from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.address import Address


class AddressRepository:
    def list_for_user(self, db: Session, user_id: str) -> list[Address]:
        return list(
            db.scalars(select(Address).where(Address.user_id == user_id).order_by(Address.is_default.desc(), Address.created_at.desc()))
        )

    def count_for_user(self, db: Session, user_id: str) -> int:
        return int(db.scalar(select(func.count()).select_from(Address).where(Address.user_id == user_id)) or 0)

    def get_for_user(self, db: Session, user_id: str, address_id: str) -> Address | None:
        return db.scalar(select(Address).where(Address.id == address_id, Address.user_id == user_id))

    def unset_defaults(self, db: Session, user_id: str) -> None:
        for address in self.list_for_user(db, user_id):
            address.is_default = False

    def add(self, db: Session, address: Address) -> Address:
        db.add(address)
        db.flush()
        return address
