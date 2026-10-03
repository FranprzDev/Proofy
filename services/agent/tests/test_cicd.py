import json
from pathlib import Path
from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage

from evals.harness import load_dataset
from frontier_agent.graphs.cicd import build_cicd_graph
from frontier_agent.llm.fake import make_fake_tool_model, tool_call_message

FIX = Path(__file__).parent / "fixtures"
REF = {"milestone_id": "m", "contract_version": "v", "revision": "abc"}
PASS_XML = (FIX / "junit_pass.xml").read_text()
PASS_REPORT = (FIX / "report_pass.json").read_text()
CLEAN_STATIC = {"ruff_json": "[]", "eslint_json": "[]"}


def submit(verdict: str, dynamic: str | None = None, static: str | None = None) -> AIMessage:
    return tool_call_message(
        (
            "submit_verdict",
            {
                "dynamic": dynamic or verdict,
                "static": static or verdict,
                "verdict": verdict,
                "summary": "reviewed",
            },
        )
    )


def model(verdict: str = "favorable", *before: AIMessage) -> Any:
    first = tool_call_message(("get_plan", {}), ("get_e2e_results", {}))
    return make_fake_tool_model(first, *before, submit(verdict))


def run(llm: BaseChatModel | str | None = "favorable", **over: object) -> dict[str, Any]:
    base: dict[str, object] = {
        "expected": REF,
        "evidence_ref": REF,
        "pull_request": {"number": 1, "head_sha": "abc"},
        "expected_test_ids": ["TC-001", "TC-002"],
        "e2e_report_json": PASS_REPORT,
        "static": CLEAN_STATIC,
    }
    chat = model(llm) if isinstance(llm, str) else llm
    return build_cicd_graph(llm=chat).invoke({**base, **over})


def test_cicd_eval_dataset() -> None:
    for case in load_dataset("cicd"):
        out = build_cicd_graph(llm=model(case["llm_verdict"])).invoke(case["input"])
        assert out["verdict"] == case["expected"]["verdict"], case["id"]


def test_favorable_authorized() -> None:
    out = run()
    assert out["verdict"] == "favorable"
    assert out["attestation_authorized"] is True
    assert out["status"] == "reviewed"
    assert "Favorable" in out["pr_comment"]


def test_agent_reads_evidence_through_tools() -> None:
    llm = model("favorable")
    run(llm)
    # system prompt + user + tool results for the first tool batch reach the second call
    assert len(llm.seen) == 2
    tool_msgs = [m for m in llm.seen[1] if m.type == "tool"]
    assert any("TC-001" in str(m.content) for m in tool_msgs)


def test_junit_is_reviewed_but_cannot_authorize() -> None:
    # JUnit records no commit, so it cannot prove the revision: no payment without report.json.
    out = run(e2e_report_json=None, e2e_junit_xml=PASS_XML)
    assert out["dynamic_verdict"] == "favorable"
    assert out["verdict"] == "inconclusive" and out["attestation_authorized"] is False
    assert any("report.json" in o for o in out["observations"])


def test_sha_mismatch_inconclusive() -> None:
    out = run(pull_request={"number": 1, "head_sha": "zzz"})
    assert out["verdict"] == "inconclusive" and out["attestation_authorized"] is False


def test_e2e_report_commit_mismatch_inconclusive() -> None:
    out = run(e2e_report_json=(FIX / "report_wrong_commit.json").read_text())
    assert out["verdict"] == "inconclusive" and out["attestation_authorized"] is False
    assert any("different commit" in o for o in out["observations"])


def test_e2e_report_dirty_inconclusive() -> None:
    out = run(e2e_report_json=(FIX / "report_dirty.json").read_text())
    assert out["verdict"] == "inconclusive" and out["attestation_authorized"] is False
    assert any("dirty" in o for o in out["observations"])


def test_missing_static_report_inconclusive() -> None:
    out = run(static={})
    assert out["verdict"] == "inconclusive" and out["attestation_authorized"] is False
    assert any("No static reports" in o for o in out["observations"])


def test_changed_files_alone_is_not_static_evidence() -> None:
    pr = {
        "number": 1,
        "head_sha": "abc",
        "changed_files": [{"path": "a.py", "content": "x = 1\n"}],
    }
    out = run(static={}, pull_request=pr)
    assert out["verdict"] == "inconclusive" and out["attestation_authorized"] is False


def test_expected_test_failed_gate_overrides_llm() -> None:
    out = run(e2e_report_json=(FIX / "report_failed.json").read_text())
    assert out["verdict"] == "needs_fix" and out["attestation_authorized"] is False
    assert "TC-002" in out["pr_comment"]
    assert any("Gate overrode" in o for o in out["observations"])


def test_blocked_is_environment_not_code() -> None:
    out = run(e2e_report_json=(FIX / "report_blocked.json").read_text())
    assert out["verdict"] == "inconclusive"
    assert not any(f.blocking for f in out["findings"])


