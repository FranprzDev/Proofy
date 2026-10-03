from enum import StrEnum
from typing import Literal

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


class ChangedFile(BaseModel):
    path: str
    # None = content unavailable (deleted/binary); not checked for indentation.
    content: str | None = None


class PullRequest(BaseModel):
    number: int
    head_sha: str
    base_sha: str = ""
    title: str = ""
    diff: str = ""
    changed_files: list[ChangedFile] = Field(default_factory=list)


class StaticReports(BaseModel):
    """Raw tool outputs; None = the tool was not run."""

    ruff_json: str | None = None
    eslint_json: str | None = None
    mypy_output: str | None = None
    tsc_output: str | None = None
    # Files reported by `ruff format --check` / `prettier --check`.
    unformatted_files: list[str] = Field(default_factory=list)


FindingSource = Literal["e2e", "ruff", "eslint", "mypy", "tsc", "format", "indentation", "review"]


class Finding(BaseModel):
    source: FindingSource
    severity: Literal["error", "warning", "info"]
    message: str
    path: str | None = None
    line: int | None = None
    rule: str | None = None
    test_id: str | None = None
    blocking: bool = False


class CicdInput(BaseModel):
    expected: Ref
    # Reference the pipeline evidence comes from.
    evidence_ref: Ref | None = None
    pull_request: PullRequest | None = None
    # Test-case ids from the agreed plan (plan.json); each needs a result.
    expected_test_ids: list[str] = Field(default_factory=list)
    # JUnit XML from the TesterArmy e2e run (`.e2e/junit.xml`).
    e2e_junit_xml: str | None = None
    # Pre-parsed alternative to `e2e_junit_xml`.
    results: list[ScenarioResult] = Field(default_factory=list)
    static: StaticReports = Field(default_factory=StaticReports)
    # Agreed clauses the LLM reviewer may cite in blocking objections.
    clauses: list[str] = Field(default_factory=list)


class CicdState(CicdInput):
    findings: list[Finding] = Field(default_factory=list)
    dynamic_verdict: Verdict | None = None
    static_verdict: Verdict | None = None
    analysis: Verdict | None = None
    verdict: Verdict | None = None
    # Only validation may set it; it neither executes payments nor uses keys.
    attestation_authorized: bool = False
    observations: list[str] = Field(default_factory=list)
    # Markdown for the provider (PR comment).
    pr_comment: str = ""
