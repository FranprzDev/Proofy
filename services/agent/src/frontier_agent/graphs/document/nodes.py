import logging
from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage, ToolMessage

from frontier_agent.config import Settings
from frontier_agent.graphs.document.prompts import SYSTEM_PROMPT, USER_PROMPT
from frontier_agent.graphs.document.state import Ambiguity, DocumentState, DocumentStatus
from frontier_agent.graphs.document.tools import Collector, build_tools, run_tool
from frontier_agent.testerarmy import render_suite

log = logging.getLogger("frontier_agent")

LLM_UNAVAILABLE_MESSAGE = (
    "No LLM configured: set LLM_ENABLED=true and LLM_MODEL (e.g. google_genai:gemini-2.5-flash) "
    "so the document agent can design test cases. It never invents them without a model."
)


def prepare(state: DocumentState) -> dict[str, Any]:
    from frontier_agent.graphs.document.tools import extract_clauses

    clauses = extract_clauses(state.document)
    out: dict[str, Any] = {
        "clauses": clauses,
        "ambiguities": [],
        "test_cases": [],
        "out_of_scope": [],
        "e2e_suite": {},
        "pending_items": [],
        "accepted_by_client": False,
        "accepted_by_provider": False,
    }
    if not clauses:
        out["status"] = DocumentStatus.NEEDS_CLARIFICATION
        out["ambiguities"] = [
            Ambiguity(
                clause="(document)",
                reason="The document has no analyzable clauses.",
                suggested_question="Can you upload the governing document with its clauses?",
            )
        ]
        out["pending_items"] = ["The document has no analyzable clauses."]
    return out


def route_after_prepare(state: DocumentState, llm: BaseChatModel | None) -> str:
    if state.status == DocumentStatus.NEEDS_CLARIFICATION:
        return "end"
    return "agent" if llm is not None else "llm_unavailable"


def llm_unavailable(state: DocumentState) -> dict[str, Any]:
    return {
        "status": DocumentStatus.LLM_UNAVAILABLE,
        "pending_items": [LLM_UNAVAILABLE_MESSAGE],
    }


def run_agent_loop(
    llm: BaseChatModel, state: DocumentState, settings: Settings
) -> tuple[Collector, list[str]]:
    """Tool-calling loop: model turn -> execute tool calls -> feed results, until finish()."""
    col = Collector(state.contract_id, state.contract_version, state.document, settings)
    tools = build_tools(col)
    by_name = {t.name: t for t in tools}
    model = llm.bind_tools(tools)
    answers = "\n".join(f"- {a}" for a in state.answers) or "(none)"
    messages: list[BaseMessage] = [
        SystemMessage(SYSTEM_PROMPT),
        HumanMessage(
            USER_PROMPT.format(
                contract_id=state.contract_id,
                contract_version=state.contract_version,
                n_sections=len(col.sections),
                n_clauses=len(col.clauses),
                answers=answers,
            )
        ),
    ]
    notes: list[str] = []
    for _ in range(settings.agent_max_iterations):
        reply = model.invoke(messages)
        messages.append(reply)
        calls = getattr(reply, "tool_calls", None) or []
        if not calls:
            break
        for call in calls:
            result = run_tool(by_name, call["name"], dict(call["args"]))
            messages.append(ToolMessage(content=result, tool_call_id=call["id"], name=call["name"]))
        if col.finished:
            break
    if not col.finished:
        notes.append(
            "The agent stopped before calling finish(); the proposal may be incomplete "
            "(raise AGENT_MAX_ITERATIONS or retry)."
        )
    return col, notes


def make_run_agent(llm: BaseChatModel, settings: Settings | None) -> Any:
    def run_agent(state: DocumentState) -> dict[str, Any]:
        from frontier_agent.config import get_settings

        s = settings or get_settings()
        try:
            col, notes = run_agent_loop(llm, state, s)
        except Exception as exc:  # noqa: BLE001 - provider/network failures must not crash the API
            log.exception("document agent failed")
            return {
                "status": DocumentStatus.PENDING,
                "pending_items": [f"The document agent failed ({type(exc).__name__}): {exc}"],
            }
        if col.ambiguities:
            return {
                "status": DocumentStatus.NEEDS_CLARIFICATION,
                "ambiguities": col.ambiguities,
                "pending_items": [a.suggested_question for a in col.ambiguities],
            }
        if not col.cases:
            notes.append("The agent produced no testable cases.")
        return {
            "status": DocumentStatus.PROPOSAL,
            "test_cases": col.cases,
            "out_of_scope": col.out_of_scope_lines(),
            "pending_items": notes,
        }

    return run_agent


def render_e2e_suite(state: DocumentState) -> dict[str, Any]:
    suite = render_suite(
        state.test_cases, state.contract_id, state.contract_version, state.out_of_scope
    )
    return {"e2e_suite": suite}
