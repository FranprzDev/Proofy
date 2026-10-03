import json
from pathlib import Path

import pytest

from frontier_agent.cli import main


def test_plan_writes_files_and_exits_zero(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    doc = tmp_path / "contract.md"
    doc.write_text("# T\n- Users must log in at /login.\n- Client pays invoices.\n")
    out = tmp_path / "out"
    code = main(["plan", str(doc), "--contract-version", "v2", "--out", str(out)])
    assert code == 0
    plan = json.loads((out / "plan.json").read_text())
    assert plan["contract_id"] == "contract" and plan["contract_version"] == "v2"
    assert (out / "tests" / "contract.e2e.ts").exists()
    assert "TC-001" in capsys.readouterr().out


def test_plan_needs_clarification_exits_three(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    doc = tmp_path / "c.md"
    doc.write_text("- Adequate performance, etc.\n")
    out = tmp_path / "out"
    assert main(["plan", str(doc), "--out", str(out)]) == 3
    assert "question:" in capsys.readouterr().out
    assert not out.exists()


def test_plan_answers_file_resolves_ambiguity(tmp_path: Path) -> None:
    doc = tmp_path / "c.md"
    doc.write_text("- Adequate performance\n")
    answers = tmp_path / "a.txt"
    answers.write_text("Adequate performance: p95 < 300 ms\n")
    assert main(["plan", str(doc), "--answers", str(answers), "--out", str(tmp_path / "o")]) == 0


def test_plan_missing_file_exits_two(tmp_path: Path) -> None:
    assert main(["plan", str(tmp_path / "nope.md")]) == 2
