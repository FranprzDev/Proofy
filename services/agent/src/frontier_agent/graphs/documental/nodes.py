import re
from typing import Any

from frontier_agent.graphs.documental.state import (
    Ambiguedad,
    DocumentalState,
    Escenario,
    EstadoDocumental,
)

# Stub determinista (sin LLM): marcas léxicas de vaguedad o información faltante.
_MARCAS = re.compile(
    r"\b(tbd|a definir|por definir|etc\.?|y otros|según corresponda|lo antes posible|"
    r"adecuad[oa]s?|razonable)\b|\?|\.\.\.",
    re.IGNORECASE,
)


def extraer_incisos(state: DocumentalState) -> dict[str, Any]:
    incisos = [ln.strip() for ln in state.documento.splitlines() if ln.strip()]
    # Valores iniciales explícitos: la salida del grafo siempre trae todas las claves.
    return {
        "incisos": incisos,
        "ambiguedades": [],
        "escenarios": [],
        "pendientes": [],
        "aceptado_por_cliente": False,
        "aceptado_por_proveedor": False,
    }


def detectar_ambiguedades(state: DocumentalState) -> dict[str, Any]:
    if not state.incisos:
        return {
            "estado": EstadoDocumental.NECESITA_ACLARACION,
            "ambiguedades": [
                Ambiguedad(
                    inciso="(documento)",
                    motivo="El documento no contiene incisos analizables.",
                    pregunta_sugerida="¿Podés cargar el documento rector con sus incisos?",
                )
            ],
            "pendientes": ["El documento no contiene incisos analizables."],
        }
    respondidos = " ".join(state.respuestas)
    ambiguedades = []
    for inciso in state.incisos:
        m = _MARCAS.search(inciso)
        if m and inciso not in respondidos:
            ambiguedades.append(
                Ambiguedad(
                    inciso=inciso,
                    motivo=f"Término impreciso o incompleto: «{m.group(0)}».",
                    pregunta_sugerida=f"¿Qué condición medible define este inciso? «{inciso}»",
                )
            )
    if ambiguedades:
        return {
            "estado": EstadoDocumental.NECESITA_ACLARACION,
            "ambiguedades": ambiguedades,
            "pendientes": [a.pregunta_sugerida for a in ambiguedades],
        }
    return {}


def ruta_tras_ambiguedades(state: DocumentalState) -> str:
    return "fin" if state.estado == EstadoDocumental.NECESITA_ACLARACION else "proponer"


def proponer_escenarios(state: DocumentalState) -> dict[str, Any]:
    # Stub: sin LLM. Cada inciso queda cubierto por un escenario borrador.
    escenarios = [
        Escenario(
            inciso=i,
            descripcion=f"[borrador] verificar: {i}",
            resultado_esperado="[por definir con ambas partes]",
        )
        for i in state.incisos
    ]
    return {"estado": EstadoDocumental.PROPUESTA, "escenarios": escenarios}
