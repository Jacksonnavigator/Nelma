import logging
from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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


# The interactive API docs map every endpoint for an attacker, so production does not serve them.
_show_docs = settings.app_env != "production"

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    debug=settings.debug,
    docs_url="/docs" if _show_docs else None,
    redoc_url="/redoc" if _show_docs else None,
    openapi_url="/openapi.json" if _show_docs else None,
    lifespan=lifespan,
)

# Largest JSON body the API accepts. A product photo (5 MB as base64, about 7 MB) is the biggest legitimate one.
MAX_BODY_BYTES = 8 * 1024 * 1024
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Resource-Policy": "cross-origin",
}


@app.middleware("http")
async def security_headers(request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
    length = request.headers.get("content-length")
    if length is not None and (not length.isdigit() or int(length) > MAX_BODY_BYTES):
        return JSONResponse(
            status_code=413,
            content={"detail": {"code": "PAYLOAD_TOO_LARGE", "message": "The request is too large."}},
        )
    response = await call_next(request)
    # API docs need their own scripts and styles; everything else is JSON and gets the strict policy.
    is_docs = request.url.path in {"/docs", "/redoc", "/docs/oauth2-redirect"}
    for header, value in SECURITY_HEADERS.items():
        if is_docs and header == "Content-Security-Policy":
            continue
        response.headers.setdefault(header, value)
    if settings.app_env == "production":
        response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    if request.url.path.startswith(settings.api_v1_prefix):
        response.headers.setdefault("Cache-Control", "no-store")
    return response

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
