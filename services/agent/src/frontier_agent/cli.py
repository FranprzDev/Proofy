"""Command line: `serve` the API `plan` a local document into an E2E test plan, or `review` a PR."""

import argparse
import sys
from collections.abc import Callable
from pathlib import Path
from typing import Any

from frontier_agent.graphs.cicd.cli import register as _register_review
from frontier_agent.graphs.document import DocumentStatus, build_document_graph

Subparsers = Any
EXIT_NEEDS_CLARIFICATION = 3
EXIT_LLM_UNAVAILABLE = 4
EXIT_AGENT_FAILED = 5


def _serve(_: argparse.Namespace) -> int:
    import uvicorn

    uvicorn.run("frontier_agent.api.app:app", host="127.0.0.1", port=8000, reload=True)
    return 0


def _plan(args: argparse.Namespace) -> int:
    from frontier_agent.config import get_settings

    path = Path(args.path)
    try:
        document = path.read_text(encoding="utf-8")
        answers = (
            [ln.strip() for ln in Path(args.answers).read_text(encoding="utf-8").splitlines()]
            if args.answers
            else []
        )
    except OSError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    llm = None
    if get_settings().llm_enabled:
        from frontier_agent.llm import get_chat_model

        llm = get_chat_model()
    out = build_document_graph(llm=llm).invoke(
        {
            "contract_id": args.contract_id or path.stem,
            "contract_version": args.contract_version,
            "document": document,
            "answers": [a for a in answers if a],
        }
    )
    if out["status"] == DocumentStatus.LLM_UNAVAILABLE:
        for item in out["pending_items"]:
            print(f"error: {item}", file=sys.stderr)
        return EXIT_LLM_UNAVAILABLE
    if out["status"] == DocumentStatus.PENDING:
        for item in out["pending_items"]:
            print(f"error: {item}", file=sys.stderr)
        return EXIT_AGENT_FAILED
    if out["status"] == DocumentStatus.NEEDS_CLARIFICATION:
        print("Needs clarification before proposing tests:")
        for a in out["ambiguities"]:
            print(f"- {a.clause}\n    reason: {a.reason}\n    question: {a.suggested_question}")
        return EXIT_NEEDS_CLARIFICATION
    out_dir = Path(args.out)
    for name, content in out["e2e_suite"].items():
        target = out_dir / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")
    print(f"Proposed {len(out['test_cases'])} test case(s) for {out['contract_id']}:")
    for c in out["test_cases"]:
        print(f"- {c.id} [{c.priority}/{c.kind}] {c.title}")
    for clause in out["out_of_scope"]:
        print(f"- out of scope: {clause}")
    for item in out["pending_items"]:
        print(f"! {item}")
    print(f"Wrote {', '.join(sorted(out['e2e_suite']))} to {out_dir}")
    return 0


def _register_serve(sub: Subparsers) -> None:
    sub.add_parser("serve", help="run the API server").set_defaults(handler=_serve)


def _register_plan(sub: Subparsers) -> None:
    p = sub.add_parser("plan", help="turn a local document into verbal E2E test cases")
    p.add_argument("path")
    p.add_argument("--contract-id")
    p.add_argument("--contract-version", default="draft")
    p.add_argument("--answers", help="file with one clarification answer per line")
    p.add_argument("--out", default="e2e-plan")
    p.set_defaults(handler=_plan)


# Add a registrar here to expose another subcommand.
SUBCOMMAND_REGISTRARS: list[Callable[[Subparsers], None]] = [
    _register_serve,
    _register_plan,
    _register_review,
]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="frontier-agent")
    sub = parser.add_subparsers(dest="command")
    for register in SUBCOMMAND_REGISTRARS:
        register(sub)
    args = parser.parse_args(argv)
    handler: Callable[[argparse.Namespace], int] = getattr(args, "handler", _serve)
    return handler(args)


if __name__ == "__main__":
    raise SystemExit(main())
