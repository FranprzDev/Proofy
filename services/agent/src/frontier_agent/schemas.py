"""Contracts shared between agents and Next.js (exported to OpenAPI)."""

from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class Verdict(StrEnum):
    FAVORABLE = "favorable"
    NEEDS_FIX = "needs_fix"
    INCONCLUSIVE = "inconclusive"


class DocumentStatus(StrEnum):
    PENDING = "pending"
    NEEDS_CLARIFICATION = "needs_clarification"
    PROPOSAL = "proposal"
    # No LLM configured: the document agent never invents test cases without a model.
    LLM_UNAVAILABLE = "llm_unavailable"


class TestKind(StrEnum):
    __test__ = False  # not a pytest class

    UI = "ui"
    API = "api"


class Priority(StrEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Runner(StrEnum):
    """Who executes a planned case (`plan.json`)."""

    TESTERARMY = "testerarmy"
    MANUAL_API = "manual-api"


class TesterArmyTopic(StrEnum):
    """Bundled TesterArmy reference topics the document agent can consult."""

    OVERVIEW = "overview"
    WRITING_TESTS = "writing_tests"
    AGENT = "agent"
    RUNNING = "running"


class Ref(BaseModel):
    """Identifies what is evaluated against: milestone, agreed version and exact revision."""

    model_config = ConfigDict(frozen=True)

    milestone_id: str
    contract_version: str
    revision: str
