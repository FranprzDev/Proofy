"""Tools of the document agent. Results are strings the model reads; state goes to a Collector."""

import json
import re
from collections.abc import Callable
from dataclasses import dataclass, field
from importlib import resources
from pathlib import Path
from typing import Any

from langchain_core.tools import BaseTool, StructuredTool
from pydantic import BaseModel, Field, ValidationError, field_validator

from frontier_agent import testerarmy_cli
from frontier_agent.config import Settings
from frontier_agent.graphs.document.state import Ambiguity, TestCase
from frontier_agent.schemas import Priority, TesterArmyTopic, TestKind
from frontier_agent.testerarmy import render_suite, safe_name

NOT_CONFIGURED = (
    "TesterArmy project not configured (set E2E_PROJECT_DIR to the folder with e2e.config.ts). "
    "Rely on the reference and the document only; do not guess on-screen wording."
)
_HEADING = re.compile(r"^\s{0,3}#{1,6}\s+(.*\S)\s*$")
_BULLET = re.compile(r"^\s*(?:[-*+]|\d+[.)])\s+")
_SECRET_KEY = re.compile(r"pass(word)?|secret|token|api[_-]?key", re.IGNORECASE)
_PLACEHOLDER = re.compile(r"\{(\w+)\}")
_RESOURCE_FILES = {
    TesterArmyTopic.OVERVIEW: "overview.md",
    TesterArmyTopic.WRITING_TESTS: "writing-tests.md",
    TesterArmyTopic.AGENT: "agent.md",
    TesterArmyTopic.RUNNING: "running.md",
}
MAX_TOOL_TEXT = 12000


def norm_clause(text: str) -> str:
    t = _BULLET.sub("", text.strip()).casefold()
    return re.sub(r"\s+", " ", t).strip(" .;:")


def clause_matches(a: str, b: str) -> bool:
    x, y = norm_clause(a), norm_clause(b)
    if not x or not y:
        return False
    return x == y or (min(len(x), len(y)) >= 12 and (x in y or y in x))


@dataclass(frozen=True)
class Section:
    title: str
    lines: tuple[str, ...]

    @property
    def text(self) -> str:
        return "\n".join(self.lines).strip()


def split_sections(document: str) -> list[Section]:
    """Structural split on Markdown headings (no interpretation of content)."""
    sections: list[tuple[str, list[str]]] = []
    current: tuple[str, list[str]] = ("(preamble)", [])
    in_code = False
    for raw in document.splitlines():
        if raw.strip().startswith("```"):
            in_code = not in_code
        m = None if in_code else _HEADING.match(raw)
        if m:
            sections.append(current)
            current = (m.group(1), [])
        else:
            current[1].append(raw)
    sections.append(current)
    return [Section(t, tuple(ln)) for t, ln in sections if "".join(ln).strip()]


def extract_clauses(document: str) -> list[str]:
    """Every non-heading, non-code line, bullet marker removed."""
    clauses: list[str] = []
    in_code = False
    for raw in document.splitlines():
        line = raw.strip()
        if line.startswith("```"):
            in_code = not in_code
            continue
        if not line or in_code or _HEADING.match(raw):
            continue
        clause = _BULLET.sub("", line).strip()
        if clause:
            clauses.append(clause)
    return clauses


# ---- tool arguments -------------------------------------------------------------------------


class ReadDocumentArgs(BaseModel):
    section: int | None = Field(
        default=None,
        description="1-based section number. Omit to get the outline of all sections.",
    )


class ReferenceArgs(BaseModel):
    topic: TesterArmyTopic = Field(description="Which TesterArmy reference to read.")


class FlagAmbiguityArgs(BaseModel):
    clause: str = Field(min_length=1, description="The ambiguous clause, quoted from the document.")
    reason: str = Field(min_length=1, description="What is missing or unmeasurable.")
    suggested_question: str = Field(min_length=1, description="Question to ask the parties.")


