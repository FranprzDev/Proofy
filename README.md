# Proofy

Pagos por hito verificados por agentes (Solana). Documentación en [docs/](docs/): [producto](docs/proyecto.md), [web](docs/arquitectura-web.md), [agentes](docs/arquitectura-agentes.md), [ADR](docs/adr/).

| Carpeta | Contenido |
| --- | --- |
| `apps/web` | Next.js (App Router, TypeScript, Tailwind, pnpm): landing, marketplace y route handlers que llaman al agente |
| `services/agent` | Python 3.12 + LangGraph + FastAPI (uv): agentes documental y CI/CD |

## Requisitos

Node 22+, pnpm, Python 3.12+ y [uv](https://docs.astral.sh/uv/).

## Levantar

```bash
make setup
cp services/agent/.env.example services/agent/.env   # AGENT_API_KEY, GOOGLE_API_KEY (solo para Gemini real)
cp apps/web/.env.example apps/web/.env.local         # AGENT_API_URL, AGENT_API_KEY (misma clave que el agente)
make dev-agent   # http://localhost:8000  (/docs, /health)
make dev-web     # http://localhost:3000
```

`AGENT_API_KEY` solo vive en servidores: la web la usa desde route handlers, nunca el navegador.

## Verificar

```bash
make check       # lint + typecheck + tests + build, sin red ni claves reales
make gen-api     # regenera OpenAPI y tipos TS tras cambiar contratos del agente
```

## Estado

Scaffold: los grafos son stubs sin LLM, el webhook de GitHub solo valida firma y la sesión (Phantom/SIWS) es un placeholder. No hay pagos ni claves de atestación.
