from typing import Any

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from frontier_agent.graphs.documental.nodes import (
    detectar_ambiguedades,
    extraer_incisos,
    proponer_escenarios,
    ruta_tras_ambiguedades,
)
from frontier_agent.graphs.documental.state import DocumentalInput, DocumentalState


def build_documental_graph(
    checkpointer: BaseCheckpointSaver[Any] | None = None,
) -> CompiledStateGraph[Any, Any, Any, Any]:
    g = StateGraph(DocumentalState, input_schema=DocumentalInput)
    g.add_node("extraer_incisos", extraer_incisos)
    g.add_node("detectar_ambiguedades", detectar_ambiguedades)
    g.add_node("proponer_escenarios", proponer_escenarios)
    g.add_edge(START, "extraer_incisos")
    g.add_edge("extraer_incisos", "detectar_ambiguedades")
    g.add_conditional_edges(
        "detectar_ambiguedades",
        ruta_tras_ambiguedades,
        {"proponer": "proponer_escenarios", "fin": END},
    )
    g.add_edge("proponer_escenarios", END)
    return g.compile(checkpointer=checkpointer)