class SubmitTestCaseArgs(BaseModel):
    clause: str = Field(min_length=1, description="Source clause, quoted from the document.")
    title: str = Field(min_length=1)
    objective: str = Field(min_length=1)
    preconditions: list[str] = Field(default_factory=list)
    steps: list[str] = Field(
        min_length=1, description="One user goal per item, as said out loud (agent.act)."
    )
    expected_results: list[str] = Field(
        min_length=1, description="Observable on-screen conditions (agent.assert)."
    )
    start_path: str = Field(default="/", description="App path where the test starts.")
    kind: TestKind = TestKind.UI
    priority: Priority = Priority.MEDIUM
    test_data: dict[str, str] = Field(
        default_factory=dict,
        description="Non-secret values for {placeholders} used in steps (params).",
    )
    credentials_role: str | None = Field(
        default=None,
        description="Name of a configured credentials entry; use {username}/{password} in steps.",
    )

    @field_validator("start_path")
    @classmethod
    def _path(cls, v: str) -> str:
        if not v.startswith("/"):
            raise ValueError("start_path must start with '/'")
        return v


class OutOfScopeArgs(BaseModel):
    clause: str = Field(min_length=1)
    reason: str = Field(min_length=1)


class ExploreArgs(BaseModel):
    goal: str = Field(min_length=1, description="One sentence: the area to explore.")
    max_steps: int = Field(default=8, ge=1, le=12)


class DryRunArgs(BaseModel):
    test_id: str = Field(pattern=r"^TC-\d{3,}$", description="Case id, e.g. TC-001.")


class NoArgs(BaseModel):
    pass


# ---- collector --------------------------------------------------------------------------------


@dataclass
class Collector:
    """Per-invocation accumulator for everything the tools produce (no globals)."""

    contract_id: str
    contract_version: str
    document: str
    settings: Settings
    sections: list[Section] = field(default_factory=list)
    clauses: list[str] = field(default_factory=list)
    ambiguities: list[Ambiguity] = field(default_factory=list)
    cases: list[TestCase] = field(default_factory=list)
    out_of_scope: list[tuple[str, str]] = field(default_factory=list)
    finished: bool = False
    validated_fingerprint: str | None = None

    def __post_init__(self) -> None:
        self.sections = split_sections(self.document)
        self.clauses = extract_clauses(self.document)

    @property
    def project_dir(self) -> str | None:
        return self.settings.e2e_project_dir or None

    def fingerprint(self) -> str:
        return json.dumps([c.model_dump(mode="json") for c in self.cases], sort_keys=True)

    def out_of_scope_lines(self) -> list[str]:
        return [f"{c} ({r})" for c, r in self.out_of_scope]

    def render(self) -> dict[str, str]:
        return render_suite(
            self.cases, self.contract_id, self.contract_version, self.out_of_scope_lines()
        )

    def uncovered(self) -> list[str]:
        refs = (
            [c.clause for c in self.cases]
            + [a.clause for a in self.ambiguities]
            + [c for c, _ in self.out_of_scope]
        )
        return [c for c in self.clauses if not any(clause_matches(c, r) for r in refs)]


# ---- tool implementations -----------------------------------------------------------------------


def _clip(text: str) -> str:
    return text if len(text) <= MAX_TOOL_TEXT else text[:MAX_TOOL_TEXT] + "\n...[truncated]"


def structural_problems(col: Collector) -> list[str]:
    problems: list[str] = []
    ids = [c.id for c in col.cases]
    if len(set(ids)) != len(ids):
        problems.append("Duplicate test case ids.")
    for c in col.cases:
        if not c.steps or not c.expected_results:
            problems.append(f"{c.id}: steps and expected_results must be non-empty.")
    if col.uncovered():
        listing = "; ".join(f"'{c}'" for c in col.uncovered())
        problems.append(
            "Clauses with no test case, ambiguity or out-of-scope entry: "
            f"{listing}. Submit a case, flag_ambiguity or mark_out_of_scope for each."
        )
    return problems


