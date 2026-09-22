from fastapi import APIRouter, Response, status

from app.api.dependencies import CurrentUser, DbSession
from app.schemas.common import Page
from app.schemas.notification import NotificationRead
from app.services.notification_service import notification_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=Page[NotificationRead], summary="List database notifications")
def list_notifications(user: CurrentUser, db: DbSession, page: int = 1, page_size: int = 20) -> Page[NotificationRead]:
    return notification_service.list(db, user, page=page, page_size=page_size)


@router.patch("/{notification_id}/read", response_model=NotificationRead, summary="Mark notification as read")
def mark_read(notification_id: str, user: CurrentUser, db: DbSession) -> NotificationRead:
    return notification_service.mark_read(db, user, notification_id)


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT, summary="Mark all notifications as read")
def read_all(user: CurrentUser, db: DbSession) -> Response:
    notification_service.read_all(db, user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
