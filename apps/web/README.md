# apps/web

Next.js (App Router). See the [root README](../../README.md). Next.js 16 differs from earlier versions: check `node_modules/next/dist/docs/` before writing code.

- `src/lib/agent/client.ts`: server-only (`server-only`) client for the Python service, sending `X-API-Key`.
- `src/lib/agent/schema.d.ts`: types generated with `pnpm gen:api` from `openapi/agent.json` (do not edit).
- `src/app/api/agent/*`: route handlers that forward to the agent.
- `src/lib/auth/session.ts`: Phantom/SIWS placeholder.
