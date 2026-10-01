"""Forms on the public NELMA website. No sign-in; rate limited per visitor."""

from fastapi import APIRouter, Depends, status

from app.api.dependencies import DbSession
from app.core.rate_limit import rate_limit
from app.schemas.website import WebsiteContactInput, WebsiteOrderInput
from app.services.website_service import website_service

router = APIRouter(prefix="/website", tags=["Website"])

RECEIVED = {"received": True}


@router.post(
    "/contact",
    status_code=status.HTTP_201_CREATED,
    summary="Send a message from the website contact form",
    dependencies=[Depends(rate_limit("website-contact", 5, 3600))],
)
def contact(data: WebsiteContactInput, db: DbSession) -> dict:
    website_service.submit_contact(db, data)
    return RECEIVED


@router.post(
    "/orders",
    status_code=status.HTTP_201_CREATED,
    summary="Send an order request from the website",
    dependencies=[Depends(rate_limit("website-order", 5, 3600))],
)
def order(data: WebsiteOrderInput, db: DbSession) -> dict:
    website_service.submit_order(db, data)
    return RECEIVED
