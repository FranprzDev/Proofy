"""Contracts shared between agents and Next.js (exported to OpenAPI)."""

from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class Verdict(StrEnum):
    FAVORABLE = "favorable"
    NEEDS_FIX = "needs_fix"
    INCONCLUSIVE = "inconclusive"


class Ref(BaseModel):
    """Identifies what is evaluated against: milestone, agreed version and exact revision."""

    model_config = ConfigDict(frozen=True)

    milestone_id: str
    contract_version: str
    revision: str
