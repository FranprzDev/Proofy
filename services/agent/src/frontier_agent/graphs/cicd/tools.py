"""Evidence tools for the review agent.

Tools only read evidence already produced by CI (nothing here executes PR code).
Existing pure parsers/checkers stay as backends: they parse, the LLM judges.
"""

import json
import re
from dataclasses import dataclass, field
from typing import Any

from langchain_core.tools import BaseTool, StructuredTool
from pydantic import BaseModel, Field

from frontier_agent.graphs.cicd.indentation import check_indentation as _check_indentation
from frontier_agent.graphs.cicd.state import (
    CicdState,
    Finding,
    FindingSource,
    ScenarioStatus,
    Severity,
    StaticTool,
)
from frontier_agent.schemas import Verdict

MAX_TEXT_CHARS = 30_000
ADDITIONAL_OBJECTION = "additional objection"
_CLAUSE_RE = re.compile(r"^C(\d+)$", re.IGNORECASE)
_DIFF_HEADER_RE = re.compile(r"^diff --git a/(?P<a>.+?) b/(?P<b>.+)$")


class Submission(BaseModel):
    dynamic: Verdict
    static: Verdict
    verdict: Verdict
    summary: str


@dataclass
class ReviewContext:
    """Evidence and agent outputs for one review. Findings are the CI-derived ones."""

    state: CicdState
    findings: list[Finding]
    recorded: list[Finding] = field(default_factory=list)
    submission: Submission | None = None


class _NoArgs(BaseModel):
    pass


class _ClauseArgs(BaseModel):
    id: str = Field(description="Clause id such as C1 (listed by get_plan).")


class _StaticArgs(BaseModel):
    tool: StaticTool = Field(description="Which static report to read.")


class _DiffArgs(BaseModel):
    path: str | None = Field(default=None, description="Only this file's diff; omit for all.")


class _PathArgs(BaseModel):
    path: str = Field(description="Path of a changed file in this PR.")


class _FindingArgs(BaseModel):
    severity: Severity
    message: str
    path: str | None = None
    line: int | None = None
    clause: str | None = Field(
        default=None, description="Clause id violated (e.g. C2). Required to justify blocking."
    )
    blocking: bool = False


class _VerdictArgs(BaseModel):
    dynamic: Verdict = Field(description="Was the site tested correctly for this PR.")
    static: Verdict = Field(description="Does the code meet best practices.")
    verdict: Verdict = Field(description="Overall verdict.")
    summary: str = Field(description="Short justification for the PR comment.")


def _dump(data: Any) -> str:
    return json.dumps(data, default=str, indent=1)[:MAX_TEXT_CHARS]


def _finding_dict(f: Finding) -> dict[str, Any]:
    return f.model_dump(mode="json", exclude_none=True, exclude={"blocking"}) | {
        "blocking": f.blocking
    }


def clause_ids(state: CicdState) -> dict[str, str]:
    return {f"C{i}": text for i, text in enumerate(state.clauses, start=1)}


def split_diff(diff: str) -> dict[str, str]:
    """Per-file sections of a unified git diff."""
    sections: dict[str, list[str]] = {}
    current: list[str] | None = None
    for line in diff.splitlines(keepends=True):
        m = _DIFF_HEADER_RE.match(line.rstrip("\n"))
        if m:
            current = sections.setdefault(m["b"], [])
        if current is not None:
            current.append(line)
    return {path: "".join(lines) for path, lines in sections.items()}


