"""Run an isolated local API for admin browser verification; never uses the application database."""
import os
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(root / "backend"))
(root / "admin/output").mkdir(parents=True, exist_ok=True)
os.environ.update({"APP_ENV": "development", "DEBUG": "false", "DATABASE_URL": "sqlite:///" + (root / "admin/output/browser-verification.db").as_posix(), "JWT_SECRET_KEY": "local-admin-verification-only-secret-key", "RATE_LIMIT_ENABLED": "false", "PAYMENT_PROVIDER": "development", "NOTIFICATION_PROVIDER": "development"})
from app.main import app
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.models.user import User
from app.models.address import Address
from app.core.roles import Role
from app.core.security import hash_password
from app.services.settings_service import settings_service
from sqlalchemy import select
import uvicorn

Base.metadata.create_all(engine)
with SessionLocal() as db:
    for role, phone, email, name in [(Role.SYSTEM_ADMIN, "+255711000001", "admin@example.com", "Verification Admin"), (Role.SALES_MANAGER, "+255711000002", "sales@example.com", "Verification Sales"), (Role.USER, "+255711000003", "customer@example.com", "Verification Customer")]:
        if db.scalar(select(User).where(User.email == email)) is None:
            user = User(full_name=name, phone=phone, email=email, role=role, password_hash=hash_password("TestOnly123!"), is_active=True)
            db.add(user)
            db.flush()
            if role == Role.USER:
                db.add(Address(user_id=user.id, label="Campus", full_address="NM-AIST Campus Block A", area="NM-AIST", contact_phone=phone, is_default=True))
    db.commit()
    settings_service.seed_defaults(db)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8011, log_level="warning")
