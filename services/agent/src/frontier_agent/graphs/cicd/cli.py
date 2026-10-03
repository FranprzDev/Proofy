"""`review` subcommand: runs the CI/CD graph over files produced by the pipeline."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from langchain_core.language_models import BaseChatModel

from frontier_agent.graphs.cicd.graph import build_cicd_graph
from frontier_agent.graphs.cicd.state import (
    ChangedFile,
    CicdInput,
    PullRequest,
    StaticReports,
)
from frontier_agent.schemas import Ref, Verdict

_EXIT = {Verdict.FAVORABLE: 0, Verdict.NEEDS_FIX: 1, Verdict.INCONCLUSIVE: 2}


def _read(path: str | None) -> str | None:
    return Path(path).read_text() if path else None


def _lines(path: str | None) -> list[str]:
    text = _read(path) or ""
    return [ln.strip() for ln in text.splitlines() if ln.strip()]


def _plan_ids(path: str | None) -> list[str]:
    """Accepts a list of ids, a list of {"id": ...} cases, or {"test_cases": [...]}."""
    if not path:
        return []
    data = json.loads(Path(path).read_text())
    if isinstance(data, dict):
        data = data.get("test_cases") or data.get("cases") or []
    ids: list[str] = []
    for item in data:
        value = item.get("id") if isinstance(item, dict) else item
        if value:
            ids.append(str(value))
    return ids


def _changed_files(listing: str | None, root: Path) -> list[ChangedFile]:
    files = []
    for rel in _lines(listing):
        p = root / rel
        files.append(ChangedFile(path=rel, content=p.read_text() if p.is_file() else None))
    return files


def _make_llm() -> BaseChatModel | None:
    from frontier_agent.config import get_settings

    if not get_settings().llm_enabled:
        return None
    from frontier_agent.llm import get_chat_model

    return get_chat_model()


def run_review(args: argparse.Namespace) -> int:
    try:
        return _run_review(args)
    except (OSError, ValueError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2


def _run_review(args: argparse.Namespace) -> int:
    ref = Ref(
        milestone_id=args.milestone, contract_version=args.contract_version, revision=args.sha
    )
    pr = None
    if args.pr_number is not None:
        pr = PullRequest(
            number=args.pr_number,
            head_sha=args.sha,
            diff=_read(args.diff) or "",
            changed_files=_changed_files(args.changed_files, Path(args.repo_root)),
        )
    payload = CicdInput(
        expected=ref,
        evidence_ref=ref,
        pull_request=pr,
        expected_test_ids=_plan_ids(args.plan),
        e2e_report_json=_read(args.report_json),
        e2e_junit_xml=_read(args.junit),
        static=StaticReports(
            ruff_json=_read(args.ruff),
            eslint_json=_read(args.eslint),
            mypy_output=_read(args.mypy),
            tsc_output=_read(args.tsc),
            unformatted_files=_lines(args.unformatted),
        ),
    )
    out = build_cicd_graph(llm=_make_llm()).invoke(payload.model_dump())
    if args.comment_out:
        Path(args.comment_out).write_text(out["pr_comment"])
    print(json.dumps(out, default=str, indent=2))
    return _EXIT[Verdict(out["verdict"])]


def register(subparsers: argparse._SubParsersAction[argparse.ArgumentParser]) -> None:
    p = subparsers.add_parser("review", help="Review a milestone PR (e2e + static analysis)")
    p.add_argument("--milestone", required=True)
    p.add_argument("--contract-version", required=True)
    p.add_argument("--sha", required=True, help="Head SHA under review")
    p.add_argument("--pr-number", type=int)
    p.add_argument("--plan", help="plan.json with the expected test-case ids")
    p.add_argument("--report-json", help="TesterArmy .e2e/report.json (preferred over junit)")
    p.add_argument("--junit", help="JUnit XML from TesterArmy (.e2e/junit.xml)")
    p.add_argument("--ruff", help="ruff --output-format json")
    p.add_argument("--eslint", help="eslint --format json")
    p.add_argument("--mypy", help="mypy text output")
    p.add_argument("--tsc", help="tsc --noEmit text output")
    p.add_argument("--unformatted", help="files from format checks, one per line")
    p.add_argument("--changed-files", help="changed paths, one per line")
    p.add_argument("--diff", help="unified diff of the PR")
    p.add_argument("--repo-root", default=".")
    p.add_argument("--comment-out", help="write the PR comment markdown here")
    p.set_defaults(handler=run_review)
