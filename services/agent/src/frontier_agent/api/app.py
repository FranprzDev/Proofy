import json
import logging
import uuid
from collections.abc import AsyncIterator
from typing import Annotated, Any

from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from langgraph.graph.state import CompiledStateGraph
from pydantic import ValidationError
from sse_starlette.sse import EventSourceResponse

from frontier_agent.checkpoint import make_checkpointer
from frontier_agent.config import Settings, get_settings
from frontier_agent.github import WorkflowRunEvent
from frontier_agent.graphs.cicd import CicdInput, CicdState, build_cicd_graph
from frontier_agent.graphs.documental import (
    DocumentalInput,
    DocumentalState,
    build_documental_graph,
)
from frontier_agent.logging_config import configure_logging
from frontier_agent.security import require_api_key, verify_github_signature

log = logging.getLogger("frontier_agent")


def create_app() -> FastAPI:
    configure_logging(get_settings().log_level)
    app = FastAPI(title="Frontier Agent", version="0.1.0")
    checkpointer = make_checkpointer()
    documental = build_documental_graph(checkpointer)
    cicd = build_cicd_graph(checkpointer)
    auth = [Depends(require_api_key)]

    def cfg(thread_id: str | None) -> Any:
        return {
            "configurable": {"thread_id": thread_id or str(uuid.uuid4())},
            "recursion_limit": get_settings().graph_recursion_limit,
        }

    async def stream(
        graph: CompiledStateGraph[Any, Any, Any, Any],
        payload: dict[str, Any],
        thread_id: str | None,
    ) -> AsyncIterator[dict[str, str]]:
        async for chunk in graph.astream(payload, cfg(thread_id), stream_mode="updates"):
            yield {"event": "update", "data": json.dumps(chunk, default=str)}
        yield {"event": "done", "data": "{}"}

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.post("/documental/invoke", response_model=DocumentalState, dependencies=auth)
    async def documental_invoke(body: DocumentalInput, thread_id: str | None = None) -> Any:
        log.info("documental.invoke", extra={"ctx": {"contrato_id": body.contrato_id}})
        return await documental.ainvoke(body.model_dump(), cfg(thread_id))

    @app.post("/documental/stream", dependencies=auth)
    async def documental_stream(
        body: DocumentalInput, thread_id: str | None = None
    ) -> EventSourceResponse:
        return EventSourceResponse(stream(documental, body.model_dump(), thread_id))

    @app.post("/cicd/invoke", response_model=CicdState, dependencies=auth)
    async def cicd_invoke(body: CicdInput, thread_id: str | None = None) -> Any:
        log.info("cicd.invoke", extra={"ctx": {"hito_id": body.esperado.hito_id}})
        return await cicd.ainvoke(body.model_dump(), cfg(thread_id))

    @app.post("/cicd/stream", dependencies=auth)
    async def cicd_stream(body: CicdInput, thread_id: str | None = None) -> EventSourceResponse:
        return EventSourceResponse(stream(cicd, body.model_dump(), thread_id))

    @app.post("/webhooks/github", status_code=status.HTTP_202_ACCEPTED)
    async def github_webhook(
        request: Request,
        settings: Annotated[Settings, Depends(get_settings)],
        x_hub_signature_256: Annotated[str | None, Header()] = None,
        x_github_event: Annotated[str | None, Header()] = None,
    ) -> dict[str, str]:
        """Stub: valida firma y parsea `workflow_run`. No llama a GitHub ni al grafo todavía."""
        body = await request.body()
        if not verify_github_signature(settings.github_webhook_secret, body, x_hub_signature_256):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "firma inválida")
        if x_github_event != "workflow_run":
            return {"status": "ignored"}
        try:
            event = WorkflowRunEvent.model_validate_json(body)
        except ValidationError as exc:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "evento inválido") from exc
        log.info(
            "github.workflow_run",
            extra={"ctx": {"run_id": event.workflow_run.id, "sha": event.workflow_run.head_sha}},
        )
        return {"status": "accepted", "head_sha": event.workflow_run.head_sha}

    return app


app = create_app()
