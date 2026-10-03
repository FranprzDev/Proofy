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


def run_document_eval(graph: Any, cases: list[dict[str, Any]]) -> list[tuple[str, bool, str]]:
    rows = []
    for c in cases:
        out = graph.invoke(c["input"])
        got = str(out["status"])
        rows.append((c["id"], got == c["expected"]["status"], got))
    return rows
