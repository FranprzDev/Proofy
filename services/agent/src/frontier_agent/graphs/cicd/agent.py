"""The review agent: a bounded tool-calling loop that ends when a verdict is submitted."""

from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import BaseTool

from frontier_agent.graphs.cicd.prompts import REVIEW_SYSTEM, REVIEW_USER
from frontier_agent.graphs.cicd.tools import ReviewContext, build_tools

MAX_STEPS = 16


def _call_tool(tools: dict[str, BaseTool], name: str, args: dict[str, Any]) -> tuple[str, bool]:
    tool = tools.get(name)
    if tool is None:
        return f"Unknown tool {name!r}. Available: {sorted(tools)}", True
    try:
        return str(tool.invoke(args)), False
    except Exception as exc:  # bad arguments must go back to the model, not crash the review
        return f"Tool error: {type(exc).__name__}: {str(exc)[:300]}", True


def run_review_agent(llm: BaseChatModel, ctx: ReviewContext) -> None:
    """Runs the loop; results land in `ctx` (recorded findings, submission)."""
    tools = build_tools(ctx)
    by_name = {t.name: t for t in tools}
    model = llm.bind_tools(tools)
    pr = ctx.state.pull_request
    messages: list[BaseMessage] = [
        SystemMessage(REVIEW_SYSTEM),
        HumanMessage(
            REVIEW_USER.format(
                number=pr.number if pr else "(none)",
                title=f" ({pr.title})" if pr and pr.title else "",
                milestone=ctx.state.expected.milestone_id,
                version=ctx.state.expected.contract_version,
            )
        ),
    ]
    for _ in range(MAX_STEPS):
        ai = model.invoke(messages)
        messages.append(ai)
        calls = getattr(ai, "tool_calls", None) or []
        if not calls:
            return
        for call in calls:
            content, failed = _call_tool(by_name, call["name"], call["args"])
            messages.append(
                ToolMessage(
                    content=content,
                    tool_call_id=call["id"] or call["name"],
                    status="error" if failed else "success",
                )
            )
        if ctx.submission is not None:
            return
