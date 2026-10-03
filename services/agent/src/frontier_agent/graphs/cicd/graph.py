from typing import Any

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from frontier_agent.graphs.cicd.nodes import analyze, validate_and_authorize
from frontier_agent.graphs.cicd.state import CicdInput, CicdState


def build_cicd_graph(
    checkpointer: BaseCheckpointSaver[Any] | None = None,
) -> CompiledStateGraph[Any, Any, Any, Any]:
    g = StateGraph(CicdState, input_schema=CicdInput)
    g.add_node("analyze", analyze)
    g.add_node("validate_and_authorize", validate_and_authorize)
    g.add_edge(START, "analyze")
    g.add_edge("analyze", "validate_and_authorize")
    g.add_edge("validate_and_authorize", END)
    return g.compile(checkpointer=checkpointer)
