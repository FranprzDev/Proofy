from evals.harness import load_dataset, run_cicd_eval
from frontier_agent.graphs.cicd import build_cicd_graph


def test_cicd_eval_dataset() -> None:
    rows = run_cicd_eval(build_cicd_graph(), load_dataset("cicd"))
    assert all(ok for _, ok, _ in rows), rows


def test_favorable_autoriza_solo_con_misma_revision() -> None:
    g = build_cicd_graph()
    ref = {"hito_id": "h", "contrato_version": "v", "revision": "a"}
    base = {"esperado": ref, "resultados": [{"scenario_id": "s", "status": "passed"}]}
    assert g.invoke({**base, "evidencia_ref": ref})["atestacion_autorizada"] is True
    assert g.invoke(base)["atestacion_autorizada"] is False
