import json
from pathlib import Path

from evals.harness import load_dataset, run_cicd_eval
from frontier_agent.graphs.cicd import build_cicd_graph
from frontier_agent.llm.fake import make_fake_chat_model

FIX = Path(__file__).parent / "fixtures"
REF = {"milestone_id": "m", "contract_version": "v", "revision": "abc"}
PASS_XML = (FIX / "junit_pass.xml").read_text()
CLEAN_STATIC = {"ruff_json": "[]", "eslint_json": "[]"}


def run(llm: object = None, **over: object) -> dict[str, object]:
    base: dict[str, object] = {
        "expected": REF,
        "evidence_ref": REF,
        "pull_request": {"number": 1, "head_sha": "abc"},
        "expected_test_ids": ["TC-001", "TC-002"],
        "e2e_junit_xml": PASS_XML,
        "static": CLEAN_STATIC,
    }
    return build_cicd_graph(llm=llm).invoke({**base, **over})  # type: ignore[arg-type]


def test_cicd_eval_dataset() -> None:
    rows = run_cicd_eval(build_cicd_graph(), load_dataset("cicd"))
    assert all(ok for _, ok, _ in rows), rows


def test_favorable() -> None:
    out = run()
    assert out["verdict"] == "favorable"
    assert out["attestation_authorized"] is True
    assert "Favorable" in str(out["pr_comment"])


def test_favorable_authorizes_only_with_same_revision() -> None:
    g = build_cicd_graph()
    base = {
        "expected": REF,
        "results": [{"scenario_id": "s", "status": "passed"}],
        "static": CLEAN_STATIC,
    }
    assert g.invoke({**base, "evidence_ref": REF})["attestation_authorized"] is True
    assert g.invoke(base)["attestation_authorized"] is False


def test_e2e_failure_needs_fix() -> None:
    out = run(e2e_junit_xml=(FIX / "junit_mixed.xml").read_text(), expected_test_ids=[])
    # The mixed fixture has an error entry, so it is inconclusive...
    assert out["verdict"] == "inconclusive"
    xml = (
        '<testsuite><testcase name="TC-001: a"/>'
        '<testcase name="TC-002: b"><failure message="x"/></testcase></testsuite>'
    )
    out = run(e2e_junit_xml=xml)
    assert out["verdict"] == "needs_fix"
    assert "TC-002" in str(out["pr_comment"])
    assert out["attestation_authorized"] is False


def test_missing_expected_test_inconclusive() -> None:
    out = run(expected_test_ids=["TC-001", "TC-002", "TC-003"])
    assert out["verdict"] == "inconclusive"
    assert any("TC-003" in o for o in out["observations"])  # type: ignore[attr-defined]


def test_startup_failure_inconclusive() -> None:
    out = run(e2e_junit_xml=(FIX / "junit_unreachable.xml").read_text(), expected_test_ids=[])
    assert out["verdict"] == "inconclusive"


def test_malformed_junit_inconclusive() -> None:
    assert run(e2e_junit_xml="<oops")["verdict"] == "inconclusive"


def test_head_sha_mismatch_inconclusive() -> None:
    out = run(pull_request={"number": 1, "head_sha": "zzz"})
    assert out["verdict"] == "inconclusive"
    assert out["attestation_authorized"] is False


def test_static_ruff_blocks() -> None:
    out = run(static={"ruff_json": (FIX / "ruff.json").read_text()})
    assert out["verdict"] == "needs_fix"
    assert "F401" in str(out["pr_comment"])


def test_eslint_warning_does_not_block() -> None:
    warn = json.dumps([{"filePath": "a.ts", "messages": [{"severity": 1, "message": "w"}]}])
    out = run(static={"eslint_json": warn})
    assert out["verdict"] == "favorable"
    assert "Non-blocking" in str(out["pr_comment"])


def test_format_and_indentation_block() -> None:
    assert run(static={"unformatted_files": ["a.py"]})["verdict"] == "needs_fix"
    pr = {
        "number": 1,
        "head_sha": "abc",
        "changed_files": [{"path": "a.py", "content": "if x:\n  y = 1\n"}],
    }
    assert run(pull_request=pr)["verdict"] == "needs_fix"


def test_bad_static_report_is_observation() -> None:
    out = run(static={"ruff_json": "not json"})
    assert out["verdict"] == "favorable"
    assert any("ruff" in o for o in out["observations"])  # type: ignore[attr-defined]


PR_DIFF = {"number": 1, "head_sha": "abc", "diff": "+x = 1"}


def test_llm_blocking_finding() -> None:
    reply = '```json\n[{"path": "a.py", "line": 1, "message": "bug", "blocking": true}]\n```'
    out = run(llm=make_fake_chat_model(reply), pull_request=PR_DIFF)
    assert out["verdict"] == "needs_fix"
    assert "additional objection" in str(out["pr_comment"])


def test_llm_nonblocking_finding() -> None:
    reply = '[{"message": "nit", "blocking": false}]'
    assert run(llm=make_fake_chat_model(reply), pull_request=PR_DIFF)["verdict"] == "favorable"


def test_llm_bad_json_is_observation() -> None:
    out = run(llm=make_fake_chat_model("sorry, no"), pull_request=PR_DIFF)
    assert out["verdict"] == "favorable"
    assert any("LLM review" in o for o in out["observations"])  # type: ignore[attr-defined]


def test_missing_static_evidence_inconclusive() -> None:
    out = run(static={})
    assert out["static_verdict"] == "inconclusive"
    assert out["verdict"] == "inconclusive"
    assert out["attestation_authorized"] is False
