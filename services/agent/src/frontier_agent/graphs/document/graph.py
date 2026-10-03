from typing import Any

from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from frontier_agent.graphs.document.nodes import (
    detect_ambiguities,
    extract_clauses,
    propose_scenarios,
    route_after_ambiguities,
)
from frontier_agent.graphs.document.state import DocumentInput, DocumentState


def build_document_graph(
    checkpointer: BaseCheckpointSaver[Any] | None = None,
) -> CompiledStateGraph[Any, Any, Any, Any]:
    g = StateGraph(DocumentState, input_schema=DocumentInput)
    g.add_node("extract_clauses", extract_clauses)
    g.add_node("detect_ambiguities", detect_ambiguities)
    g.add_node("propose_scenarios", propose_scenarios)
    g.add_edge(START, "extract_clauses")
    g.add_edge("extract_clauses", "detect_ambiguities")
    g.add_conditional_edges(
        "detect_ambiguities",
        route_after_ambiguities,
        {"propose": "propose_scenarios", "end": END},
    )
    g.add_edge("propose_scenarios", END)
    return g.compile(checkpointer=checkpointer)
