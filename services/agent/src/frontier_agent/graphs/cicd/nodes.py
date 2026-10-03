import json
import re
from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, TypeAdapter, ValidationError

from frontier_agent.graphs.cicd import parsers
from frontier_agent.graphs.cicd.indentation import check_files
from frontier_agent.graphs.cicd.prompts import REVIEW_SYSTEM, REVIEW_USER
from frontier_agent.graphs.cicd.render import render_comment as _render
from frontier_agent.graphs.cicd.state import CicdState, Finding, ScenarioResult, ScenarioStatus
from frontier_agent.schemas import Verdict

MAX_DIFF_CHARS = 60_000
_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$")


class ReviewFinding(BaseModel):
    path: str | None = None
    line: int | None = None
    message: str
    blocking: bool = False
    clause: str | None = None


def ref_problems(state: CicdState) -> list[str]:
    problems: list[str] = []
    if state.evidence_ref != state.expected:
        problems.append("Evidence does not match the expected milestone, version and revision.")
    pr = state.pull_request
    if pr is not None and pr.head_sha != state.expected.revision:
        problems.append("Pull request head SHA does not match the expected revision.")
    return problems


def verify_refs(state: CicdState) -> dict[str, Any]:
    """Records reference mismatches early; authorization is still decided at the end."""
    return {"observations": [*state.observations, *ref_problems(state)]}


def evaluate_dynamic(state: CicdState) -> dict[str, Any]:
    """E2E evidence: failures block; skips, errors and missing tests are inconclusive."""
    obs = list(state.observations)
    results = list(state.results)
    if state.e2e_junit_xml is not None:
        try:
            results += parsers.parse_junit(state.e2e_junit_xml)
        except ValueError as exc:
            obs.append(str(exc))
    if not results:
        obs.append("No pipeline evidence.")
        return {"dynamic_verdict": Verdict.INCONCLUSIVE, "observations": obs}

    findings = list(state.findings)
    failed = [r for r in results if r.status == ScenarioStatus.FAILED]
    errors = [r for r in results if r.status == ScenarioStatus.ERROR]
    skipped = [r for r in results if r.status == ScenarioStatus.SKIPPED]
    seen = {r.scenario_id for r in results}
    missing = [i for i in state.expected_test_ids if i not in seen]
    for r in failed:
        findings.append(_e2e_finding(r, blocking=True))
    if errors:
        obs.append(
            "Environment or startup errors (not attributed to the code): "
            + ", ".join(r.scenario_id for r in errors)
        )
    if skipped:
        obs.append("Skipped tests: " + ", ".join(r.scenario_id for r in skipped))
    if missing:
        obs.append("Expected tests without result: " + ", ".join(missing))

    if errors:
        verdict = Verdict.INCONCLUSIVE
    elif failed:
        verdict = Verdict.NEEDS_FIX
    elif skipped or missing:
        verdict = Verdict.INCONCLUSIVE
    else:
        verdict = Verdict.FAVORABLE
    return {"dynamic_verdict": verdict, "findings": findings, "observations": obs}


def _e2e_finding(r: ScenarioResult, *, blocking: bool) -> Finding:
    return Finding(
        source="e2e",
        severity="error",
        test_id=r.scenario_id,
        blocking=blocking,
        message=r.detail or f"Test {r.scenario_id} failed.",
    )


