"""Apply migrations and create missing catalog defaults. Does not create demo accounts."""

from pathlib import Path

from alembic.config import Config

from alembic import command
from app.db.session import SessionLocal
from app.services.settings_service import settings_service


def main() -> None:
    backend_dir = Path(__file__).resolve().parents[2]
    config = Config(str(backend_dir / "alembic.ini"))
    config.set_main_option("script_location", str(backend_dir / "alembic"))
    command.upgrade(config, "head")
    with SessionLocal() as db:
        settings_service.seed_defaults(db)
    print("Database migrations and catalog defaults are ready.")


if __name__ == "__main__":
    main()
