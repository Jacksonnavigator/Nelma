from enum import StrEnum

from fastapi import status

from app.core.exceptions import AppException
from app.core.roles import Role, coerce_role
from app.models.user import User


class Permission(StrEnum):
    ORDER_PLACE_SELF = "ORDER_PLACE_SELF"
    ORDER_PLACE_FOR_CUSTOMER = "ORDER_PLACE_FOR_CUSTOMER"
    ORDER_VIEW_SELF = "ORDER_VIEW_SELF"
    ORDER_VIEW_ALL = "ORDER_VIEW_ALL"
    ADDRESS_MANAGE_SELF = "ADDRESS_MANAGE_SELF"
    NOTIFICATION_VIEW_SELF = "NOTIFICATION_VIEW_SELF"
    CASH_COLLECTION_RECORD = "CASH_COLLECTION_RECORD"
    PAYMENT_MANAGE_SELF = "PAYMENT_MANAGE_SELF"
    PROFILE_UPDATE_SELF = "PROFILE_UPDATE_SELF"
    DELIVERY_VIEW_ASSIGNED = "DELIVERY_VIEW_ASSIGNED"
    DELIVERY_VIEW_ALL = "DELIVERY_VIEW_ALL"
    DELIVERY_UPDATE = "DELIVERY_UPDATE"
    CUSTOMER_RECEIPT_CONFIRM = "CUSTOMER_RECEIPT_CONFIRM"
    ORDER_PROCESS = "ORDER_PROCESS"
    DRIVER_ASSIGN = "DRIVER_ASSIGN"
    DRIVER_MANAGE = "DRIVER_MANAGE"
    SALES_REPORT_VIEW = "SALES_REPORT_VIEW"
    PRICING_MANAGE = "PRICING_MANAGE"
    SYSTEM_SETTINGS_MANAGE = "SYSTEM_SETTINGS_MANAGE"
    ADMIN_ACCOUNT_MANAGE = "ADMIN_ACCOUNT_MANAGE"
    AUDIT_LOG_VIEW = "AUDIT_LOG_VIEW"


ROLE_PERMISSIONS: dict[Role, frozenset[Permission]] = {
    Role.USER: frozenset(
        {
            Permission.ORDER_PLACE_SELF,
            Permission.ORDER_VIEW_SELF,
            Permission.ADDRESS_MANAGE_SELF,
            Permission.NOTIFICATION_VIEW_SELF,
            Permission.PAYMENT_MANAGE_SELF,
            Permission.PROFILE_UPDATE_SELF,
            Permission.CUSTOMER_RECEIPT_CONFIRM,
        }
    ),
    Role.DRIVER: frozenset(
        {
            Permission.NOTIFICATION_VIEW_SELF,
            Permission.PROFILE_UPDATE_SELF,
            Permission.DELIVERY_VIEW_ASSIGNED,
            Permission.DELIVERY_UPDATE,
        }
    ),
    Role.SALES_MANAGER: frozenset(
        {
            Permission.PROFILE_UPDATE_SELF,
            Permission.NOTIFICATION_VIEW_SELF,
            Permission.ORDER_PLACE_FOR_CUSTOMER,
            Permission.CASH_COLLECTION_RECORD,
            Permission.ORDER_VIEW_ALL,
            Permission.DELIVERY_VIEW_ALL,
            Permission.DELIVERY_UPDATE,
            Permission.ORDER_PROCESS,
            Permission.DRIVER_ASSIGN,
            Permission.DRIVER_MANAGE,
            Permission.SALES_REPORT_VIEW,
            Permission.PRICING_MANAGE,
        }
    ),
    Role.SYSTEM_ADMIN: frozenset(
        {
            Permission.PROFILE_UPDATE_SELF,
            Permission.NOTIFICATION_VIEW_SELF,
            Permission.ORDER_VIEW_ALL,
            Permission.DELIVERY_VIEW_ALL,
            Permission.DRIVER_ASSIGN,
            Permission.DRIVER_MANAGE,
            Permission.SALES_REPORT_VIEW,
            Permission.PRICING_MANAGE,
            Permission.SYSTEM_SETTINGS_MANAGE,
            Permission.ADMIN_ACCOUNT_MANAGE,
            Permission.AUDIT_LOG_VIEW,
        }
    ),
}


def permissions_for_role(role: str | Role | None) -> frozenset[Permission]:
    return ROLE_PERMISSIONS[coerce_role(role)]


def has_permission(role: str | Role | None, permission: Permission) -> bool:
    return permission in permissions_for_role(role)


def authorize(user: User, permission: Permission) -> None:
    if not has_permission(user.role, permission):
        raise AppException("FORBIDDEN", "You do not have permission to complete this action.", status.HTTP_403_FORBIDDEN)
