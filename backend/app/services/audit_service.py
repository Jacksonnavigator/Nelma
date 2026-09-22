from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.permissions import Permission, authorize
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogRead
from app.services.serializers import audit_log_to_read

SENSITIVE_KEYS = {"password", "token", "accessToken", "refreshToken", "access_token", "refresh_token"}


def _safe_metadata(metadata: dict | None) -> dict:
    if not metadata:
        return {}
    return {key: value for key, value in metadata.items() if key not in SENSITIVE_KEYS}


class AuditService:
    def record(
        self,
        db: Session,
        *,
        actor: User | None,
        event_type: str,
        resource_type: str,
        resource_id: str | None = None,
        metadata: dict | None = None,
    ) -> AuditLog:
        audit = AuditLog(
            actor_user_id=actor.id if actor else None,
            actor_role=actor.role.value if actor and hasattr(actor.role, "value") else str(actor.role) if actor else None,
            event_type=event_type,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata_json=_safe_metadata(metadata),
        )
        db.add(audit)
        db.flush()
        return audit

    def list(self, db: Session, actor: User, *, limit: int = 100) -> list[AuditLogRead]:
        authorize(actor, Permission.AUDIT_LOG_VIEW)
        items = list(db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(min(max(limit, 1), 500))))
        return [audit_log_to_read(item) for item in items]


audit_service = AuditService()
