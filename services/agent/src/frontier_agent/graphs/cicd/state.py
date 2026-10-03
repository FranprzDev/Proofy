from enum import StrEnum

from pydantic import BaseModel, Field

from frontier_agent.schemas import Ref, Verdict


class ScenarioStatus(StrEnum):
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    ERROR = "error"


class E2EStepVerdict(StrEnum):
    """Per-step verdict of a TesterArmy agent step (`report.json`)."""

    PASSED = "passed"
    FAILED = "failed"
    BLOCKED = "blocked"
    EXHAUSTED = "exhausted"
    SKIPPED = "skipped"


class FindingSource(StrEnum):
    E2E = "e2e"
    RUFF = "ruff"
    ESLINT = "eslint"
    MYPY = "mypy"
    TSC = "tsc"
    FORMAT = "format"
    INDENTATION = "indentation"
    REVIEW = "review"


class Severity(StrEnum):
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


class StaticTool(StrEnum):
    RUFF = "ruff"
    ESLINT = "eslint"
    MYPY = "mypy"
    TSC = "tsc"
    FORMAT = "format"


# Reports that count as real static evidence (formatting alone does not).
STATIC_ANALYZERS = (StaticTool.RUFF, StaticTool.ESLINT, StaticTool.MYPY, StaticTool.TSC)


class ReviewStatus(StrEnum):
    REVIEWED = "reviewed"
    LLM_REQUIRED = "llm_required"
    NO_VERDICT = "no_verdict"


class E2EStep(BaseModel):
    title: str = ""
    verdict: E2EStepVerdict
    detail: str = ""


class ScenarioResult(BaseModel):
    scenario_id: str
    status: ScenarioStatus
    detail: str = ""
    steps: list[E2EStep] = Field(default_factory=list)


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


class Finding(BaseModel):
    source: FindingSource
    severity: Severity
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
    # Test-case ids from the agreed plan (plan.json); each needs a passing result.
    expected_test_ids: list[str] = Field(default_factory=list)
    # TesterArmy `.e2e/report.json` (preferred) or `.e2e/junit.xml`.
    e2e_report_json: str | None = None
    e2e_junit_xml: str | None = None
    # Pre-parsed alternative to the raw reports.
    results: list[ScenarioResult] = Field(default_factory=list)
    static: StaticReports = Field(default_factory=StaticReports)
    # Agreed clauses (ids C1, C2, ... in order) the reviewer may cite in blocking objections.
    clauses: list[str] = Field(default_factory=list)


class CicdState(CicdInput):
    status: ReviewStatus | None = None
    findings: list[Finding] = Field(default_factory=list)
    # VCS facts of the TesterArmy report (None when no report.json was provided/recorded).
    e2e_commit: str | None = None
    e2e_dirty: bool | None = None
    e2e_report_parsed: bool = False
    # Static analyzers whose report was provided and parsed.
    static_tools_parsed: list[StaticTool] = Field(default_factory=list)
    # What the reviewing agent submitted (never trusted on its own).
    analysis: Verdict | None = None
    agent_dynamic: Verdict | None = None
    agent_static: Verdict | None = None
    summary: str = ""
    dynamic_verdict: Verdict | None = None
    static_verdict: Verdict | None = None
    verdict: Verdict | None = None
    # Only the deterministic gate may set it; it neither executes payments nor uses keys.
    attestation_authorized: bool = False
    observations: list[str] = Field(default_factory=list)
    # Markdown for the provider (PR comment).
    pr_comment: str = ""
