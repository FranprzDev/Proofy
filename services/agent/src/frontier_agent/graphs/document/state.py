from enum import StrEnum

from pydantic import BaseModel, Field


class DocumentStatus(StrEnum):
    PENDING = "pending"
    NEEDS_CLARIFICATION = "needs_clarification"
    PROPOSAL = "proposal"


class DocumentInput(BaseModel):
    contract_id: str
    document: str
    answers: list[str] = Field(default_factory=list)


class Ambiguity(BaseModel):
    clause: str
    reason: str
    suggested_question: str


class Scenario(BaseModel):
    clause: str
    description: str
    expected_result: str


class DocumentState(DocumentInput):
    status: DocumentStatus = DocumentStatus.PENDING
    clauses: list[str] = Field(default_factory=list)
    # With ambiguities the agent flags them and proposes no scenarios: it never invents.
    ambiguities: list[Ambiguity] = Field(default_factory=list)
    scenarios: list[Scenario] = Field(default_factory=list)
    pending_items: list[str] = Field(default_factory=list)
    # The agent proposes; only the parties accept.
    accepted_by_client: bool = False
    accepted_by_provider: bool = False
