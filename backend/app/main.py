import logging
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
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


def configure_public_website_cors(application: FastAPI, configuration: Settings) -> None:
    """Let the public website call its endpoints from whatever domain it is hosted on.

    These endpoints take no login and no cookies (contact form, order form, public prices), so allowing
    any origin without credentials exposes nothing. Everything else stays behind the CORS_ORIGINS list.
    Added after configure_cors so it runs first and answers the browser's preflight itself.
    """
    public_paths = tuple(
        f"{configuration.api_v1_prefix}{path}" for path in ("/website/", "/settings/public")
    )
    cors_headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "600",
    }

    @application.middleware("http")
    async def public_website_cors(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        if not request.url.path.startswith(public_paths):
            return await call_next(request)
        if request.method == "OPTIONS":
            return Response(status_code=204, headers=cors_headers)
        response = await call_next(request)
        for key in ("access-control-allow-origin", "access-control-allow-credentials"):
            if key in response.headers:
                del response.headers[key]
        response.headers.update(cors_headers)
        return response


configure_cors(app, settings)
configure_public_website_cors(app, settings)

app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get("/health", tags=["Health"], summary="Basic API health")
def root_health() -> dict[str, str]:
    return {"status": "ok", "service": "nelma-api"}


@app.get("/ready", tags=["Health"], summary="API and database readiness")
def root_ready() -> dict[str, str]:
    with SessionLocal() as db:
        db.execute(text("select 1"))
    return {"status": "ready"}
