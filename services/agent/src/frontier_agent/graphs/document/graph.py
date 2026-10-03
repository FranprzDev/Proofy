from typing import Any

from langchain_core.language_models import BaseChatModel
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from frontier_agent.graphs.document.nodes import (
    detect_ambiguities,
    extract_clauses,
    propose_test_cases,
    render_e2e_suite,
    route_after_ambiguities,
)
from frontier_agent.graphs.document.state import DocumentInput, DocumentState


def build_document_graph(
    checkpointer: BaseCheckpointSaver[Any] | None = None,
    llm: BaseChatModel | None = None,
) -> CompiledStateGraph[Any, Any, Any, Any]:
    """With `llm=None` the graph uses deterministic heuristics (no network)."""

    def propose(state: DocumentState) -> dict[str, Any]:
        return propose_test_cases(state, llm)

    g = StateGraph(DocumentState, input_schema=DocumentInput)
    g.add_node("extract_clauses", extract_clauses)
    g.add_node("detect_ambiguities", detect_ambiguities)
    g.add_node("propose_test_cases", propose)
    g.add_node("render_e2e_suite", render_e2e_suite)
    g.add_edge(START, "extract_clauses")
    g.add_edge("extract_clauses", "detect_ambiguities")
    g.add_conditional_edges(
        "detect_ambiguities",
        route_after_ambiguities,
        {"propose": "propose_test_cases", "end": END},
    )
    g.add_edge("propose_test_cases", "render_e2e_suite")
    g.add_edge("render_e2e_suite", END)
    return g.compile(checkpointer=checkpointer)
