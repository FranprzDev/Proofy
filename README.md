# Proofy

Milestone payments verified by agents (Solana). Product docs live in [docs/](docs/) (Spanish): [product](docs/proyecto.md), [web](docs/arquitectura-web.md), [agents](docs/arquitectura-agentes.md), [ADR](docs/adr/).

| Folder | Contents |
| --- | --- |
| `apps/web` | Next.js (App Router, TypeScript, Tailwind, pnpm): landing, marketplace and route handlers that call the agent |
| `services/agent` | Python 3.12 + LangGraph + FastAPI (uv): document and CI/CD agents |

## Requirements

Node 22+, pnpm, Python 3.12+ and [uv](https://docs.astral.sh/uv/).

## Run

```bash
make setup
cp services/agent/.env.example services/agent/.env   # AGENT_API_KEY, GOOGLE_API_KEY (real Gemini only)
cp apps/web/.env.example apps/web/.env.local         # AGENT_API_URL, AGENT_API_KEY (same key as the agent)
make dev-agent   # http://localhost:8000  (/docs, /health)
make dev-web     # http://localhost:3000
```

`AGENT_API_KEY` only lives on servers: the web app uses it from route handlers, never the browser.

## Verify

```bash
make check       # lint + typecheck + tests + build, no network or real keys
make gen-api     # regenerate OpenAPI and TS types after changing agent contracts
```

## Status

Scaffold: graphs are stubs without an LLM, the GitHub webhook only validates the signature, and the session (Phantom/SIWS) is a placeholder. There are no payments or attestation keys.