def _write_suite(col: Collector) -> tuple[Path, list[str]] | str:
    """Write the generated UI file under <project>/tests/generated. Returns (file, rel paths)."""
    assert col.project_dir
    files = col.render()
    name = f"{safe_name(col.contract_id)}.e2e.ts"
    if f"tests/{name}" not in files:
        return "The suite has no UI test cases to write."
    target = Path(col.project_dir) / "tests" / "generated" / name
    try:
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(files[f"tests/{name}"], encoding="utf-8")
    except OSError as exc:
        return f"Could not write {target}: {exc}"
    return target, [f"tests/generated/{name}"]


def build_tools(col: Collector) -> list[BaseTool]:
    settings = col.settings

    def read_document(section: int | None = None) -> str:
        if not col.sections:
            return "The document is empty."
        if section is None:
            rows = [
                f"{i}. {s.title} ({sum(1 for ln in s.lines if ln.strip())} lines)"
                for i, s in enumerate(col.sections, 1)
            ]
            return "Document outline (call read_document(section=N) to read each):\n" + "\n".join(
                rows
            )
        if not 1 <= section <= len(col.sections):
            return f"Error: section must be between 1 and {len(col.sections)}."
        s = col.sections[section - 1]
        return _clip(f"## {s.title}\n{s.text}")

    def testerarmy_reference(topic: TesterArmyTopic) -> str:
        name = _RESOURCE_FILES[topic]
        text = (
            resources.files("frontier_agent.resources.testerarmy")
            .joinpath(name)
            .read_text(encoding="utf-8")
        )
        return _clip(text)

    def flag_ambiguity(clause: str, reason: str, suggested_question: str) -> str:
        col.ambiguities.append(
            Ambiguity(clause=clause, reason=reason, suggested_question=suggested_question)
        )
        return "Ambiguity recorded. No test case will be produced until the parties answer."

    def submit_test_case(**kwargs: Any) -> str:
        args = SubmitTestCaseArgs.model_validate(kwargs)
        if not any(clause_matches(args.clause, c) for c in col.clauses):
            return (
                "Error: 'clause' must quote a clause of the document (use read_document). "
                "Never invent requirements."
            )
        blank = [s for s in [*args.steps, *args.expected_results] if not s.strip()]
        if blank:
            return "Error: steps and expected_results must not contain blank items."
        for k in args.test_data:
            if _SECRET_KEY.search(k):
                return (
                    f"Error: test_data key '{k}' looks like a secret. Never put secrets "
                    "in test data; use credentials_role with {username}/{password}."
                )
        used = {n for s in args.steps for n in _PLACEHOLDER.findall(s)}
        unused = [k for k in args.test_data if k not in used]
        if unused:
            return f"Error: test_data keys not used as {{placeholders}} in steps: {unused}."
        allowed = set(args.test_data) | (
            {"username", "password"} if args.credentials_role else set()
        )
        unresolved = sorted(used - allowed)
        if unresolved:
            return (
                f"Error: placeholders without a value: {unresolved}. Add them to test_data "
                "or set credentials_role for {username}/{password}."
            )
        case = TestCase(id=f"TC-{len(col.cases) + 1:03d}", **args.model_dump())
        col.cases.append(case)
        return f"Accepted as {case.id}."

    def mark_out_of_scope(clause: str, reason: str) -> str:
        col.out_of_scope.append((clause, reason))
        return "Recorded as out of scope."

    def explore_app(goal: str, max_steps: int = 8) -> str:
        if not col.project_dir:
            return NOT_CONFIGURED
        res = testerarmy_cli.run_e2e_cli(
            ["explore", goal.lstrip("- "), "--max-steps", str(max_steps)],
            col.project_dir,
            settings.e2e_cli_timeout_s,
        )
        report = testerarmy_cli.read_report(col.project_dir)
        explore = ((report or {}).get("run") or {}).get("explore")
        if not isinstance(explore, dict):
            tail = (res.stderr or res.stdout)[-1500:]
            return f"Exploration produced no report (exit {res.returncode}): {tail}"
        return _clip(summarize_explore(explore, res.returncode))

    def validate_suite() -> str:
        problems = structural_problems(col)
        if problems:
            return "Suite is NOT valid:\n- " + "\n- ".join(problems)
        notes = [f"Structure OK: {len(col.cases)} case(s), all clauses accounted for."]
        if not col.project_dir:
            return "\n".join(notes + [f"CLI validation skipped: {NOT_CONFIGURED}"])
        written = _write_suite(col)
        if isinstance(written, str):
            col.validated_fingerprint = col.fingerprint()
            return "\n".join(notes + [written])
        target, rels = written
        res = testerarmy_cli.run_e2e_cli(
            ["list", *rels, "--reporter", "json"], col.project_dir, settings.e2e_cli_timeout_s
        )
        if res.returncode != 0:
            return "\n".join(
                notes
                + [
                    f"`e2e list` FAILED (exit {res.returncode}). Fix the suite:",
                    _clip((res.stderr or res.stdout)[-3000:]),
                ]
            )
        listed = list_titles(res.stdout)
        missing = [c.id for c in col.cases if c.kind == TestKind.UI and c.id not in res.stdout]
        if missing:
            return "\n".join(notes + [f"`e2e list` did not list: {missing}.", res.stdout[-1500:]])
        col.validated_fingerprint = col.fingerprint()
        return "\n".join(notes + [f"`e2e list` OK for {target.name}:"] + [f"- {t}" for t in listed])

    def dry_run_case(test_id: str) -> str:
        if not settings.e2e_allow_run:
            return "dry_run_case is disabled (E2E_ALLOW_RUN=false)."
        if not col.project_dir:
            return NOT_CONFIGURED
        if not any(c.id == test_id for c in col.cases):
            return f"Error: unknown test id {test_id}."
        written = _write_suite(col)
        if isinstance(written, str):
            return written
        _, rels = written
        res = testerarmy_cli.run_e2e_cli(
            ["run", *rels, "--grep", re.escape(f"{test_id}:"), "--reporter", "list"],
            col.project_dir,
            settings.e2e_cli_timeout_s,
        )
        report = testerarmy_cli.read_report(col.project_dir)
        if report is None:
            return f"No report (exit {res.returncode}): {(res.stderr or res.stdout)[-1500:]}"
        return _clip(summarize_run(report, test_id, res.returncode))

    def finish() -> str:
        problems = structural_problems(col) if not col.ambiguities else []
        if problems:
            return "Cannot finish:\n- " + "\n- ".join(problems)
        if col.cases and col.project_dir and col.validated_fingerprint != col.fingerprint():
            return "Cannot finish: call validate_suite() and make it pass for the current suite."
        col.finished = True
        return "Done."

    def make(
        fn: Callable[..., str], name: str, desc: str, schema: type[BaseModel]
    ) -> StructuredTool:
        return StructuredTool.from_function(
            func=fn, name=name, description=desc, args_schema=schema, handle_tool_error=True
        )

    tools: list[BaseTool] = [
        make(read_document, "read_document", "Read the document by section.", ReadDocumentArgs),
        make(
            testerarmy_reference,
            "testerarmy_reference",
            "Read a bundled TesterArmy e2e reference topic.",
            ReferenceArgs,
        ),
        make(
            explore_app,
            "explore_app",
            "Run `e2e explore` on the real app to learn real paths and on-screen wording.",
            ExploreArgs,
        ),
        make(
            flag_ambiguity,
            "flag_ambiguity",
            "Flag a vague/incomplete clause instead of guessing. Any flag blocks the proposal.",
            FlagAmbiguityArgs,
        ),
        make(
            submit_test_case,
            "submit_test_case",
            "Submit one test case for a clause. Returns its id or a validation error.",
            SubmitTestCaseArgs,
        ),
        make(
            mark_out_of_scope,
            "mark_out_of_scope",
            "Mark a clause that cannot be verified through the app (payment, legal).",
            OutOfScopeArgs,
        ),
        make(
            validate_suite,
            "validate_suite",
            "Validate the suite structure and, when configured, with `e2e list`.",
            NoArgs,
        ),
    ]
    if settings.e2e_allow_run:
        tools.append(
            make(
                dry_run_case,
                "dry_run_case",
                "Run one case against the real app (costs model calls); returns step results.",
                DryRunArgs,
            )
        )
    tools.append(make(finish, "finish", "Finish once every clause is accounted for.", NoArgs))
    return tools


