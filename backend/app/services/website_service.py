"""Messages and order requests from the public website.

Visitors are not signed in, so nothing here creates an account or an order. Requests are stored for staff,
who get a dashboard alert, contact the person and place the real order with Create Order.
"""

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.core.http_status import HTTP_422_UNPROCESSABLE_CONTENT
from app.core.permissions import Permission, authorize
from app.core.security import utc_now
from app.models.user import User
from app.models.website_request import WebsiteRequest
from app.schemas.website import WebsiteContactInput, WebsiteOrderInput
from app.services.audit_service import audit_service
from app.services.notification_service import notification_service
from app.services.product_service import product_service
from app.services.serializers import iso
from app.utils.phone import normalize_tanzanian_phone


def _clean(value: str | None) -> str | None:
    return value.strip() if value and value.strip() else None


class WebsiteService:
    def submit_contact(self, db: Session, data: WebsiteContactInput) -> None:
        if data.website:  # Filled-in hidden field: a bot. Pretend it worked.
            return
        request = WebsiteRequest(
            kind="contact",
            status="new",
            name=data.name.strip(),
            email=str(data.email).lower(),
            phone=normalize_tanzanian_phone(data.phone) if data.phone else None,
            message=data.message.strip(),
        )
        db.add(request)
        notification_service.notify_staff(db, event_type="staff_website_message")
        db.commit()

    def submit_order(self, db: Session, data: WebsiteOrderInput) -> None:
        if data.website:
            return
        product = product_service.get_by_code(db, data.product_code)
        if product is None or not product.is_active:
            raise AppException("PRODUCT_UNAVAILABLE", "Choose a product from the list.", HTTP_422_UNPROCESSABLE_CONTENT)
        request = WebsiteRequest(
            kind="order",
            status="new",
            customer_type=data.customer_type,
            name=data.name.strip(),
            company=_clean(data.company),
            email=str(data.email).lower(),
            phone=normalize_tanzanian_phone(data.phone),
            city=_clean(data.city),
            area=data.area.strip(),
            product_code=product.code,
            product_name=product.name,
            quantity=data.quantity,
            address=_clean(data.address),
            message=_clean(data.instructions),
        )
        db.add(request)
        notification_service.notify_staff(db, event_type="staff_website_order")
        db.commit()

    def list(self, db: Session, actor: User, *, kind: str, status_filter: str, page: int, page_size: int) -> dict:
        authorize(actor, Permission.ORDER_VIEW_ALL)
        query = select(WebsiteRequest)
        if kind != "all":
            query = query.where(WebsiteRequest.kind == kind)
        if status_filter != "all":
            query = query.where(WebsiteRequest.status == status_filter)
        total = db.scalar(select(func.count()).select_from(query.subquery())) or 0
        rows = db.scalars(query.order_by(WebsiteRequest.created_at.desc()).offset((page - 1) * page_size).limit(page_size))
        new_counts = {
            kind_name: count
            for kind_name, count in db.execute(
                select(WebsiteRequest.kind, func.count(WebsiteRequest.id)).where(WebsiteRequest.status == "new").group_by(WebsiteRequest.kind)
            ).all()
        }
        return {
            "items": [self.dto(row) for row in rows],
            "page": page,
            "pageSize": page_size,
            "total": total,
            "newCounts": {"order": new_counts.get("order", 0), "contact": new_counts.get("contact", 0)},
        }

    def set_status(self, db: Session, actor: User, request_id: str, new_status: str) -> dict:
        authorize(actor, Permission.ORDER_VIEW_ALL)
        request = db.get(WebsiteRequest, request_id)
        if request is None:
            raise AppException("WEBSITE_REQUEST_NOT_FOUND", "Request not found.", status.HTTP_404_NOT_FOUND)
        request.status = new_status
        request.handled_at = utc_now() if new_status == "handled" else None
        request.handled_by_user_id = actor.id if new_status == "handled" else None
        audit_service.record(
            db,
            actor=actor,
            event_type="WEBSITE_REQUEST_HANDLED" if new_status == "handled" else "WEBSITE_REQUEST_REOPENED",
            resource_type="website_request",
            resource_id=request.id,
        )
        db.commit()
        db.refresh(request)
        return self.dto(request)

    @staticmethod
    def dto(request: WebsiteRequest) -> dict:
        return {
            "id": request.id,
            "kind": request.kind,
            "status": request.status,
            "name": request.name,
            "email": request.email,
            "phone": request.phone,
            "company": request.company,
            "customerType": request.customer_type,
            "city": request.city,
            "area": request.area,
            "productCode": request.product_code,
            "productName": request.product_name,
            "quantity": request.quantity,
            "address": request.address,
            "message": request.message,
            "createdAt": iso(request.created_at),
            "handledAt": iso(request.handled_at),
        }


website_service = WebsiteService()
