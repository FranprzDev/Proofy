"""Minimal harness: JSONL {"id", "input", "expected"}; compares against the graph output."""

import json
from pathlib import Path
from typing import Any

DATASETS = Path(__file__).parent / "datasets"


def load_dataset(name: str) -> list[dict[str, Any]]:
    path = DATASETS / f"{name}.jsonl"
    return [json.loads(ln) for ln in path.read_text().splitlines() if ln.strip()]


def run_cicd_eval(graph: Any, cases: list[dict[str, Any]]) -> list[tuple[str, bool, str]]:
    rows = []
    for c in cases:
        out = graph.invoke(c["input"])
        got = str(out["verdict"])
        rows.append((c["id"], got == c["expected"]["verdict"], got))
    return rows


def run_document_eval(cases: list[dict[str, Any]]) -> list[tuple[str, bool, str]]:
    """Each row may carry a `script`: the scripted tool calls of the fake tool-calling model.

    Rows without a script run with no LLM (expected `llm_unavailable`, or
    `needs_clarification` for an empty document).
    """
    from frontier_agent.graphs.document import build_document_graph
    from frontier_agent.llm.fake import make_fake_tool_model, tool_call_message

    rows = []
    for c in cases:
        script = c.get("script")
        llm = (
            make_fake_tool_model(
                *[
                    tool_call_message(*[(call["name"], call.get("args", {})) for call in step])
                    for step in script
                ]
            )
            if script
            else None
        )
        out = build_document_graph(llm=llm).invoke(c["input"])
        got = str(out["status"])
        rows.append((c["id"], got == c["expected"]["status"], got))
    return rows
