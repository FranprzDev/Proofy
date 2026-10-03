from pathlib import Path

import pytest

from frontier_agent.graphs.cicd.parsers import (
    parse_eslint_json,
    parse_junit,
    parse_mypy_output,
    parse_ruff_json,
    parse_tsc_output,
    unformatted_findings,
)
from frontier_agent.graphs.cicd.state import ScenarioStatus

FIX = Path(__file__).parent / "fixtures"


def test_junit_statuses_and_ids() -> None:
    res = {r.scenario_id: r for r in parse_junit((FIX / "junit_mixed.xml").read_text())}
    assert res["TC-001"].status == ScenarioStatus.PASSED
    assert res["TC-002"].status == ScenarioStatus.FAILED
    assert res["TC-002"].detail == "button missing"
    assert res["TC-003"].status == ScenarioStatus.SKIPPED
    assert res["TC-004"].status == ScenarioStatus.ERROR


def test_junit_startup_failure_is_error() -> None:
    (r,) = parse_junit((FIX / "junit_unreachable.xml").read_text())
    assert r.status == ScenarioStatus.ERROR


def test_junit_malformed_and_xxe() -> None:
    with pytest.raises(ValueError):
        parse_junit("<testsuite>")
    bomb = '<?xml version="1.0"?><!DOCTYPE x [<!ENTITY a "b">]><testsuite>&a;</testsuite>'
    with pytest.raises(Exception):  # noqa: B017 - defusedxml forbids entities
        parse_junit(bomb)


def test_ruff() -> None:
    (f,) = parse_ruff_json((FIX / "ruff.json").read_text())
    assert (f.source, f.rule, f.path, f.line, f.blocking) == ("ruff", "F401", "src/a.py", 3, True)


def test_eslint_severity() -> None:
    err, warn = parse_eslint_json((FIX / "eslint.json").read_text())
    assert err.blocking and err.severity == "error"
    assert not warn.blocking and warn.severity == "warning"


def test_mypy() -> None:
    raw = (
        "src/a.py:10: error: Incompatible types  [assignment]\n"
        "src/a.py:10: note: see docs\n"
        "src/b.py:3:5: warning: unused ignore\n"
        "Found 1 error in 1 file\n"
    )
    err, warn = parse_mypy_output(raw)
    assert (err.path, err.line, err.rule, err.blocking) == ("src/a.py", 10, "assignment", True)
    assert warn.severity == "warning" and not warn.blocking


def test_tsc() -> None:
    raw = "web/a.ts(5,10): error TS2322: Type 'string' is not assignable to type 'number'.\n"
    (f,) = parse_tsc_output(raw)
    assert (f.path, f.line, f.rule, f.blocking) == ("web/a.ts", 5, "TS2322", True)


def test_unformatted() -> None:
    (f,) = unformatted_findings(["a.py"])
    assert f.source == "format" and f.blocking


def test_report_json_real_sample() -> None:
    from frontier_agent.graphs.cicd.parsers import parse_report_json
    from frontier_agent.graphs.cicd.state import E2EStepVerdict

    rep = parse_report_json((FIX / "testerarmy_report_sample.json").read_text())
    assert rep.commit == "2a9ae923f5943f34c21a4ad7cc5aedeb810e66b8" and rep.dirty is False
    (r,) = rep.results
    assert r.status == ScenarioStatus.PASSED
    assert r.scenario_id == "landing links to the marketplace"
    assert r.steps and all(s.verdict == E2EStepVerdict.PASSED for s in r.steps)
    assert r.steps[0].title == "/"


def test_report_json_failed_and_blocked() -> None:
    from frontier_agent.graphs.cicd.parsers import parse_report_json
    from frontier_agent.graphs.cicd.state import E2EStepVerdict

    res = {r.scenario_id: r for r in parse_report_json((FIX / "report_failed.json").read_text())[0]}
    assert res["TC-001"].status == ScenarioStatus.PASSED
    assert res["TC-002"].status == ScenarioStatus.FAILED
    assert "Pay not visible" in res["TC-002"].detail
    rep = parse_report_json((FIX / "report_blocked.json").read_text())
    blocked = {r.scenario_id: r for r in rep.results}["TC-002"]
    assert blocked.status == ScenarioStatus.ERROR
    assert blocked.steps[-1].verdict == E2EStepVerdict.BLOCKED


def test_report_json_invalid() -> None:
    from frontier_agent.graphs.cicd.parsers import parse_report_json

    for raw in ("nope", "{}", "[]"):
        with pytest.raises(ValueError):
            parse_report_json(raw)
