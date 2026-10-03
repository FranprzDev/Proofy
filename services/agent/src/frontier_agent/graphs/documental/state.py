from enum import StrEnum

from pydantic import BaseModel, Field


class EstadoDocumental(StrEnum):
    PENDIENTE = "pendiente"
    NECESITA_ACLARACION = "necesita_aclaracion"
    PROPUESTA = "propuesta"


class DocumentalInput(BaseModel):
    contrato_id: str
    documento: str
    respuestas: list[str] = Field(default_factory=list)


class Ambiguedad(BaseModel):
    inciso: str
    motivo: str
    pregunta_sugerida: str


class Escenario(BaseModel):
    inciso: str
    descripcion: str
    resultado_esperado: str


class DocumentalState(DocumentalInput):
    estado: EstadoDocumental = EstadoDocumental.PENDIENTE
    incisos: list[str] = Field(default_factory=list)
    # Si hay ambigüedades el agente avisa y no propone escenarios: no inventa.
    ambiguedades: list[Ambiguedad] = Field(default_factory=list)
    escenarios: list[Escenario] = Field(default_factory=list)
    pendientes: list[str] = Field(default_factory=list)
    # El agente propone; solo las partes aceptan.
    aceptado_por_cliente: bool = False
    aceptado_por_proveedor: bool = False