def run_tool(tools: dict[str, BaseTool], name: str, args: dict[str, Any]) -> str:
    """Execute a tool call; every failure becomes text for the model to self-correct."""
    tool = tools.get(name)
    if tool is None:
        return f"Error: unknown tool '{name}'. Available: {', '.join(sorted(tools))}."
    try:
        return str(tool.invoke(args))
    except ValidationError as exc:
        return "Error: invalid arguments:\n" + "\n".join(
            f"- {'.'.join(str(p) for p in e['loc'])}: {e['msg']}" for e in exc.errors()
        )
    except Exception as exc:  # noqa: BLE001 - tool failures are reported to the model
        return f"Error: {type(exc).__name__}: {exc}"


# ---- CLI report summaries ----


def list_titles(stdout: str) -> list[str]:
    try:
        data = json.loads(stdout)
    except ValueError:
        return [ln.strip() for ln in stdout.splitlines() if ln.strip()][:50]
    out: list[str] = []
    for pair in data.get("pairs", []) if isinstance(data, dict) else []:
        if isinstance(pair, dict):
            t = pair.get("title") or pair.get("titlePath") or pair.get("name") or pair
            out.append(" > ".join(t) if isinstance(t, list) else str(t))
    return out


def summarize_explore(explore: dict[str, Any], exit_code: int) -> str:
    lines = [
        f"Exploration ended: {explore.get('ended', '?')} (exit {exit_code}).",
        f"Assessment: {explore.get('summary', '')}",
        "Steps:",
    ]
    for s in explore.get("steps", []) or []:
        lines.append(f"- [{s.get('status')}] {s.get('title')}: {s.get('summary', '')}")
    paths = sorted({str(f["path"]) for f in explore.get("findings", []) or [] if f.get("path")})
    if paths:
        lines.append("Screens/paths seen in findings: " + ", ".join(paths))
    lines.append("Findings:")
    for f in explore.get("findings", []) or []:
        lines.append(
            f"- {f.get('kind')} sev {f.get('severity')} at {f.get('path', '?')}: "
            f"{f.get('title')} (expected: {f.get('expected')}; actual: {f.get('actual')})"
        )
    return "\n".join(lines)


def summarize_run(report: dict[str, Any], test_id: str, exit_code: int) -> str:
    run = report.get("run") or {}
    lines = [f"Run status: {run.get('status', '?')} (exit {exit_code})."]
    matched = False
    for r in run.get("results", []) or []:
        title = " ".join(str(p) for p in r.get("titlePath", []))
        if test_id not in title:
            continue
        matched = True
        lines.append(f"{title}: {r.get('status')}")
        attempts = r.get("attempts") or []
        for st in (attempts[-1].get("steps") or []) if attempts else []:
            label = st.get("title") or st.get("name") or st.get("instruction") or "step"
            lines.append(f"- [{st.get('status')}] {label}")
        if r.get("error"):
            lines.append(f"error: {r['error']}")
    if not matched:
        lines.append(f"No result matched {test_id}.")
    return "\n".join(lines)
