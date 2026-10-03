import json
from pathlib import Path
from typing import Any

import pytest

from frontier_agent.cli import main
from frontier_agent.llm.fake import make_fake_tool_model, tool_call_message

FIX = Path(__file__).parent / "fixtures"


def _llm(verdict: str) -> Any:
    return make_fake_tool_model(
        tool_call_message(
            (
                "submit_verdict",
                {"dynamic": verdict, "static": verdict, "verdict": verdict, "summary": "s"},
            )
        )
    )


def _args(tmp_path: Path, report: str) -> list[str]:
    ruff = tmp_path / "ruff.json"
    ruff.write_text("[]")
    plan = tmp_path / "plan.json"
    plan.write_text(json.dumps(["TC-001", "TC-002"]))
    return [
        "review", "--milestone", "m", "--contract-version", "v", "--sha", "abc",
        "--report-json", str(FIX / report), "--ruff", str(ruff), "--plan", str(plan),
        "--comment-out", str(tmp_path / "c.md"),
    ]  # fmt: skip


def test_exit_0_favorable(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setattr("frontier_agent.graphs.cicd.cli._make_llm", lambda: _llm("favorable"))
    assert main(_args(tmp_path, "report_pass.json")) == 0
    assert json.loads(capsys.readouterr().out)["attestation_authorized"] is True
    assert "Favorable" in (tmp_path / "c.md").read_text()


def test_exit_1_needs_fix(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("frontier_agent.graphs.cicd.cli._make_llm", lambda: _llm("favorable"))
    assert main(_args(tmp_path, "report_failed.json")) == 1


def test_exit_2_without_llm(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("frontier_agent.graphs.cicd.cli._make_llm", lambda: None)
    assert main(_args(tmp_path, "report_pass.json")) == 2


def test_exit_2_on_unreadable_input(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr("frontier_agent.graphs.cicd.cli._make_llm", lambda: None)
    args = _args(tmp_path, "missing.json")
    assert main(args) == 2
