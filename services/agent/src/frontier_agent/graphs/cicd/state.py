from enum import StrEnum

from pydantic import BaseModel, Field

from frontier_agent.schemas import Ref, Verdict


class ScenarioStatus(StrEnum):
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    ERROR = "error"


class ScenarioResult(BaseModel):
    scenario_id: str
    status: ScenarioStatus
    detail: str = ""


class CicdInput(BaseModel):
    esperado: Ref
    # Referencia de la que proviene la evidencia del pipeline.
    evidencia_ref: Ref | None = None
    resultados: list[ScenarioResult] = Field(default_factory=list)


class CicdState(CicdInput):
    analisis: Verdict | None = None
    veredicto: Verdict | None = None
    # Solo la validación puede marcarlo; no ejecuta pagos ni usa claves.
    atestacion_autorizada: bool = False
    observaciones: list[str] = Field(default_factory=list)
