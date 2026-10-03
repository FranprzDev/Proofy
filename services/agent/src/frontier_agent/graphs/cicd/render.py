"""Markdown PR comment for the provider."""

from frontier_agent.graphs.cicd.state import CicdState, Finding

_TITLES = {
    "e2e": "E2E tests",
    "ruff": "Ruff",
    "eslint": "ESLint",
    "mypy": "mypy",
    "tsc": "TypeScript",
    "format": "Formatting",
    "indentation": "Indentation",
    "review": "Code review",
}
_VERDICT = {
    "favorable": "Favorable",
    "needs_fix": "Needs fix",
    "inconclusive": "Inconclusive",
}


def _line(f: Finding) -> str:
    where = f"`{f.path}{':' + str(f.line) if f.line else ''}` " if f.path else ""
    who = f"**{f.test_id}** " if f.test_id else ""
    rule = f"[{f.rule}] " if f.rule else ""
    return f"- {who}{where}{rule}{f.message}"


def _label(v: object) -> str:
    return _VERDICT.get(str(v), "Pending")


def render_comment(state: CicdState) -> str:
    blocking = [f for f in state.findings if f.blocking]
    warnings = [f for f in state.findings if not f.blocking]
    out = [
        f"## Milestone review: {_label(state.verdict)}",
        "",
        "| Check | Result |",
        "| --- | --- |",
        f"| E2E tests | {_label(state.dynamic_verdict)} |",
        f"| Static analysis | {_label(state.static_verdict)} |",
        f"| Blocking items | {len(blocking)} |",
        f"| Warnings | {len(warnings)} |",
    ]
    if blocking:
        out += ["", "### What to fix"]
        for src, title in _TITLES.items():
            items = [f for f in blocking if f.source == src]
            if items:
                out += ["", f"**{title}** ({len(items)})", *(_line(f) for f in items)]
    if warnings:
        out += ["", "### Non-blocking observations", *(_line(f) for f in warnings[:20])]
        if len(warnings) > 20:
            out.append(f"- ... and {len(warnings) - 20} more")
    if state.observations:
        out += ["", "### Notes", *(f"- {o}" for o in state.observations)]
    if state.verdict is not None and state.verdict.value == "inconclusive":
        out += ["", "The evidence is inconclusive; no fault is attributed to the code."]
    return "\n".join(out) + "\n"
