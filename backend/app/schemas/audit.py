from pydantic import AliasChoices, Field

from app.schemas.common import CamelModel


class AuditLogRead(CamelModel):
    id: str
    actor_user_id: str | None = Field(None, validation_alias=AliasChoices("actorUserId", "actor_user_id"))
    actor_role: str | None = Field(None, validation_alias=AliasChoices("actorRole", "actor_role"))
    event_type: str = Field(validation_alias=AliasChoices("eventType", "event_type"))
    resource_type: str = Field(validation_alias=AliasChoices("resourceType", "resource_type"))
    resource_id: str | None = Field(None, validation_alias=AliasChoices("resourceId", "resource_id"))
    metadata: dict = Field(default_factory=dict, validation_alias=AliasChoices("metadata", "metadata_json"))
    created_at: str = Field(validation_alias=AliasChoices("createdAt", "created_at"))
