"""Pure parsers turning tool outputs into results and findings."""

import json
import re
from typing import Any, NamedTuple

from defusedxml import ElementTree
from defusedxml.ElementTree import ParseError

from frontier_agent.graphs.cicd.state import (
    E2EStep,
    E2EStepVerdict,
    Finding,
    FindingSource,
    ScenarioResult,
    ScenarioStatus,
    Severity,
)

TEST_ID_RE = re.compile(r"^\s*(TC-\d+)\s*[:\-]?\s*")
STARTUP_MARKER = "APP_UNREACHABLE"

_MYPY_RE = re.compile(
    r"^(?P<path>[^\s:][^:]*):(?P<line>\d+):(?:\d+:)? (?P<sev>error|warning): "
    r"(?P<msg>.*?)(?:\s+\[(?P<code>[\w-]+)\])?$"
)
_TSC_RE = re.compile(
    r"^(?P<path>.+?)\((?P<line>\d+),\d+\): (?P<sev>error|warning) (?P<code>TS\d+): (?P<msg>.*)$"
)


def parse_junit(xml: str) -> list[ScenarioResult]:
    """One result per testcase. Raises ValueError on malformed XML."""
    try:
        root = ElementTree.fromstring(xml)
    except ParseError as exc:
        raise ValueError(f"Invalid JUnit XML: {exc}") from exc
    results: list[ScenarioResult] = []
    for case in root.iter("testcase"):
        name = case.get("name", "")
        m = TEST_ID_RE.match(name)
        scenario_id = m.group(1) if m else name
        status, detail = ScenarioStatus.PASSED, ""
        for child in case:
            if child.tag not in ("failure", "error", "skipped"):
                continue
            detail = (child.get("message") or (child.text or "").strip())[:500]
            blob = f"{name} {child.get('type', '')} {detail} {child.text or ''}"
            if child.tag == "skipped":
                status = ScenarioStatus.SKIPPED
            elif child.tag == "error" or STARTUP_MARKER in blob:
                status = ScenarioStatus.ERROR
            else:
                status = ScenarioStatus.FAILED
            break
        results.append(ScenarioResult(scenario_id=scenario_id, status=status, detail=detail))
    return results


def parse_ruff_json(raw: str) -> list[Finding]:
    items: list[dict[str, Any]] = json.loads(raw)
    return [
        Finding(
            source=FindingSource.RUFF,
            severity=Severity.ERROR,
            blocking=True,
            path=i.get("filename"),
            line=(i.get("location") or {}).get("row"),
            rule=i.get("code"),
            message=i.get("message", ""),
        )
        for i in items
    ]


def parse_eslint_json(raw: str) -> list[Finding]:
    """ESLint severity 2 = error (blocking), 1 = warning."""
    out: list[Finding] = []
    files: list[dict[str, Any]] = json.loads(raw)
    for f in files:
        for msg in f.get("messages", []):
            is_error = msg.get("severity", 1) >= 2
            out.append(
                Finding(
                    source=FindingSource.ESLINT,
                    severity=Severity.ERROR if is_error else Severity.WARNING,
                    blocking=is_error,
                    path=f.get("filePath"),
                    line=msg.get("line"),
                    rule=msg.get("ruleId"),
                    message=msg.get("message", ""),
                )
            )
    return out


def _parse_text(raw: str, pattern: re.Pattern[str], source: FindingSource) -> list[Finding]:
    out: list[Finding] = []
    for ln in raw.splitlines():
        m = pattern.match(ln.strip())
        if not m:
            continue
        is_error = m["sev"] == "error"
        out.append(
            Finding(
                source=source,
                severity=Severity.ERROR if is_error else Severity.WARNING,
                blocking=is_error,
                path=m["path"],
                line=int(m["line"]),
                rule=m["code"],
                message=m["msg"],
            )
        )
    return out


def parse_mypy_output(raw: str) -> list[Finding]:
    return _parse_text(raw, _MYPY_RE, FindingSource.MYPY)


