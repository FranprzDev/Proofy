# Frontier Agent (Python + LangGraph)

Agentes documental y CI/CD. Ver [docs/arquitectura-agentes.md](../../docs/arquitectura-agentes.md) y [ADR 0001](../../docs/adr/0001-agente-python-langgraph.md).

```bash
cp .env.example .env        # completar GOOGLE_API_KEY solo para usar Gemini real
uv sync
uv run frontier-agent       # FastAPI en :8000 (/docs, /health)
uv run pytest && uv run ruff check . && uv run mypy
uv run python -m frontier_agent.export_openapi openapi.json   # contrato para Next.js
```

El LLM es agnóstico: `LLM_MODEL=<proveedor>:<modelo>` (Gemini por defecto; otros requieren su paquete `langchain-*`). Los grafos actuales son stubs sin LLM; tests y evals corren sin red.
