from typing import Any

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from frontier_agent.graphs.cicd.nodes import analizar, validar_y_autorizar
from frontier_agent.graphs.cicd.state import CicdInput, CicdState


def build_cicd_graph(
    checkpointer: BaseCheckpointSaver[Any] | None = None,
) -> CompiledStateGraph[Any, Any, Any, Any]:
    g = StateGraph(CicdState, input_schema=CicdInput)
    g.add_node("analizar", analizar)
    g.add_node("validar_y_autorizar", validar_y_autorizar)
    g.add_edge(START, "analizar")
    g.add_edge("analizar", "validar_y_autorizar")
    g.add_edge("validar_y_autorizar", END)
    return g.compile(checkpointer=checkpointer)