def parse_tsc_output(raw: str) -> list[Finding]:
    return _parse_text(raw, _TSC_RE, FindingSource.TSC)


def unformatted_findings(paths: list[str]) -> list[Finding]:
    return [
        Finding(
            source=FindingSource.FORMAT,
            severity=Severity.ERROR,
            blocking=True,
            path=p,
            message="File is not formatted (run the formatter).",
        )
        for p in paths
    ]


_ENV_CODES = (
    STARTUP_MARKER,
    "ENVIRONMENT_UNAVAILABLE",
    "AUTH_CREDENTIAL_UNAVAILABLE",
    "AUTOMATION_UNSUPPORTED",
    "POLICY_DENIED",
)
_STEP_TITLE_KEYS = ("label", "title", "instruction", "api")


def _error_text(err: Any) -> str:
    if isinstance(err, dict):
        code, msg = err.get("code"), err.get("message")
        return " ".join(str(x) for x in (code, msg) if x)[:500]
    return str(err)[:500] if err else ""


def _parse_steps(result: dict[str, Any]) -> list[E2EStep]:
    attempts = result.get("attempts") or []
    steps: list[E2EStep] = []
    for raw in (attempts[-1].get("steps") or []) if attempts else []:
        try:
            verdict = E2EStepVerdict(str(raw.get("status", "")))
        except ValueError:
            continue
        title = next((str(raw[k]) for k in _STEP_TITLE_KEYS if raw.get(k)), "")
        detail = _error_text(raw.get("error")) or str(raw.get("summary") or "")[:500]
        steps.append(E2EStep(title=title[:200], verdict=verdict, detail=detail))
    return steps


class ParsedReport(NamedTuple):
    results: list[ScenarioResult]
    run_errors: list[str]
    commit: str | None
    dirty: bool | None
    run_status: str


def parse_report_json(raw: str) -> ParsedReport:
    """TesterArmy `report.json` (schemaVersion report-1). Raises ValueError if invalid.

    `failed` with a blocked step or an environment error code is ERROR (the app or the
    environment, not the code under review); `interrupted` is ERROR; `flaky` passed.
    """
    try:
        data = json.loads(raw)
        run = data["run"]
        raw_results = run.get("results") or []
        run_errors = [_error_text(e) for e in run.get("errors") or []]
        vcs = run.get("vcs") or {}
        commit = vcs.get("commit")
        dirty = vcs.get("dirty")
        run_status = str(run.get("status", ""))
    except (json.JSONDecodeError, KeyError, TypeError, AttributeError) as exc:
        raise ValueError(f"Invalid e2e report.json: {exc!r}") from exc
    results: list[ScenarioResult] = []
    for item in raw_results:
        if item.get("selected") is False:
            continue
        title_path = [str(t) for t in item.get("titlePath") or []]
        title = " > ".join(title_path)
        m = re.search(r"TC-\d+", title)
        steps = _parse_steps(item)
        attempts = item.get("attempts") or []
        detail = _error_text(item.get("error")) or (
            _error_text(attempts[-1].get("error")) if attempts else ""
        )
        status_raw = str(item.get("status", ""))
        if status_raw in ("passed", "flaky"):
            status = ScenarioStatus.PASSED
        elif status_raw == "skipped":
            status = ScenarioStatus.SKIPPED
        elif status_raw == "failed":
            env = any(s.verdict == E2EStepVerdict.BLOCKED for s in steps) or any(
                code in detail for code in _ENV_CODES
            )
            status = ScenarioStatus.ERROR if env else ScenarioStatus.FAILED
        else:
            status = ScenarioStatus.ERROR
            detail = detail or f"Test ended as {status_raw or 'unknown'}."
        results.append(
            ScenarioResult(
                scenario_id=m.group(0) if m else (title or "unnamed"),
                status=status,
                detail=detail,
                steps=steps,
            )
        )
    return ParsedReport(
        results,
        run_errors,
        str(commit) if commit else None,
        dirty if isinstance(dirty, bool) else None,
        run_status,
    )
