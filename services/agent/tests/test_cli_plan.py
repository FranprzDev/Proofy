import json
from pathlib import Path

import pytest

from frontier_agent.cli import main
from frontier_agent.config import Settings, get_settings
from frontier_agent.llm.fake import FakeToolCallingModel, make_fake_tool_model, tool_call_message

LOGIN = "Users must log in at /login."
PAY = "Client pays invoices."


def _submit(clause: str) -> tuple[str, dict[str, object]]:
    return "submit_test_case", {
        "clause": clause,
        "title": "Login",
        "objective": "o",
        "steps": ["log in"],
        "expected_results": ["dashboard shown"],
        "start_path": "/login",
    }


def _use_model(monkeypatch: pytest.MonkeyPatch, model: FakeToolCallingModel | None) -> None:
    settings = Settings(llm_enabled=model is not None)
    monkeypatch.setattr("frontier_agent.config.get_settings", lambda: settings)
    monkeypatch.setattr("frontier_agent.llm.get_chat_model", lambda *a, **k: model)


def test_plan_writes_files_and_exits_zero(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    doc = tmp_path / "contract.md"
    doc.write_text(f"# T\n- {LOGIN}\n- {PAY}\n")
    _use_model(
        monkeypatch,
        make_fake_tool_model(
            tool_call_message(
                _submit(LOGIN), ("mark_out_of_scope", {"clause": PAY, "reason": "payment"})
            ),
            tool_call_message(("finish", {})),
        ),
    )
    out = tmp_path / "out"
    assert main(["plan", str(doc), "--contract-version", "v2", "--out", str(out)]) == 0
    plan = json.loads((out / "plan.json").read_text())
    assert plan["contract_id"] == "contract" and plan["contract_version"] == "v2"
    assert (out / "tests" / "contract.e2e.ts").exists()
    assert "TC-001" in capsys.readouterr().out


def test_plan_needs_clarification_exits_three(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    doc = tmp_path / "c.md"
    doc.write_text("- Adequate performance, etc.\n")
    _use_model(
        monkeypatch,
        make_fake_tool_model(
            tool_call_message(
                (
                    "flag_ambiguity",
                    {
                        "clause": "Adequate performance, etc.",
                        "reason": "vague",
                        "suggested_question": "What latency?",
                    },
                )
            ),
            tool_call_message(("finish", {})),
        ),
    )
    out = tmp_path / "out"
    assert main(["plan", str(doc), "--out", str(out)]) == 3
    assert "question: What latency?" in capsys.readouterr().out
    assert not out.exists()


def test_plan_without_llm_exits_four(
    tmp_path: Path, capsys: pytest.CaptureFixture[str], monkeypatch: pytest.MonkeyPatch
) -> None:
    doc = tmp_path / "c.md"
    doc.write_text(f"- {LOGIN}\n")
    _use_model(monkeypatch, None)
    out = tmp_path / "out"
    assert main(["plan", str(doc), "--out", str(out)]) == 4
    assert "LLM_ENABLED" in capsys.readouterr().err
    assert not out.exists()


def test_plan_missing_file_exits_two(tmp_path: Path) -> None:
    assert main(["plan", str(tmp_path / "nope.md")]) == 2


def test_get_settings_still_available() -> None:
    assert get_settings().agent_max_iterations == 40
