from typing import ClassVar

from pydantic import BaseModel, Field

from frontier_agent.schemas import DocumentStatus, Priority, TestKind

__all__ = [
    "Ambiguity",
    "DocumentInput",
    "DocumentState",
    "DocumentStatus",
    "TestCase",
]


class DocumentInput(BaseModel):
    contract_id: str
    document: str
    answers: list[str] = Field(default_factory=list)
    contract_version: str = "draft"


class Ambiguity(BaseModel):
    clause: str
    reason: str
    suggested_question: str


class TestCase(BaseModel):
    """Verbal test case: plain-language steps and expectations for an agentic E2E runner."""

    __test__: ClassVar[bool] = False

    id: str
    clause: str
    title: str
    objective: str
    preconditions: list[str] = Field(default_factory=list)
    # Imperative user goals, each usable as `agent.act(...)`. `{name}` placeholders are
    # filled from `test_data` (or `{username}`/`{password}` from `credentials_role`).
    steps: list[str] = Field(default_factory=list)
    # Observable statements, each usable as `agent.assert(...)`.
    expected_results: list[str] = Field(default_factory=list)
    start_path: str = "/"
    kind: TestKind = TestKind.UI
    priority: Priority = Priority.MEDIUM
    # Non-secret test data passed as `params`.
    test_data: dict[str, str] = Field(default_factory=dict)
    # Name of a TesterArmy `credentials` entry; passwords never appear literally.
    credentials_role: str | None = None


class DocumentState(DocumentInput):
    status: DocumentStatus = DocumentStatus.PENDING
    clauses: list[str] = Field(default_factory=list)
    # With ambiguities the agent flags them and proposes no tests: it never invents.
    ambiguities: list[Ambiguity] = Field(default_factory=list)
    test_cases: list[TestCase] = Field(default_factory=list)
    # Clauses that E2E cannot verify (payment terms, legal obligations...), with the reason.
    out_of_scope: list[str] = Field(default_factory=list)
    # Filename -> content, ready for the TesterArmy runner.
    e2e_suite: dict[str, str] = Field(default_factory=dict)
    pending_items: list[str] = Field(default_factory=list)
    # The agent proposes; only the parties accept.
    accepted_by_client: bool = False
    accepted_by_provider: bool = False
