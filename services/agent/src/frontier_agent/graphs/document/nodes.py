import re
from typing import Any

from frontier_agent.graphs.document.state import (
    Ambiguity,
    DocumentState,
    DocumentStatus,
    Scenario,
)

# Deterministic stub (no LLM): lexical markers of vagueness or missing information.
_MARKERS = re.compile(
    r"\b(tbd|to be defined|to be determined|etc\.?|and others|as appropriate|asap|"
    r"as soon as possible|adequate|reasonable)\b|\?|\.\.\.",
    re.IGNORECASE,
)


def extract_clauses(state: DocumentState) -> dict[str, Any]:
    clauses = [ln.strip() for ln in state.document.splitlines() if ln.strip()]
    # Explicit initial values: the graph output always carries every key.
    return {
        "clauses": clauses,
        "ambiguities": [],
        "scenarios": [],
        "pending_items": [],
        "accepted_by_client": False,
        "accepted_by_provider": False,
    }


def detect_ambiguities(state: DocumentState) -> dict[str, Any]:
    if not state.clauses:
        return {
            "status": DocumentStatus.NEEDS_CLARIFICATION,
            "ambiguities": [
                Ambiguity(
                    clause="(document)",
                    reason="The document has no analyzable clauses.",
                    suggested_question="Can you upload the governing document with its clauses?",
                )
            ],
            "pending_items": ["The document has no analyzable clauses."],
        }
    answered = " ".join(state.answers)
    ambiguities = []
    for clause in state.clauses:
        m = _MARKERS.search(clause)
        if m and clause not in answered:
            ambiguities.append(
                Ambiguity(
                    clause=clause,
                    reason=f"Vague or incomplete term: '{m.group(0)}'.",
                    suggested_question=f"What measurable condition defines this clause? '{clause}'",
                )
            )
    if ambiguities:
        return {
            "status": DocumentStatus.NEEDS_CLARIFICATION,
            "ambiguities": ambiguities,
            "pending_items": [a.suggested_question for a in ambiguities],
        }
    return {}


def route_after_ambiguities(state: DocumentState) -> str:
    return "end" if state.status == DocumentStatus.NEEDS_CLARIFICATION else "propose"


def propose_scenarios(state: DocumentState) -> dict[str, Any]:
    # Stub: no LLM. Every clause is covered by a draft scenario.
    scenarios = [
        Scenario(
            clause=c,
            description=f"[draft] verify: {c}",
            expected_result="[to be defined with both parties]",
        )
        for c in state.clauses
    ]
    return {"status": DocumentStatus.PROPOSAL, "scenarios": scenarios}
