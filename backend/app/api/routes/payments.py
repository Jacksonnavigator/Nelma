from fastapi import APIRouter, Depends, Header, Request, status

from app.api.dependencies import CurrentUser, DbSession, IdempotencyKey
from app.core.config import get_settings
from app.core.exceptions import AppException
from app.core.rate_limit import rate_limit
from app.schemas.payment import InitializePaymentRequest, PaymentMethodRead, PaymentRead
from app.services.idempotency_service import idempotency_service
from app.services.payment_service import payment_service

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/methods", response_model=list[PaymentMethodRead], summary="List available payment methods")
def methods() -> list[PaymentMethodRead]:
    return payment_service.methods()


@router.post(
    "/initialize",
    response_model=PaymentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Initialize a payment for an order total calculated by the server",
    dependencies=[Depends(rate_limit("payment-initialize", 30, 900))],
)
def initialize_payment(
    data: InitializePaymentRequest, request: Request, user: CurrentUser, db: DbSession, idempotency_key: IdempotencyKey = None
):
    if idempotency_key:
        replay = idempotency_service.replay(db, user, idempotency_key)
        if replay:
            return replay
    payment = payment_service.initialize(db, user, data, client_reference=idempotency_key)
    if idempotency_key:
        body = payment.model_dump(by_alias=True, mode="json")
        idempotency_service.store(
            db,
            user,
            key=idempotency_key,
            method="POST",
            path=str(request.url.path),
            status_code=status.HTTP_201_CREATED,
            response_body=body,
        )
        db.commit()
    return payment


@router.get("/{payment_id}", response_model=PaymentRead, summary="Read a payment")
def get_payment(payment_id: str, user: CurrentUser, db: DbSession) -> PaymentRead:
    return payment_service.get(db, user, payment_id)


@router.post("/webhooks/{provider}", summary="Provider-specific payment callback endpoint")
async def payment_webhook(
    provider: str,
    request: Request,
    db: DbSession,
    x_development_webhook_secret: str | None = Header(None),
) -> dict:
    settings = get_settings()
    if (
        provider == "development"
        and settings.app_env in {"development", "test"}
        and x_development_webhook_secret != settings.development_webhook_secret
    ):
        raise AppException("WEBHOOK_FORBIDDEN", "Webhook signature is invalid.", status.HTTP_403_FORBIDDEN)
    payload = await request.json()
    return payment_service.process_webhook(db, provider, payload, dict(request.headers))
