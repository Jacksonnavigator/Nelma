from enum import StrEnum


class Role(StrEnum):
    USER = "USER"
    DRIVER = "DRIVER"
    SALES_MANAGER = "SALES_MANAGER"
    SYSTEM_ADMIN = "SYSTEM_ADMIN"


class SessionAudience(StrEnum):
    MOBILE = "mobile"
    DASHBOARD = "dashboard"


MOBILE_ROLES = {Role.USER, Role.DRIVER}
DASHBOARD_ROLES = {Role.SALES_MANAGER, Role.SYSTEM_ADMIN}
ALL_ROLES = {role for role in Role}
ALL_AUDIENCES = {audience for audience in SessionAudience}


def coerce_role(value: str | Role | None) -> Role:
    if isinstance(value, Role):
        return value
    try:
        return Role(str(value or Role.USER.value).upper())
    except ValueError:
        return Role.USER


def coerce_audience(value: str | SessionAudience | None) -> SessionAudience:
    if isinstance(value, SessionAudience):
        return value
    try:
        return SessionAudience(str(value or SessionAudience.MOBILE.value).lower())
    except ValueError:
        return SessionAudience.MOBILE


def role_allowed_for_audience(role: str | Role | None, audience: str | SessionAudience | None) -> bool:
    resolved_role = coerce_role(role)
    resolved_audience = coerce_audience(audience)
    if resolved_audience == SessionAudience.MOBILE:
        return resolved_role in MOBILE_ROLES
    return resolved_role in DASHBOARD_ROLES
