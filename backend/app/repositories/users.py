from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.roles import Role
from app.models.order import Order
from app.models.user import User


class UserRepository:
    def get(self, db: Session, user_id: str) -> User | None:
        return db.get(User, user_id)

    def get_by_phone(self, db: Session, phone: str) -> User | None:
        return db.scalar(select(User).where(User.phone == phone))

    def get_by_email(self, db: Session, email: str) -> User | None:
        return db.scalar(select(User).where(User.email == email))

    def list_by_role(self, db: Session, role: Role, *, limit: int = 500) -> list[User]:
        return list(db.scalars(select(User).where(User.role == role).order_by(User.created_at.desc()).limit(limit)))

    def list_dashboard_accounts(self, db: Session, *, limit: int = 500) -> list[User]:
        return list(
            db.scalars(
                select(User)
                .where(User.role.in_([Role.SALES_MANAGER, Role.SYSTEM_ADMIN]))
                .order_by(User.created_at.desc())
                .limit(limit)
            )
        )

    def search_customers(self, db: Session, query: str, *, limit: int = 25) -> list[User]:
        value = f"%{query.strip().lower()}%"
        statement = (
            select(User)
            .where(
                User.role == Role.USER,
                or_(User.full_name.ilike(value), User.phone.ilike(value), User.email.ilike(value)),
            )
            .options(selectinload(User.addresses))
            .order_by(User.full_name.asc())
            .limit(limit)
        )
        return list(db.scalars(statement))

    def list_customers(self, db: Session, *, limit: int = 500) -> list[User]:
        return list(
            db.scalars(
                select(User)
                .where(User.role == Role.USER)
                .options(
                    selectinload(User.addresses),
                    selectinload(User.orders).selectinload(Order.items),
                    selectinload(User.orders).selectinload(Order.payments),
                )
                .order_by(User.created_at.desc())
                .limit(limit)
            )
        )

    def add(self, db: Session, user: User) -> User:
        db.add(user)
        db.flush()
        return user
