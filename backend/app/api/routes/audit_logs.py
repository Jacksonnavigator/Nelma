from fastapi import APIRouter

from app.api.dependencies import DashboardUser, DbSession
from app.schemas.audit import AuditLogRead
from app.services.audit_service import audit_service

router = APIRouter(prefix="/audit-logs", tags=["Audit Logs"])


@router.get("", response_model=list[AuditLogRead], summary="List security and administrative audit events")
def list_audit_logs(user: DashboardUser, db: DbSession, limit: int = 100) -> list[AuditLogRead]:
    return audit_service.list(db, user, limit=limit)
