from fastapi import APIRouter
from sqlalchemy import text

from app.api.dependencies import DbSession

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Basic API health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "nelma-api"}


@router.get("/ready", summary="API and database readiness")
def ready(db: DbSession) -> dict[str, str]:
    db.execute(text("select 1"))
    return {"status": "ready"}
