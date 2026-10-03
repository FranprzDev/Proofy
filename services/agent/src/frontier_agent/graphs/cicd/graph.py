from typing import Any

from langchain_core.language_models import BaseChatModel
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from frontier_agent.graphs.cicd.nodes import (
    analyze,
    evaluate_dynamic,
    evaluate_static,
    make_review_code,
    render_comment,
    validate_and_authorize,
    verify_refs,
)
from frontier_agent.graphs.cicd.state import CicdInput, CicdState


def build_cicd_graph(
    checkpointer: BaseCheckpointSaver[Any] | None = None,
    llm: BaseChatModel | None = None,
) -> CompiledStateGraph[Any, Any, Any, Any]:
    g = StateGraph(CicdState, input_schema=CicdInput)
    steps: list[tuple[str, Any]] = [
        ("verify_refs", verify_refs),
        ("evaluate_dynamic", evaluate_dynamic),
        ("evaluate_static", evaluate_static),
        ("review_code", make_review_code(llm)),
        ("analyze", analyze),
        ("validate_and_authorize", validate_and_authorize),
        ("render_comment", render_comment),
    ]
    for name, fn in steps:
        g.add_node(name, fn)
    g.add_edge(START, steps[0][0])
    for (a, _), (b, _) in zip(steps, steps[1:], strict=False):
        g.add_edge(a, b)
    g.add_edge(steps[-1][0], END)
    return g.compile(checkpointer=checkpointer)