def build_tools(ctx: ReviewContext) -> list[BaseTool]:
    state = ctx.state

    def get_plan() -> str:
        pr = state.pull_request
        return _dump(
            {
                "milestone_id": state.expected.milestone_id,
                "contract_version": state.expected.contract_version,
                "expected_revision": state.expected.revision,
                "evidence_ref_present": state.evidence_ref is not None,
                "evidence_matches_expected": state.evidence_ref == state.expected,
                "pr": None
                if pr is None
                else {
                    "number": pr.number,
                    "title": pr.title,
                    "head_sha_matches_expected": pr.head_sha == state.expected.revision,
                    "changed_files": [f.path for f in pr.changed_files],
                },
                "expected_test_ids": state.expected_test_ids,
                "clauses": clause_ids(state),
            }
        )

    def get_clause(id: str) -> str:  # noqa: A002 - tool argument name
        clauses = clause_ids(state)
        text = clauses.get(id.upper())
        return text if text is not None else f"Unknown clause {id!r}. Known: {list(clauses)}"

    def get_e2e_results() -> str:
        results = state.results
        seen = {r.scenario_id for r in results}
        return _dump(
            {
                "results": [r.model_dump(mode="json", exclude_defaults=True) for r in results],
                "expected_without_result": [i for i in state.expected_test_ids if i not in seen],
                "not_passed": [r.scenario_id for r in results if r.status != ScenarioStatus.PASSED],
                "notes": [o for o in state.observations if "e2e" in o.lower()],
            }
        )

    def get_static_report(tool: StaticTool) -> str:
        raw = {
            StaticTool.RUFF: state.static.ruff_json,
            StaticTool.ESLINT: state.static.eslint_json,
            StaticTool.MYPY: state.static.mypy_output,
            StaticTool.TSC: state.static.tsc_output,
            StaticTool.FORMAT: "" if state.static.unformatted_files else None,
        }[tool]
        if raw is None:
            return _dump({"tool": tool.value, "provided": False})
        source = FindingSource(tool.value)
        return _dump(
            {
                "tool": tool.value,
                "provided": True,
                "parsed": tool == StaticTool.FORMAT or tool in state.static_tools_parsed,
                "findings": [_finding_dict(f) for f in ctx.findings if f.source == source],
            }
        )

    def get_pr_diff(path: str | None = None) -> str:
        pr = state.pull_request
        if pr is None or not pr.diff.strip():
            return "No diff provided."
        if path is None:
            return pr.diff[:MAX_TEXT_CHARS]
        return split_diff(pr.diff).get(path, f"No diff for {path!r}.")[:MAX_TEXT_CHARS]

    def read_changed_file(path: str) -> str:
        pr = state.pull_request
        for f in pr.changed_files if pr else []:
            if f.path == path:
                if f.content is None:
                    return f"Content of {path!r} is unavailable (deleted or binary)."
                return f.content[:MAX_TEXT_CHARS]
        return f"{path!r} is not a changed file of this PR."

    def check_indentation(path: str) -> str:
        pr = state.pull_request
        for f in pr.changed_files if pr else []:
            if f.path == path and f.content is not None:
                found = _check_indentation(path, f.content)
                return _dump([_finding_dict(x) for x in found[:50]]) if found else "No problems."
        return f"No content available for {path!r}."

    def record_finding(
        severity: Severity,
        message: str,
        path: str | None = None,
        line: int | None = None,
        clause: str | None = None,
        blocking: bool = False,
    ) -> str:
        rule = None
        if clause:
            if not _CLAUSE_RE.match(clause) or clause.upper() not in clause_ids(state):
                return f"Unknown clause {clause!r}; use get_plan for valid ids."
            rule = clause.upper()
        elif blocking:
            rule = ADDITIONAL_OBJECTION
        ctx.recorded.append(
            Finding(
                source=FindingSource.REVIEW,
                severity=severity,
                message=message,
                path=path,
                line=line,
                rule=rule,
                blocking=blocking,
            )
        )
        return "Finding recorded."

    def submit_verdict(dynamic: Verdict, static: Verdict, verdict: Verdict, summary: str) -> str:
        if ctx.submission is not None:
            return "Verdict already submitted."
        ctx.submission = Submission(
            dynamic=dynamic, static=static, verdict=verdict, summary=summary[:2000]
        )
        return "Verdict submitted. Stop."

    def tool(fn: Any, desc: str, schema: type[BaseModel]) -> BaseTool:
        return StructuredTool.from_function(
            func=fn, name=fn.__name__, description=desc, args_schema=schema
        )

    return [
        tool(
            get_plan, "Agreed plan: expected test ids, clauses, PR and reference status.", _NoArgs
        ),
        tool(get_clause, "Text of one agreed clause by id.", _ClauseArgs),
        tool(get_e2e_results, "TesterArmy results with per-step verdicts.", _NoArgs),
        tool(
            get_static_report,
            "Findings of one static report (ruff/eslint/mypy/tsc/format).",
            _StaticArgs,
        ),
        tool(get_pr_diff, "Unified diff of the PR, optionally for one file.", _DiffArgs),
        tool(read_changed_file, "Full content of a changed file.", _PathArgs),
        tool(check_indentation, "Deterministic indentation check of a changed file.", _PathArgs),
        tool(record_finding, "Record a review finding; blocking ones cite a clause.", _FindingArgs),
        tool(submit_verdict, "Submit the final verdict (once). Ends the review.", _VerdictArgs),
    ]
