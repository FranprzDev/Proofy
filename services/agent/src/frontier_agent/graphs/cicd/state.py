from enum import StrEnum

from pydantic import BaseModel, Field

from frontier_agent.schemas import Ref, Verdict


class ScenarioStatus(StrEnum):
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    ERROR = "error"


class ScenarioResult(BaseModel):
    scenario_id: str
    status: ScenarioStatus
    detail: str = ""


class CicdInput(BaseModel):
    expected: Ref
    # Reference the pipeline evidence comes from.
    evidence_ref: Ref | None = None
    results: list[ScenarioResult] = Field(default_factory=list)


class CicdState(CicdInput):
    analysis: Verdict | None = None
    verdict: Verdict | None = None
    # Only validation may set it; it neither executes payments nor uses keys.
    attestation_authorized: bool = False
    observations: list[str] = Field(default_factory=list)