def test_errors_and_failures_surface_needs_fix() -> None:
    out = run(e2e_report_json=(FIX / "report_errors_and_failures.json").read_text())
    assert out["verdict"] == "needs_fix"
    assert [f.test_id for f in out["findings"] if f.source == "e2e"] == ["TC-002"]


def test_missing_expected_test_inconclusive() -> None:
    out = run(expected_test_ids=["TC-001", "TC-002", "TC-003"])
    assert out["verdict"] == "inconclusive"
    assert any("TC-003" in o for o in out["observations"])


def test_evidence_ref_none_message() -> None:
    out = run(evidence_ref=None)
    assert out["verdict"] == "inconclusive" and out["attestation_authorized"] is False
    assert "No evidence reference provided." in out["observations"]
    assert not any("does not match" in o for o in out["observations"])


def test_evidence_ref_other_revision() -> None:
    out = run(evidence_ref={**REF, "revision": "zzz"})
    assert any("does not match" in o for o in out["observations"])
    assert out["attestation_authorized"] is False


def test_no_llm_inconclusive() -> None:
    out = run(llm=None)
    assert out["verdict"] == "inconclusive" and out["attestation_authorized"] is False
    assert out["status"] == "llm_required"
    assert "LLM required for review" in out["observations"]


def test_llm_never_submits_verdict() -> None:
    out = run(llm=make_fake_tool_model())
    assert out["verdict"] == "inconclusive" and out["status"] == "no_verdict"


def test_static_ruff_blocks_regardless_of_llm() -> None:
    out = run(static={"ruff_json": (FIX / "ruff.json").read_text()})
    assert out["verdict"] == "needs_fix" and "F401" in out["pr_comment"]


def test_eslint_warning_does_not_block() -> None:
    warn = json.dumps([{"filePath": "a.ts", "messages": [{"severity": 1, "message": "w"}]}])
    out = run(static={"eslint_json": warn})
    assert out["verdict"] == "favorable" and "Non-blocking" in out["pr_comment"]


def test_format_and_indentation_block() -> None:
    assert run(static={**CLEAN_STATIC, "unformatted_files": ["a.py"]})["verdict"] == "needs_fix"
    pr = {
        "number": 1,
        "head_sha": "abc",
        "changed_files": [{"path": "a.py", "content": "if x:\n  y = 1\n"}],
    }
    assert run(pull_request=pr)["verdict"] == "needs_fix"


def test_bad_static_report_is_not_evidence() -> None:
    out = run(static={"ruff_json": "not json"})
    assert out["verdict"] == "inconclusive"
    assert any("ruff" in o for o in out["observations"])


def test_agent_blocking_finding_cites_clause_or_additional_objection() -> None:
    rec = tool_call_message(
        (
            "record_finding",
            {
                "severity": "error",
                "message": "no auth",
                "path": "a.py",
                "clause": "C1",
                "blocking": True,
            },
        ),
        ("record_finding", {"severity": "error", "message": "leak", "blocking": True}),
        ("record_finding", {"severity": "error", "message": "x", "clause": "C9", "blocking": True}),
    )
    out = run(llm=model("favorable", rec), clauses=["Users must log in"])
    assert out["verdict"] == "needs_fix"
    rules = [f.rule for f in out["findings"] if f.source == "review"]
    assert rules == ["C1", "additional objection"]
    assert "additional objection" in out["pr_comment"]


def test_agent_nonblocking_finding_keeps_favorable() -> None:
    rec = tool_call_message(("record_finding", {"severity": "info", "message": "nit"}))
    assert run(llm=model("favorable", rec))["verdict"] == "favorable"


def test_agent_needs_fix_verdict_stands() -> None:
    out = run(llm="needs_fix")
    assert out["verdict"] == "needs_fix" and out["attestation_authorized"] is False


def test_agent_half_not_favorable_blocks() -> None:
    llm = make_fake_tool_model(submit("favorable", static="inconclusive"))
    out = run(llm=llm)
    assert out["verdict"] == "favorable"  # overall favorable and gate satisfied
    assert out["static_verdict"] == "inconclusive"


def test_tool_errors_do_not_crash() -> None:
    bad = tool_call_message(("nope", {}), ("get_static_report", {"tool": "bogus"}))
    out = run(llm=model("favorable", bad))
    assert out["verdict"] == "favorable"


def test_diff_and_file_tools() -> None:
    pr = {
        "number": 1,
        "head_sha": "abc",
        "diff": "diff --git a/a.py b/a.py\n+x = 1\ndiff --git a/b.py b/b.py\n+y = 2\n",
        "changed_files": [{"path": "a.py", "content": "x = 1\n"}],
    }
    calls = tool_call_message(
        ("get_pr_diff", {"path": "b.py"}),
        ("read_changed_file", {"path": "a.py"}),
        ("check_indentation", {"path": "a.py"}),
    )
    llm = model("favorable", calls)
    assert run(llm=llm, pull_request=pr)["verdict"] == "favorable"
    content = " ".join(str(m.content) for m in llm.seen[-1] if m.type == "tool")
    assert "+y = 2" in content and "+x = 1" not in content
