from typing import Any

from frontier_agent.graphs.document import DocumentStatus, build_document_graph


def _run(doc: str, answers: list[str] | None = None) -> dict[str, Any]:
    return build_document_graph().invoke(
        {"contract_id": "c1", "document": doc, "answers": answers or []}
    )


def test_covers_every_clause_and_parties_do_not_accept() -> None:
    out = _run("Email login\nCSV export\n")
    assert out["status"] == DocumentStatus.PROPOSAL
    assert [s.clause for s in out["scenarios"]] == ["Email login", "CSV export"]
    assert out["ambiguities"] == []
    assert out["accepted_by_client"] is False and out["accepted_by_provider"] is False


def test_empty_document_needs_clarification() -> None:
    out = _run("")
    assert out["status"] == DocumentStatus.NEEDS_CLARIFICATION
    assert out["pending_items"] and out["scenarios"] == []


def test_ambiguous_clause_flags_and_proposes_no_scenarios() -> None:
    out = _run("Email login\nAdequate performance, etc.\n")
    assert out["status"] == DocumentStatus.NEEDS_CLARIFICATION
    assert out["scenarios"] == []
    assert [a.clause for a in out["ambiguities"]] == ["Adequate performance, etc."]
    assert out["ambiguities"][0].suggested_question


def test_answered_ambiguity_allows_proposal() -> None:
    clause = "Adequate performance"
    out = _run(clause, [f"{clause}: p95 < 300 ms"])
    assert out["status"] == DocumentStatus.PROPOSAL


def test_document_eval_dataset() -> None:
    from evals.harness import load_dataset, run_document_eval

    rows = run_document_eval(build_document_graph(), load_dataset("document"))
    assert all(ok for _, ok, _ in rows), rows
