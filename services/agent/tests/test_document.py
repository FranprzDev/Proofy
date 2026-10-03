import json
from pathlib import Path
from typing import Any

import pytest
from langchain_core.messages import ToolMessage

from frontier_agent import schemas, testerarmy_cli
from frontier_agent.config import Settings
from frontier_agent.graphs.document import DocumentStatus, build_document_graph
from frontier_agent.graphs.document.tools import Collector, build_tools, run_tool
from frontier_agent.llm.fake import FakeToolCallingModel, make_fake_tool_model, tool_call_message

DOC = """# Contract

## Login
1. Users must log in at /login with email and password.
- Providers may export a CSV report.

## Payment
- The client shall pay each invoice within 30 days.
"""
LOGIN = "Users must log in at /login with email and password."
CSV = "Providers may export a CSV report."
PAY = "The client shall pay each invoice within 30 days."


def case(clause: str, title: str, **kw: Any) -> tuple[str, dict[str, Any]]:
    args: dict[str, Any] = {
        "clause": clause,
        "title": title,
        "objective": f"Verify: {clause}",
        "steps": ["sign in with the given credentials"],
        "expected_results": ["the dashboard is shown"],
        "start_path": "/login",
        "kind": "ui",
        "priority": "high",
    }
    return "submit_test_case", args | kw


def run(
    llm: FakeToolCallingModel | None, doc: str = DOC, answers: list[str] | None = None
) -> dict[str, Any]:
    return build_document_graph(llm=llm, settings=Settings()).invoke(
        {"contract_id": "c1", "document": doc, "answers": answers or []}
    )


def happy_model() -> FakeToolCallingModel:
    return make_fake_tool_model(
        tool_call_message(("read_document", {})),
        tool_call_message(("read_document", {"section": 1})),
        tool_call_message(("testerarmy_reference", {"topic": "agent"})),
        tool_call_message(
            case(LOGIN, "Login", credentials_role="member"),
            case(CSV, "CSV export", priority="low", start_path="/reports"),
            ("mark_out_of_scope", {"clause": PAY, "reason": "Payment is off-platform"}),
        ),
        tool_call_message(("validate_suite", {})),
        tool_call_message(("finish", {})),
    )


def tool_texts(model: FakeToolCallingModel) -> list[str]:
    return [str(m.content) for m in model.seen[-1] if isinstance(m, ToolMessage)]


def test_happy_path_proposal_and_suite() -> None:
    model = happy_model()
    out = run(model)
    assert out["status"] == DocumentStatus.PROPOSAL
    assert [t.id for t in out["test_cases"]] == ["TC-001", "TC-002"]
    assert out["test_cases"][0].priority == "high"
    assert out["out_of_scope"] == [f"{PAY} (Payment is off-platform)"]
    assert out["pending_items"] == []
    assert "tests/c1.e2e.ts" in out["e2e_suite"] and "plan.json" in out["e2e_suite"]
    texts = tool_texts(model)
    assert any("Document outline" in t for t in texts)
    assert any("Structure OK" in t for t in texts)
    assert out["accepted_by_client"] is False and out["accepted_by_provider"] is False


def test_ambiguity_blocks_proposal() -> None:
    model = make_fake_tool_model(
        tool_call_message(
            case(LOGIN, "Login"),
            (
                "flag_ambiguity",
                {"clause": CSV, "reason": "Which columns?", "suggested_question": "Which columns?"},
            ),
        ),
        tool_call_message(("finish", {})),
    )
    out = run(model)
    assert out["status"] == DocumentStatus.NEEDS_CLARIFICATION
    assert out["test_cases"] == [] and out["e2e_suite"] == {}
    assert [a.clause for a in out["ambiguities"]] == [CSV]
    assert out["pending_items"] == ["Which columns?"]


def test_answers_reach_the_model() -> None:
    model = make_fake_tool_model(tool_call_message(("finish", {})))
    run(model, answers=["CSV has columns id,name"])
    assert "CSV has columns id,name" in str(model.seen[0][1].content)


