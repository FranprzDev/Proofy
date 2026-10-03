from evals.harness import load_dataset, run_cicd_eval
from frontier_agent.graphs.cicd import build_cicd_graph


def test_cicd_eval_dataset() -> None:
    rows = run_cicd_eval(build_cicd_graph(), load_dataset("cicd"))
    assert all(ok for _, ok, _ in rows), rows


def test_favorable_authorizes_only_with_same_revision() -> None:
    g = build_cicd_graph()
    ref = {"milestone_id": "m", "contract_version": "v", "revision": "a"}
    base = {"expected": ref, "results": [{"scenario_id": "s", "status": "passed"}]}
    assert g.invoke({**base, "evidence_ref": ref})["attestation_authorized"] is True
    assert g.invoke(base)["attestation_authorized"] is False
