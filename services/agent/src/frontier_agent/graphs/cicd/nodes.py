"""Graph nodes. Evidence collection and the payment gate are deterministic; only the
review node uses the LLM, and nothing it says authorizes anything by itself."""

from typing import Any

from langchain_core.language_models import BaseChatModel

from frontier_agent.graphs.cicd import parsers
from frontier_agent.graphs.cicd.agent import run_review_agent
from frontier_agent.graphs.cicd.indentation import check_files
from frontier_agent.graphs.cicd.render import render_comment as _render
from frontier_agent.graphs.cicd.state import (
    STATIC_ANALYZERS,
    CicdState,
    Finding,
    FindingSource,
    ReviewStatus,
    ScenarioResult,
    ScenarioStatus,
    Severity,
    StaticTool,
)
from frontier_agent.graphs.cicd.tools import ReviewContext
from frontier_agent.schemas import Verdict

NO_LLM_NOTE = "LLM required for review"
_RANK = {Verdict.FAVORABLE: 0, Verdict.INCONCLUSIVE: 1, Verdict.NEEDS_FIX: 2}
_DETERMINISTIC_SOURCES = {s for s in FindingSource if s != FindingSource.REVIEW}


def _worst(*verdicts: Verdict) -> Verdict:
    return max(verdicts, key=_RANK.__getitem__)


NO_COMMIT_BINDING = "No TesterArmy report.json: E2E evidence is not tied to a commit."


def ref_problems(state: CicdState) -> list[str]:
    problems: list[str] = []
    if state.evidence_ref is None:
        problems.append("No evidence reference provided.")
    elif state.evidence_ref != state.expected:
        problems.append("Evidence does not match the expected milestone, version and revision.")
    pr = state.pull_request
    if pr is not None and pr.head_sha != state.expected.revision:
        problems.append("Pull request head SHA does not match the expected revision.")
    if not state.e2e_report_parsed:
        # JUnit or pre-parsed results record no commit: they cannot prove the revision.
        problems.append(NO_COMMIT_BINDING)
    else:
        if state.e2e_commit is None:
            problems.append("E2E report records no commit; it cannot be tied to the revision.")
        elif state.e2e_commit != state.expected.revision or (
            pr is not None and state.e2e_commit != pr.head_sha
        ):
            problems.append("E2E report was produced for a different commit than the revision.")
        if state.e2e_dirty is not False:
            problems.append("E2E report comes from a dirty or unknown working tree.")
    return problems


def _e2e_finding(r: ScenarioResult) -> Finding:
    return Finding(
        source=FindingSource.E2E,
        severity=Severity.ERROR,
        test_id=r.scenario_id,
        blocking=True,
        message=r.detail or f"Test {r.scenario_id} failed.",
    )


def collect_evidence(state: CicdState) -> dict[str, Any]:
    """Parses CI outputs into results and findings (no judgment)."""
    obs = list(state.observations)
    results = list(state.results)
    findings: list[Finding] = []
    update: dict[str, Any] = {}
    if state.e2e_report_json is not None:
        try:
            rep = parsers.parse_report_json(state.e2e_report_json)
            results += rep.results
            update |= {
                "e2e_commit": rep.commit,
                "e2e_dirty": rep.dirty,
                "e2e_report_parsed": True,
            }
            obs += [f"E2E run-level error: {e}" for e in rep.run_errors]
        except ValueError as exc:
            obs.append(str(exc))
    elif state.e2e_junit_xml is not None:
        try:
            results += parsers.parse_junit(state.e2e_junit_xml)
        except ValueError as exc:
            obs.append(str(exc))
    if not results:
        obs.append("No pipeline evidence.")
    seen = {r.scenario_id for r in results}
    missing = [i for i in state.expected_test_ids if i not in seen]
    findings += [_e2e_finding(r) for r in results if r.status == ScenarioStatus.FAILED]
    errors = [r.scenario_id for r in results if r.status == ScenarioStatus.ERROR]
    skipped = [r.scenario_id for r in results if r.status == ScenarioStatus.SKIPPED]
    if errors:
        obs.append(
            "E2E environment or startup errors (not attributed to the code): " + ", ".join(errors)
        )
    if skipped:
        obs.append("E2E skipped tests: " + ", ".join(skipped))
    if missing:
        obs.append("E2E expected tests without result: " + ", ".join(missing))

    s = state.static
    parsed: list[StaticTool] = []
    runners = [
        (StaticTool.RUFF, s.ruff_json, parsers.parse_ruff_json),
        (StaticTool.ESLINT, s.eslint_json, parsers.parse_eslint_json),
        (StaticTool.MYPY, s.mypy_output, parsers.parse_mypy_output),
        (StaticTool.TSC, s.tsc_output, parsers.parse_tsc_output),
    ]
    for tool, raw, parse in runners:
        if raw is None:
            continue
        try:
            findings += parse(raw)
            parsed.append(tool)
        except (ValueError, TypeError, AttributeError) as exc:
            obs.append(f"Could not parse {tool.value} report: {exc}")
    findings += parsers.unformatted_findings(s.unformatted_files)
    if state.pull_request:
        findings += check_files(state.pull_request.changed_files)
    return update | {
        "results": results,
        "findings": findings,
        "static_tools_parsed": parsed,
        "observations": obs,
    }