def test_invalid_submit_returns_error_and_model_retries() -> None:
    bad = case(LOGIN, "Login", kind="graphql")
    invented = case("Users can fly", "Fly")
    secret = case(LOGIN, "Login", test_data={"password": "hunter22"}, steps=["type {password}"])
    model = make_fake_tool_model(
        tool_call_message(bad, invented, secret, case(LOGIN, "Login", steps=[])),
        tool_call_message(
            case(LOGIN, "Login", credentials_role="member"),
            case(CSV, "CSV"),
            ("mark_out_of_scope", {"clause": PAY, "reason": "payment"}),
        ),
        tool_call_message(("finish", {})),
    )
    out = run(model)
    second_turn = [str(m.content) for m in model.seen[1] if isinstance(m, ToolMessage)]
    assert "kind" in second_turn[0]
    assert "must quote a clause" in second_turn[1]
    assert "looks like a secret" in second_turn[2]
    assert "steps" in second_turn[3]
    assert [t.id for t in out["test_cases"]] == ["TC-001", "TC-002"]
    assert out["status"] == DocumentStatus.PROPOSAL


def test_finish_refused_while_clauses_uncovered() -> None:
    model = make_fake_tool_model(
        tool_call_message(case(LOGIN, "Login"), ("finish", {})),
    )
    out = run(model)
    assert any("Cannot finish" in t for t in tool_texts(model))
    assert any(
        "did not call finish" in p or "before calling finish" in p for p in out["pending_items"]
    )


def test_unknown_tool_and_iteration_cap() -> None:
    model = make_fake_tool_model(*[tool_call_message(("nope", {})) for _ in range(5)])
    out = build_document_graph(llm=model, settings=Settings(agent_max_iterations=2)).invoke(
        {"contract_id": "c1", "document": DOC}
    )
    assert len(model.seen) == 2
    assert "unknown tool" in tool_texts(model)[0]
    assert out["pending_items"]


def test_llm_none_is_unavailable_and_invents_nothing() -> None:
    out = run(None)
    assert out["status"] == DocumentStatus.LLM_UNAVAILABLE
    assert out["test_cases"] == [] and out["e2e_suite"] == {}
    assert "LLM_ENABLED" in out["pending_items"][0] and "LLM_MODEL" in out["pending_items"][0]


def test_empty_document_needs_clarification_without_llm() -> None:
    out = run(None, doc="")
    assert out["status"] == DocumentStatus.NEEDS_CLARIFICATION
    assert out["pending_items"] and out["e2e_suite"] == {}


def test_model_exception_is_reported_not_raised() -> None:
    class Boom(FakeToolCallingModel):
        def _generate(self, *a: Any, **k: Any) -> Any:
            raise RuntimeError("provider down")

    out = run(Boom())
    assert out["status"] == DocumentStatus.PENDING
    assert "provider down" in out["pending_items"][0]


# ---- tools with a (mocked) TesterArmy project -------------------------------------------------


def collector(tmp_path: Path | None, **settings: Any) -> Collector:
    s = Settings(e2e_project_dir=str(tmp_path) if tmp_path else None, **settings)
    return Collector("c1", "v1", DOC, s)


def call(col: Collector, name: str, **args: Any) -> str:
    return run_tool({t.name: t for t in build_tools(col)}, name, args)


def test_reference_topics_are_bundled() -> None:
    col = collector(None)
    for topic in schemas.TesterArmyTopic:
        assert len(call(col, "testerarmy_reference", topic=topic.value)) > 500
    assert "Error" in call(col, "testerarmy_reference", topic="nope")


def test_read_document_sections() -> None:
    col = collector(None)
    assert "1. Login" in call(col, "read_document")
    assert "must log in" in call(col, "read_document", section=1)
    assert "Error" in call(col, "read_document", section=99)


def test_not_configured_never_fakes_success() -> None:
    col = collector(None)
    assert "not configured" in call(col, "explore_app", goal="login")
    assert "skipped" in call(col, "validate_suite") or "NOT valid" in call(col, "validate_suite")
    assert "dry_run_case" not in {t.name for t in build_tools(col)}


