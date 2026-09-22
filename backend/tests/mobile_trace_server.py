"""Ephemeral FastAPI server for the mobile auth integration test; never uses real accounts."""
import os
import socket
import tempfile
from pathlib import Path


def main():
    with tempfile.TemporaryDirectory(prefix="nelma-mobile-trace-") as directory:
        os.environ.update(
            APP_ENV="test",
            DEBUG="false",
            DATABASE_URL="sqlite:///" + str(Path(directory) / "trace.db"),
            JWT_SECRET_KEY="isolated-mobile-trace-secret-at-least-32-characters",
            RATE_LIMIT_ENABLED="false",
            PAYMENT_PROVIDER="development",
        )
        import uvicorn

        import app.models
        from app.core.roles import Role
        from app.core.security import hash_password
        from app.db.base import Base
        from app.db.session import SessionLocal, engine
        from app.main import app
        from app.models.user import User

        Base.metadata.create_all(engine)
        with SessionLocal() as db:
            for role, phone in [(Role.USER, "+255710000001"), (Role.DRIVER, "+255710000002")]:
                db.add(User(
                    full_name="Trace " + role.value,
                    phone=phone,
                    email=role.value.lower() + "@trace.example.com",
                    role=role,
                    password_hash=hash_password("TracePassword123"),
                    is_active=True,
                ))
            db.commit()
        sock = socket.socket()
        sock.bind(("127.0.0.1", 0))
        print("TRACE_PORT=" + str(sock.getsockname()[1]), flush=True)
        server = uvicorn.Server(uvicorn.Config(app, log_level="error", access_log=False))
        try:
            server.run(sockets=[sock])
        finally:
            engine.dispose()


if __name__ == "__main__":
    main()
