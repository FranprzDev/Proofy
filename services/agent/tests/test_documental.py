from typing import Any

from frontier_agent.graphs.documental import EstadoDocumental, build_documental_graph


def _run(doc: str, respuestas: list[str] | None = None) -> dict[str, Any]:
    return build_documental_graph().invoke(
        {"contrato_id": "c1", "documento": doc, "respuestas": respuestas or []}
    )


def test_cubre_cada_inciso_y_no_acepta_por_las_partes() -> None:
    out = _run("Login con email\nExportar CSV\n")
    assert out["estado"] == EstadoDocumental.PROPUESTA
    assert [e.inciso for e in out["escenarios"]] == ["Login con email", "Exportar CSV"]
    assert out["ambiguedades"] == []
    assert out["aceptado_por_cliente"] is False and out["aceptado_por_proveedor"] is False


def test_documento_vacio_necesita_aclaracion() -> None:
    out = _run("")
    assert out["estado"] == EstadoDocumental.NECESITA_ACLARACION
    assert out["pendientes"] and out["escenarios"] == []


def test_inciso_ambiguo_avisa_y_no_propone_escenarios() -> None:
    out = _run("Login con email\nRendimiento adecuado, etc.\n")
    assert out["estado"] == EstadoDocumental.NECESITA_ACLARACION
    assert out["escenarios"] == []
    assert [a.inciso for a in out["ambiguedades"]] == ["Rendimiento adecuado, etc."]
    assert out["ambiguedades"][0].pregunta_sugerida


def test_ambiguedad_respondida_permite_proponer() -> None:
    inciso = "Rendimiento adecuado"
    out = _run(inciso, [f"{inciso}: p95 < 300 ms"])
    assert out["estado"] == EstadoDocumental.PROPUESTA


def test_documental_eval_dataset() -> None:
    from evals.harness import load_dataset, run_documental_eval

    rows = run_documental_eval(build_documental_graph(), load_dataset("documental"))
    assert all(ok for _, ok, _ in rows), rows
