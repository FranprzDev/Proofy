import json
import re
from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, ValidationError

from frontier_agent.graphs.document.prompts import PROPOSE_SYSTEM, PROPOSE_USER
from frontier_agent.graphs.document.state import (
    Ambiguity,
    DocumentState,
    DocumentStatus,
    TestCase,
)
from frontier_agent.testerarmy import render_suite

# Deterministic heuristics (no LLM): lexical markers of vagueness or missing information.
_MARKERS = re.compile(
    r"\b(tbd|to be defined|to be determined|etc\.?|and others|as appropriate|asap|"
    r"as soon as possible|adequate|reasonable)\b|\?|\.\.\.",
    re.IGNORECASE,
)
_BULLET = re.compile(r"^\s*(?:[-*+]|\d+[.)])\s+")
_OUT_OF_SCOPE = re.compile(
    r"\b(pay|payments?|invoices?|fees?|refunds?|legal|law|jurisdiction|warrant(?:y|ies)|"
    r"liability|indemnif\w*|confidentiality|termination|intellectual property)\b",
    re.IGNORECASE,
)
_API = re.compile(r"\b(api|endpoints?|webhooks?|rest|graphql)\b", re.IGNORECASE)
_HIGH = re.compile(r"\b(must|shall|required|mandatory)\b", re.IGNORECASE)
_LOW = re.compile(r"\b(may|optional|nice to have)\b", re.IGNORECASE)
_PATH = re.compile(r"(?<![\w/])/[a-z0-9][\w/-]*", re.IGNORECASE)
_FENCE = re.compile(r"^\s*```(?:json)?\s*|\s*```\s*$", re.IGNORECASE)


class _Draft(TestCase):
    id: str = ""


class _Plan(BaseModel):
    test_cases: list[_Draft] = []
    out_of_scope: list[str] = []


def extract_clauses(state: DocumentState) -> dict[str, Any]:
    clauses: list[str] = []
    in_code = False
    for raw in state.document.splitlines():
        line = raw.strip()
        if line.startswith("```"):
            in_code = not in_code
            continue
        if not line or in_code or line.startswith("#"):
            continue
        clause = _BULLET.sub("", line).strip()
        if clause:
            clauses.append(clause)
    # Explicit initial values: the graph output always carries every key.
    return {
        "clauses": clauses,
        "ambiguities": [],
        "test_cases": [],
        "out_of_scope": [],
        "e2e_suite": {},
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


def _heuristic_case(clause: str) -> TestCase:
    sentence = clause.rstrip(" .")
    path = _PATH.search(clause)
    return TestCase(
        id="",
        clause=clause,
        title=sentence if len(sentence) <= 80 else sentence[:79].rsplit(" ", 1)[0] + "…",
        objective=f"Verify that the application meets this requirement: {sentence}.",
        steps=[f"As an end user, exercise this requirement: {sentence}"],
        expected_results=[f"The application behaves as required: {sentence}"],
        start_path=path.group(0) if path else "/",
        kind="api" if _API.search(clause) else "ui",
        priority="high" if _HIGH.search(clause) else "low" if _LOW.search(clause) else "medium",
    )


def _heuristic_plan(clauses: list[str]) -> tuple[list[TestCase], list[str]]:
    scoped = [c for c in clauses if not _OUT_OF_SCOPE.search(c)]
    return [_heuristic_case(c) for c in scoped], [c for c in clauses if c not in scoped]


def _llm_plan(llm: BaseChatModel, state: DocumentState) -> tuple[list[TestCase], list[str]]:
    clauses = "\n".join(f"- {c}" for c in state.clauses)
    answers = "\n".join(f"- {a}" for a in state.answers) or "(none)"
    resp = llm.invoke(
        [
            SystemMessage(PROPOSE_SYSTEM),
            HumanMessage(
                PROPOSE_USER.format(
                    contract_id=state.contract_id,
                    contract_version=state.contract_version,
                    clauses=clauses,
                    answers=answers,
                )
            ),
        ]
    )
    content = resp.content if isinstance(resp.content, str) else json.dumps(resp.content)
    plan = _Plan.model_validate_json(_FENCE.sub("", content.strip()))
    return list(plan.test_cases), plan.out_of_scope


def propose_test_cases(state: DocumentState, llm: BaseChatModel | None) -> dict[str, Any]:
    pending: list[str] = []
    if llm is None:
        cases, out = _heuristic_plan(state.clauses)
    else:
        try:
            cases, out = _llm_plan(llm, state)
        except (ValidationError, ValueError) as exc:
            pending.append(
                f"LLM output could not be parsed ({type(exc).__name__}); "
                "heuristic test cases were used instead."
            )
            cases, out = _heuristic_plan(state.clauses)
    cases = [c.model_copy(update={"id": f"TC-{i:03d}"}) for i, c in enumerate(cases, 1)]
    return {
        "status": DocumentStatus.PROPOSAL,
        "test_cases": cases,
        "out_of_scope": out,
        "pending_items": pending,
    }


def render_e2e_suite(state: DocumentState) -> dict[str, Any]:
    suite = render_suite(
        state.test_cases, state.contract_id, state.contract_version, state.out_of_scope
    )
    return {"e2e_suite": suite}
