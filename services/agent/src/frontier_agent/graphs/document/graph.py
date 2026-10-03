from collections.abc import Hashable
from typing import Any

from langchain_core.language_models import BaseChatModel
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from frontier_agent.config import Settings
from frontier_agent.graphs.document.nodes import (
    llm_unavailable,
    make_run_agent,
    prepare,
    render_e2e_suite,
    route_after_prepare,
)
from frontier_agent.graphs.document.state import DocumentInput, DocumentState
from frontier_agent.schemas import DocumentStatus


def build_document_graph(
    checkpointer: BaseCheckpointSaver[Any] | None = None,
    llm: BaseChatModel | None = None,
    settings: Settings | None = None,
) -> CompiledStateGraph[Any, Any, Any, Any]:
    """The core is a tool-calling agent. With `llm=None` it never invents test cases:
    the status is `llm_unavailable`."""

    def route(state: DocumentState) -> str:
        return route_after_prepare(state, llm)

    def after_agent(state: DocumentState) -> str:
        return "render" if state.status == DocumentStatus.PROPOSAL else "end"

    g = StateGraph(DocumentState, input_schema=DocumentInput)
    g.add_node("prepare", prepare)
    g.add_node("llm_unavailable", llm_unavailable)
    if llm is not None:
        g.add_node("agent", make_run_agent(llm, settings))
    g.add_node("render_e2e_suite", render_e2e_suite)
    g.add_edge(START, "prepare")
    targets: dict[Hashable, str] = {"end": END, "llm_unavailable": "llm_unavailable"}
    if llm is not None:
        targets["agent"] = "agent"
        g.add_conditional_edges("agent", after_agent, {"render": "render_e2e_suite", "end": END})
    g.add_conditional_edges("prepare", route, targets)
    g.add_edge("llm_unavailable", END)
    g.add_edge("render_e2e_suite", END)
    return g.compile(checkpointer=checkpointer)
