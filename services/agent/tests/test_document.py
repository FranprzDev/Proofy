import json
from typing import Any

from langchain_core.language_models import BaseChatModel

from frontier_agent.graphs.document import DocumentStatus, build_document_graph
from frontier_agent.llm.fake import make_fake_chat_model

DOC = """# Contract

## Login
1. Users must log in at /login with email and password.
- Providers may export a CSV report.

## Payment
- The client shall pay each invoice within 30 days.
"""


def _run(
    doc: str, answers: list[str] | None = None, llm: BaseChatModel | None = None
) -> dict[str, Any]:
    return build_document_graph(llm=llm).invoke(
        {"contract_id": "c1", "document": doc, "answers": answers or []}
    )


def test_heuristic_splits_clauses_and_skips_headings() -> None:
    out = _run(DOC)
    assert out["status"] == DocumentStatus.PROPOSAL
    assert out["clauses"][0] == "Users must log in at /login with email and password."
    assert all(not c.startswith("#") for c in out["clauses"])
    assert [t.id for t in out["test_cases"]] == ["TC-001", "TC-002"]
    first, second = out["test_cases"]
    assert first.start_path == "/login" and first.priority == "high"
    assert second.priority == "low"
    assert first.steps and first.expected_results
    assert out["accepted_by_client"] is False and out["accepted_by_provider"] is False


def test_payment_clause_is_out_of_scope() -> None:
    out = _run(DOC)
    assert out["out_of_scope"] == ["The client shall pay each invoice within 30 days."]
    assert all("pay" not in t.clause for t in out["test_cases"])
    assert "tests/c1.e2e.ts" in out["e2e_suite"] and "plan.json" in out["e2e_suite"]


def test_empty_document_needs_clarification() -> None:
    out = _run("")
    assert out["status"] == DocumentStatus.NEEDS_CLARIFICATION
    assert out["pending_items"] and out["test_cases"] == [] and out["e2e_suite"] == {}


def test_ambiguous_clause_flags_and_proposes_no_tests() -> None:
    out = _run("Email login\nAdequate performance, etc.\n")
    assert out["status"] == DocumentStatus.NEEDS_CLARIFICATION
    assert out["test_cases"] == []
    assert [a.clause for a in out["ambiguities"]] == ["Adequate performance, etc."]
    assert out["ambiguities"][0].suggested_question


def test_answered_ambiguity_allows_proposal() -> None:
    clause = "Adequate performance"
    out = _run(clause, [f"{clause}: p95 < 300 ms"])
    assert out["status"] == DocumentStatus.PROPOSAL


def test_llm_path_assigns_sequential_ids() -> None:
    reply = json.dumps(
        {
            "test_cases": [
                {
                    "clause": "Email login",
                    "title": "Login",
                    "objective": "Users can log in.",
                    "steps": ["Log in with valid credentials"],
                    "expected_results": ["The dashboard is shown"],
                    "kind": "ui",
                    "priority": "high",
                }
            ],
            "out_of_scope": ["Payment terms"],
        }
    )
    out = _run("Email login", llm=make_fake_chat_model(f"```json\n{reply}\n```"))
    assert [t.id for t in out["test_cases"]] == ["TC-001"]
    assert out["test_cases"][0].title == "Login"
    assert out["out_of_scope"] == ["Payment terms"]
    assert out["pending_items"] == []


def test_llm_bad_json_falls_back_to_heuristic() -> None:
    out = _run("Email login", llm=make_fake_chat_model("not json at all"))
    assert out["status"] == DocumentStatus.PROPOSAL
    assert [t.clause for t in out["test_cases"]] == ["Email login"]
    assert any("could not be parsed" in p for p in out["pending_items"])


def test_document_eval_dataset() -> None:
    from evals.harness import load_dataset, run_document_eval

    rows = run_document_eval(build_document_graph(), load_dataset("document"))
    assert all(ok for _, ok, _ in rows), rows