def make_review(llm: BaseChatModel | None) -> Any:
    def review(state: CicdState) -> dict[str, Any]:
        """The agent reviews through tools; its output is advisory."""
        if llm is None:
            return {
                "status": ReviewStatus.LLM_REQUIRED,
                "observations": [*state.observations, NO_LLM_NOTE],
            }
        ctx = ReviewContext(state=state, findings=list(state.findings))
        obs = list(state.observations)
        try:
            run_review_agent(llm, ctx)
        except Exception as exc:  # provider/network failure must not crash the pipeline
            obs.append(f"LLM review unavailable: {type(exc).__name__}")
        sub = ctx.submission
        if sub is None:
            obs.append("The reviewer did not submit a verdict.")
        return {
            "status": ReviewStatus.REVIEWED if sub else ReviewStatus.NO_VERDICT,
            "findings": [*state.findings, *ctx.recorded],
            "analysis": sub.verdict if sub else None,
            "agent_dynamic": sub.dynamic if sub else None,
            "agent_static": sub.static if sub else None,
            "summary": sub.summary if sub else "",
            "observations": obs,
        }

    return review


def _dynamic_gate(state: CicdState) -> Verdict:
    results = state.results
    if not results:
        return Verdict.INCONCLUSIVE
    if any(r.status == ScenarioStatus.FAILED for r in results):
        return Verdict.NEEDS_FIX
    by_id = {r.scenario_id: r for r in results}
    expected_ok = all(
        i in by_id and by_id[i].status == ScenarioStatus.PASSED for i in state.expected_test_ids
    )
    if not expected_ok or any(r.status != ScenarioStatus.PASSED for r in results):
        return Verdict.INCONCLUSIVE
    return Verdict.FAVORABLE


def _static_gate(state: CicdState) -> Verdict:
    if any(
        f.blocking
        for f in state.findings
        if f.source in _DETERMINISTIC_SOURCES - {FindingSource.E2E}
    ):
        return Verdict.NEEDS_FIX
    if not any(t in STATIC_ANALYZERS for t in state.static_tools_parsed):
        return Verdict.INCONCLUSIVE
    return Verdict.FAVORABLE


def validate_and_authorize(state: CicdState) -> dict[str, Any]:
    """Deterministic payment gate. Favorable (and authorization) needs every condition."""
    obs = list(state.observations)
    refs = ref_problems(state)
    obs += refs
    dyn = _dynamic_gate(state)
    sta = _static_gate(state)
    if state.status == ReviewStatus.LLM_REQUIRED:
        return {
            "verdict": Verdict.INCONCLUSIVE,
            "dynamic_verdict": dyn,
            "static_verdict": sta,
            "attestation_authorized": False,
            "observations": obs,
        }
    agent = state.analysis or Verdict.INCONCLUSIVE
    review_blocking = any(f.blocking for f in state.findings if f.source == FindingSource.REVIEW)
    dynamic = _worst(dyn, state.agent_dynamic or Verdict.INCONCLUSIVE)
    static = _worst(sta, state.agent_static or Verdict.INCONCLUSIVE)
    verdict = _worst(
        agent,
        dyn,
        sta,
        Verdict.NEEDS_FIX if review_blocking else Verdict.FAVORABLE,
    )
    # Evidence for another revision proves nothing: inconclusive. Evidence that is merely not
    # commit-bound still surfaces real failures (needs_fix) but can never authorize payment.
    if any(p != NO_COMMIT_BINDING for p in refs) or (refs and verdict == Verdict.FAVORABLE):
        verdict = Verdict.INCONCLUSIVE
    if agent == Verdict.FAVORABLE and verdict != Verdict.FAVORABLE:
        obs.append(f"Gate overrode the reviewer's favorable verdict: {verdict.value}.")
    if sta == Verdict.INCONCLUSIVE and not any(f.blocking for f in state.findings):
        obs.append("No static reports (ruff, eslint, mypy, tsc) were provided.")
    return {
        "verdict": verdict,
        "dynamic_verdict": dynamic,
        "static_verdict": static,
        "attestation_authorized": verdict == Verdict.FAVORABLE,
        "observations": obs,
    }


def render_comment(state: CicdState) -> dict[str, Any]:
    return {"pr_comment": _render(state)}
