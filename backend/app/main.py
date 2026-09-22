import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.router import api_router
from app.core.config import Settings, get_settings
from app.core.exceptions import AppException, app_exception_handler, unexpected_exception_handler, validation_exception_handler
from app.core.logging import configure_logging
from app.db.session import SessionLocal

settings = get_settings()
configure_logging(settings.debug)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app_instance: FastAPI) -> AsyncIterator[None]:
    logger.info("NELMA API starting in %s mode", settings.app_env)
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    debug=settings.debug,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unexpected_exception_handler)

def configure_cors(application: FastAPI, configuration: Settings) -> None:
    application.add_middleware(
        CORSMiddleware,
        allow_origins=configuration.cors_origins,
        allow_origin_regex=configuration.development_cors_origin_regex,
        allow_credentials=True,
        allow_methods=["OPTIONS", "GET", "HEAD", "POST", "PATCH", "PUT", "DELETE"],
        allow_headers=["Authorization", "Content-Type", "Idempotency-Key"],
    )


configure_cors(app, settings)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["Health"], summary="Basic API health")
def root_health() -> dict[str, str]:
    return {"status": "ok", "service": "nelma-api"}


@app.get("/ready", tags=["Health"], summary="API and database readiness")
def root_ready() -> dict[str, str]:
    with SessionLocal() as db:
        db.execute(text("select 1"))
    return {"status": "ready"}
