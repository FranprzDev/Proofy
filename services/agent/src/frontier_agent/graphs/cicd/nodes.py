from typing import Any

from frontier_agent.graphs.cicd.state import CicdState, ScenarioStatus
from frontier_agent.schemas import Verdict


def analizar(state: CicdState) -> dict[str, Any]:
    """Análisis: propone un veredicto a partir de la evidencia. No autoriza nada."""
    if not state.resultados:
        return {"analisis": Verdict.INCONCLUSO, "observaciones": ["Sin evidencia del pipeline."]}
    estados = {r.status for r in state.resultados}
    if ScenarioStatus.FAILED in estados:
        fallos = [r.scenario_id for r in state.resultados if r.status == ScenarioStatus.FAILED]
        return {
            "analisis": Verdict.REQUIERE_CORRECCION,
            "observaciones": [f"Escenarios fallidos: {', '.join(fallos)}"],
        }
    if estados != {ScenarioStatus.PASSED}:
        return {
            "analisis": Verdict.INCONCLUSO,
            "observaciones": ["Hay tests omitidos o con error de entorno; sin atribuir fallo."],
        }
    return {"analisis": Verdict.FAVORABLE}


def validar_y_autorizar(state: CicdState) -> dict[str, Any]:
    """Validación: favorable requiere evidencia del mismo hito, versión y revisión."""
    veredicto = state.analisis or Verdict.INCONCLUSO
    obs = list(state.observaciones)
    if veredicto == Verdict.FAVORABLE and state.evidencia_ref != state.esperado:
        veredicto = Verdict.INCONCLUSO
        obs.append("La evidencia no corresponde al hito, versión y revisión esperados.")
    return {
        "veredicto": veredicto,
        "atestacion_autorizada": veredicto == Verdict.FAVORABLE,
        "observaciones": obs,
    }
