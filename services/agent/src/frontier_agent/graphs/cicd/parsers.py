"""Pure parsers turning tool outputs into results and findings."""

import json
import re
from typing import Any, Literal

from defusedxml import ElementTree
from defusedxml.ElementTree import ParseError

from frontier_agent.graphs.cicd.state import Finding, ScenarioResult, ScenarioStatus

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
            source="ruff",
            severity="error",
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
                    source="eslint",
                    severity="error" if is_error else "warning",
                    blocking=is_error,
                    path=f.get("filePath"),
                    line=msg.get("line"),
                    rule=msg.get("ruleId"),
                    message=msg.get("message", ""),
                )
            )
    return out


def _parse_text(
    raw: str, pattern: re.Pattern[str], source: Literal["mypy", "tsc"]
) -> list[Finding]:
    out: list[Finding] = []
    for ln in raw.splitlines():
        m = pattern.match(ln.strip())
        if not m:
            continue
        is_error = m["sev"] == "error"
        out.append(
            Finding(
                source=source,
                severity="error" if is_error else "warning",
                blocking=is_error,
                path=m["path"],
                line=int(m["line"]),
                rule=m["code"],
                message=m["msg"],
            )
        )
    return out


def parse_mypy_output(raw: str) -> list[Finding]:
    return _parse_text(raw, _MYPY_RE, "mypy")


def parse_tsc_output(raw: str) -> list[Finding]:
    return _parse_text(raw, _TSC_RE, "tsc")


def unformatted_findings(paths: list[str]) -> list[Finding]:
    return [
        Finding(
            source="format",
            severity="error",
            blocking=True,
            path=p,
            message="File is not formatted (run the formatter).",
        )
        for p in paths
    ]
