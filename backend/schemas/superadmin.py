from pydantic import BaseModel, Field


class DeactivateAdminRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)
    deactivated_by: int
