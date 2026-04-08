from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime

_VALID_STATUSES = {"novo", "contato", "proposta", "fechado", "perdido"}


class KanbanCardCreate(BaseModel):
    content: str
    status: str = "novo"

    @field_validator("status")
    @classmethod
    def valid_status(cls, v: str) -> str:
        if v not in _VALID_STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(_VALID_STATUSES)}")
        return v


class KanbanCard(KanbanCardCreate):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CardMove(BaseModel):
    card_id: int
    new_status: str

    @field_validator("new_status")
    @classmethod
    def valid_status(cls, v: str) -> str:
        if v not in _VALID_STATUSES:
            raise ValueError(f"Status must be one of: {', '.join(_VALID_STATUSES)}")
        return v