def test_explore_app_summarizes_report(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    seen: list[list[str]] = []

    def fake_cli(args: list[str], cwd: str, timeout_s: int) -> testerarmy_cli.CliResult:
        seen.append(args)
        report = {
            "run": {
                "explore": {
                    "ended": "finished",
                    "summary": "Login at /login works",
                    "steps": [{"title": "Open login", "status": "passed", "summary": "ok"}],
                    "findings": [
                        {"kind": "issue", "severity": 4, "title": "No error", "path": "/login"}
                    ],
                }
            }
        }
        (tmp_path / ".e2e").mkdir()
        (tmp_path / ".e2e" / "report.json").write_text(json.dumps(report))
        return testerarmy_cli.CliResult(1, "", "")

    monkeypatch.setattr(testerarmy_cli, "run_e2e_cli", fake_cli)
    text = call(collector(tmp_path), "explore_app", goal="Explore login", max_steps=3)
    assert seen == [["explore", "Explore login", "--max-steps", "3"]]
    assert "Open login" in text and "/login" in text and "No error" in text


def full_collector(tmp_path: Path, **settings: Any) -> Collector:
    col = collector(tmp_path, **settings)
    for clause in (LOGIN, CSV):
        call(
            col,
            "submit_test_case",
            clause=clause,
            title="t",
            objective="o",
            steps=["a"],
            expected_results=["b"],
        )
    call(col, "mark_out_of_scope", clause=PAY, reason="payment")
    return col


def test_validate_suite_runs_list_and_gates_finish(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    calls: list[list[str]] = []
    ok = True

    def fake_cli(args: list[str], cwd: str, timeout_s: int) -> testerarmy_cli.CliResult:
        calls.append(args)
        if not ok:
            return testerarmy_cli.CliResult(2, "", "COLLECTION_ERROR bad import")
        return testerarmy_cli.CliResult(0, json.dumps({"pairs": [{"title": "TC-001: t"}]}), "")

    monkeypatch.setattr(testerarmy_cli, "run_e2e_cli", fake_cli)
    col = full_collector(tmp_path)
    assert "Cannot finish" in call(col, "finish")
    ok = False
    assert "FAILED" in call(col, "validate_suite") and "COLLECTION_ERROR" in call(
        col, "validate_suite"
    )
    ok = True
    # TC-002 is not listed in the stdout -> not valid yet
    assert "did not list" in call(col, "validate_suite")
    monkeypatch.setattr(
        testerarmy_cli,
        "run_e2e_cli",
        lambda a, c, t: testerarmy_cli.CliResult(0, "TC-001: t\nTC-002: t", ""),
    )
    assert "`e2e list` OK" in call(col, "validate_suite")
    assert (tmp_path / "tests" / "generated" / "c1.e2e.ts").exists()
    assert call(col, "finish") == "Done."
    assert calls[0][:2] == ["list", "tests/generated/c1.e2e.ts"]


def test_dry_run_case_gated_and_summarized(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    assert "dry_run_case" not in {t.name for t in build_tools(full_collector(tmp_path))}
    col = full_collector(tmp_path, e2e_allow_run=True)
    seen: list[list[str]] = []

    def fake_cli(args: list[str], cwd: str, timeout_s: int) -> testerarmy_cli.CliResult:
        seen.append(args)
        report = {
            "run": {
                "status": "failed",
                "results": [
                    {
                        "titlePath": ["TC-001: t"],
                        "status": "failed",
                        "attempts": [{"steps": [{"title": "act a", "status": "blocked"}]}],
                        "error": "ASSERTION_FAILED",
                    }
                ],
            }
        }
        (tmp_path / ".e2e").mkdir(exist_ok=True)
        (tmp_path / ".e2e" / "report.json").write_text(json.dumps(report))
        return testerarmy_cli.CliResult(1, "", "")

    monkeypatch.setattr(testerarmy_cli, "run_e2e_cli", fake_cli)
    text = call(col, "dry_run_case", test_id="TC-001")
    assert "[blocked] act a" in text and "ASSERTION_FAILED" in text
    assert seen[0][:2] == ["run", "tests/generated/c1.e2e.ts"] and "--grep" in seen[0]
    assert "Error" in call(col, "dry_run_case", test_id="TC-099") or "invalid" in call(
        col, "dry_run_case", test_id="bad"
    )


def test_run_e2e_cli_handles_missing_npx(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PATH", "")
    res = testerarmy_cli.run_e2e_cli(["list"], ".", 5)
    assert res.returncode == testerarmy_cli.NOT_FOUND_RETURNCODE


def test_document_eval_dataset() -> None:
    from evals.harness import load_dataset, run_document_eval

    rows = run_document_eval(load_dataset("document"))
    assert all(ok for _, ok, _ in rows), rows
