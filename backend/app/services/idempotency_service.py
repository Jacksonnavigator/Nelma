from fastapi import status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.models.idempotency_key import IdempotencyKey
from app.models.user import User


class IdempotencyService:
    def replay(self, db: Session, user: User, key: str) -> dict | None:
        record = db.scalar(select(IdempotencyKey).where(IdempotencyKey.user_id == user.id, IdempotencyKey.key == key))
        return dict(record.response_body) if record else None

    def store(self, db: Session, user: User, *, key: str, method: str, path: str, status_code: int, response_body: dict) -> None:
        if len(key) > 160:
            raise AppException("INVALID_IDEMPOTENCY_KEY", "Idempotency-Key is too long.", status.HTTP_400_BAD_REQUEST)
        existing = db.scalar(select(IdempotencyKey).where(IdempotencyKey.user_id == user.id, IdempotencyKey.key == key))
        if existing is None:
            db.add(
                IdempotencyKey(
                    user_id=user.id,
                    key=key,
                    method=method,
                    path=path,
                    status_code=status_code,
                    response_body=response_body,
                )
            )
            db.flush()


idempotency_service = IdempotencyService()
