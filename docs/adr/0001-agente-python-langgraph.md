# ADR 0001 — Servicio de agentes en Python + LangGraph

Estado: aceptado (scaffold inicial).

## Contexto
Dos agentes (documental y CI/CD) con estados explícitos, trazabilidad por hito/versión/revisión y separación entre análisis y autorización. Next.js conserva el frontend/backend web.

## Decisiones
- Python 3.12 + uv, Pydantic v2, LangGraph; FastAPI como frontera HTTP (OpenAPI para Next.js, SSE para streaming).
- Auth Next.js → Python: API key compartida (`X-API-Key`), tiempo constante, falla cerrada.
- LLM agnóstico vía `init_chat_model` (`LLM_MODEL=proveedor:modelo`); Gemini por defecto en la demo. Sin LiteLLM. Topes de reintentos/tokens/recursión por env.
- Evidencia de CI/CD por webhook `workflow_run` de GitHub App, por SHA exacto, firma HMAC. En el scaffold solo contrato + endpoint stub.
- Checkpoints: `MemorySaver` tras una fábrica; Postgres más adelante.
- Observabilidad: logging JSON estructurado sin payloads privados; sin LangSmith/OTel por ahora.
- Ante documentación ambigua o incompleta el agente documental avisa (`needs_clarification` + preguntas sugeridas) y no propone escenarios.
- Un resultado favorable solo autoriza si la evidencia coincide con hito, versión y revisión esperados; faltante o inconsistente = inconcluso. El servicio no ejecuta pagos ni guarda claves de atestación.

## Consecuencias
Cambiar de proveedor o de checkpointer no toca los grafos. Quedan abiertos los pendientes listados en [arquitectura-agentes.md](../arquitectura-agentes.md).
