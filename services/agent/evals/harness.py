"""Harness mínimo: JSONL {"id", "input", "expected"}; compara con la salida del grafo."""

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
        got = str(out["veredicto"])
        rows.append((c["id"], got == c["expected"]["veredicto"], got))
    return rows


def run_documental_eval(graph: Any, cases: list[dict[str, Any]]) -> list[tuple[str, bool, str]]:
    rows = []
    for c in cases:
        out = graph.invoke(c["input"])
        got = str(out["estado"])
        rows.append((c["id"], got == c["expected"]["estado"], got))
    return rows
