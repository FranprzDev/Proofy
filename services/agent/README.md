# Frontier Agent (Python + LangGraph)

Document and CI/CD agents. See [docs/arquitectura-agentes.md](../../docs/arquitectura-agentes.md) and [ADR 0001](../../docs/adr/0001-agente-python-langgraph.md).

```bash
cp .env.example .env        # fill GOOGLE_API_KEY only to use real Gemini
uv sync
uv run frontier-agent       # FastAPI on :8000 (/docs, /health)
uv run pytest && uv run ruff check . && uv run mypy
uv run python -m frontier_agent.export_openapi openapi.json   # contract for Next.js
```

The LLM is provider-agnostic: `LLM_MODEL=<provider>:<model>` (Gemini by default; others need their `langchain-*` package). The current graphs are stubs without an LLM; tests and evals run offline.

## Glossary (Spanish docs → code)

| Docs (es) | Code |
| --- | --- |
| agente documental | `document` agent (`/document/*`) |
| hito | `milestone` |
| versión acordada del contrato | `contract_version` |
| inciso | `clause` |
| escenario / resultado esperado | `scenario` / `expected_result` |
| ambigüedad / pregunta sugerida | `ambiguity` / `suggested_question` |
| `necesita_aclaracion` | `needs_clarification` |
| propuesta / pendiente | `proposal` / `pending` |
| favorable / requiere corrección / inconcluso | `favorable` / `needs_fix` / `inconclusive` |
| atestación autorizada | `attestation_authorized` |
| veredicto / análisis / observaciones | `verdict` / `analysis` / `observations` |