def evaluate_static(state: CicdState) -> dict[str, Any]:
    """Lint, types, formatting and indentation. Errors block; warnings do not."""
    s, obs, findings = state.static, list(state.observations), list(state.findings)
    runners = [
        ("ruff", s.ruff_json, parsers.parse_ruff_json),
        ("eslint", s.eslint_json, parsers.parse_eslint_json),
        ("mypy", s.mypy_output, parsers.parse_mypy_output),
        ("tsc", s.tsc_output, parsers.parse_tsc_output),
    ]
    provided = bool(s.unformatted_files) or bool(
        state.pull_request and state.pull_request.changed_files
    )
    for name, raw, parse in runners:
        if raw is None:
            continue
        provided = True
        try:
            findings += parse(raw)
        except (ValueError, TypeError, AttributeError) as exc:
            obs.append(f"Could not parse {name} report: {exc}")
    findings += parsers.unformatted_findings(s.unformatted_files)
    if state.pull_request:
        findings += check_files(state.pull_request.changed_files)
    blocking = any(f.blocking for f in findings if f.source != "e2e" and f.source != "review")
    if blocking:
        verdict = Verdict.NEEDS_FIX
    elif not provided:
        # Missing static evidence is not a pass: no approval without it.
        obs.append("No static reports provided.")
        verdict = Verdict.INCONCLUSIVE
    else:
        verdict = Verdict.FAVORABLE
    return {
        "static_verdict": verdict,
        "findings": findings,
        "observations": obs,
    }


def _text(content: Any) -> str:
    if isinstance(content, str):
        return content
    return "".join(p if isinstance(p, str) else str(p.get("text", "")) for p in content)


def make_review_code(llm: BaseChatModel | None) -> Any:
    def review_code(state: CicdState) -> dict[str, Any]:
        """Optional LLM review over the diff. Bad output becomes an observation."""
        pr = state.pull_request
        if llm is None or pr is None or not pr.diff.strip():
            return {}
        obs, findings = list(state.observations), list(state.findings)
        prompt = REVIEW_USER.format(
            number=pr.number,
            title=pr.title,
            clauses="\n".join(f"- {c}" for c in state.clauses) or "(none)",
            diff=pr.diff[:MAX_DIFF_CHARS],
        )
        try:
            resp = llm.invoke([SystemMessage(REVIEW_SYSTEM), HumanMessage(prompt)])
            raw = _FENCE_RE.sub("", _text(resp.content).strip())
            items = TypeAdapter(list[ReviewFinding]).validate_json(raw)
        except (ValidationError, json.JSONDecodeError) as exc:
            obs.append(f"LLM review ignored (unparseable output): {type(exc).__name__}")
            return {"observations": obs}
        except Exception as exc:  # provider/network failure must not crash the pipeline
            obs.append(f"LLM review unavailable: {type(exc).__name__}")
            return {"observations": obs}
        for it in items:
            clause = it.clause or ("additional objection" if it.blocking else None)
            findings.append(
                Finding(
                    source="review",
                    severity="error" if it.blocking else "warning",
                    blocking=it.blocking,
                    path=it.path,
                    line=it.line,
                    rule=clause,
                    message=it.message,
                )
            )
        return {"findings": findings, "observations": obs}

    return review_code


def analyze(state: CicdState) -> dict[str, Any]:
    """Analysis: proposes a verdict from the evidence. Authorizes nothing."""
    if state.dynamic_verdict in (None, Verdict.INCONCLUSIVE):
        return {"analysis": Verdict.INCONCLUSIVE}
    if state.static_verdict == Verdict.NEEDS_FIX or any(f.blocking for f in state.findings):
        return {"analysis": Verdict.NEEDS_FIX}
    if state.static_verdict != Verdict.FAVORABLE:
        return {"analysis": Verdict.INCONCLUSIVE}
    return {"analysis": Verdict.FAVORABLE}


def validate_and_authorize(state: CicdState) -> dict[str, Any]:
    """Validation: favorable requires evidence for the same milestone, version and revision."""
    verdict = state.analysis or Verdict.INCONCLUSIVE
    if verdict == Verdict.FAVORABLE and ref_problems(state):
        verdict = Verdict.INCONCLUSIVE
    return {"verdict": verdict, "attestation_authorized": verdict == Verdict.FAVORABLE}


def render_comment(state: CicdState) -> dict[str, Any]:
    return {"pr_comment": _render(state)}
