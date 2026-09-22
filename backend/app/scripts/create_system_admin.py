import argparse
import getpass

from sqlalchemy.exc import IntegrityError

import app.models  # noqa: F401
from app.core.roles import Role
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User
from app.repositories.users import UserRepository
from app.services.audit_service import audit_service
from app.utils.phone import normalize_tanzanian_phone

repo = UserRepository()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create the first NELMA SYSTEM_ADMIN account.")
    parser.add_argument("--full-name", required=True, help="System Admin full name")
    parser.add_argument("--phone", required=True, help="Tanzanian phone number")
    parser.add_argument("--email", default=None, help="Optional admin email address")
    parser.add_argument("--password", default=None, help="Password. Omit to enter securely.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    password = args.password or getpass.getpass("Password: ")
    if len(password) < 8:
        raise SystemExit("Password must be at least 8 characters.")

    phone = normalize_tanzanian_phone(args.phone)
    email = args.email.lower() if args.email else None
    with SessionLocal() as db:
        if repo.get_by_phone(db, phone):
            raise SystemExit("An account already exists with this phone number.")
        if email and repo.get_by_email(db, email):
            raise SystemExit("An account already exists with this email address.")
        admin = User(
            full_name=args.full_name.strip(),
            phone=phone,
            email=email,
            password_hash=hash_password(password),
            role=Role.SYSTEM_ADMIN,
            is_verified=True,
        )
        try:
            repo.add(db, admin)
            audit_service.record(db, actor=None, event_type="INITIAL_SYSTEM_ADMIN_CREATED", resource_type="user", resource_id=admin.id)
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise SystemExit("Could not create System Admin because account details conflict.") from exc
    print("Created SYSTEM_ADMIN account: " + phone)


if __name__ == "__main__":
    main()

