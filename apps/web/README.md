# apps/web

Next.js (App Router). Ver el [README raíz](../../README.md). Next.js 16 difiere de versiones previas: consultar `node_modules/next/dist/docs/` antes de escribir código.

- `src/lib/agent/client.ts`: cliente solo-servidor (`server-only`) del servicio Python, con `X-API-Key`.
- `src/lib/agent/schema.d.ts`: tipos generados con `pnpm gen:api` desde `openapi/agent.json` (no editar).
- `src/app/api/agent/*`: route handlers que reenvían al agente.
- `src/lib/auth/session.ts`: placeholder de Phantom/SIWS.
