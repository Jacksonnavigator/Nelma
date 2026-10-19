from typing import Annotated

from fastapi import APIRouter, Depends, Header, Response, status

from app.api.dependencies import DashboardUser, DbSession
from app.core.rate_limit import rate_limit
from app.schemas.web_push import WebPushSubscribeInput, WebPushUnsubscribeInput
from app.services.web_push_subscription_service import web_push_subscription_service

router = APIRouter(prefix="/admin/push", tags=["Dashboard"])


@router.get("/config", summary="Whether browser alerts are switched on, and the public key a browser needs to subscribe")
def push_config(user: DashboardUser) -> dict:
    return web_push_subscription_service.config(user)


@router.post(
    "/subscriptions",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Turn on order alerts for this browser",
    dependencies=[Depends(rate_limit("web-push-subscribe", 30, 3600))],
)
def subscribe(
    data: WebPushSubscribeInput,
    user: DashboardUser,
    db: DbSession,
    user_agent: Annotated[str | None, Header(alias="User-Agent")] = None,
) -> Response:
    web_push_subscription_service.subscribe(db, user, data, user_agent=user_agent)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/test",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Send a test alert to your own browsers",
    dependencies=[Depends(rate_limit("web-push-test", 10, 600))],
)
def send_test(user: DashboardUser, db: DbSession) -> Response:
    web_push_subscription_service.send_test(db, user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/subscriptions/remove", status_code=status.HTTP_204_NO_CONTENT, summary="Turn off order alerts for this browser")
def unsubscribe(data: WebPushUnsubscribeInput, user: DashboardUser, db: DbSession) -> Response:
    web_push_subscription_service.unsubscribe(db, user, data.endpoint)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
