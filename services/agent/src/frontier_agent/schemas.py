"""Contratos compartidos entre agentes y Next.js (se exportan a OpenAPI)."""

from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class Verdict(StrEnum):
    FAVORABLE = "favorable"
    REQUIERE_CORRECCION = "requiere_correccion"
    INCONCLUSO = "inconcluso"


class Ref(BaseModel):
    """Identifica contra qué se evalúa: hito, versión acordada y revisión exacta."""

    model_config = ConfigDict(frozen=True)

    hito_id: str
    contrato_version: str
    revision: str
