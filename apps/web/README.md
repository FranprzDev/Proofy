# apps/web

Next.js (App Router). See the [root README](../../README.md). Next.js 16 differs from earlier versions: check `node_modules/next/dist/docs/` before writing code.

- `src/lib/agent/client.ts`: server-only (`server-only`) client for the Python service, sending `X-API-Key`.
- `src/lib/agent/schema.d.ts`: types generated with `pnpm gen:api` from `openapi/agent.json` (do not edit).
- `src/app/api/agent/*`: route handlers that forward to the agent.
- `src/lib/auth/*`: Sign-In With Solana. `GET /api/auth/nonce` sets a signed HttpOnly nonce cookie; the wallet signs the SIWS message; `POST /api/auth/verify` checks domain/nonce/chain/expiry and the ed25519 signature and sets an 8h HMAC-signed session cookie (`SESSION_SECRET`, fails closed). `POST /api/auth/logout`, `GET /api/auth/session`. Agent routes require a session (401).
- `src/lib/solana/escrow/`: Kit codecs for the `frontier_escrow` program (PDAs, instruction builders, Agreement/Config decoders). Isolated so it can be swapped for a Codama client.
- `POST /api/escrow/release`: server-only. Calls the agent CI/CD endpoint and, only if `attestation_authorized === true` and the echoed ref matches, signs `release_milestone` with `ATTESTOR_SECRET_KEY` and sends it (409 with the verdict otherwise).

See `.env.example` for the required variables. Devnet by default; there is no wallet UI yet.

## Phantom login (SIWS, stateless)

Only a Phantom wallet and `SESSION_SECRET` are needed: no email, database or SOL. The nonce lives in a signed HttpOnly cookie and the session in an HMAC-signed HttpOnly cookie (8h).

| Endpoint | Purpose |
| --- | --- |
| `GET /api/auth/nonce` | Returns `{ nonce }` and sets the signed nonce cookie (5 min). |
| `POST /api/auth/verify` | Body `{ address, message, signature }` (signature base58 or base64 over the exact UTF-8 message). Checks domain, nonce, chain, expiry and the ed25519 signature, then sets the session cookie. |
| `POST /api/auth/logout` | Clears the session cookie. |
| `GET /api/auth/session` | Returns `{ wallet }` or `{ wallet: null }`. |

Client sketch for a future button (message format: `buildSiwsMessage` in `src/lib/auth/siws.ts`):

```ts
const { publicKey } = await window.phantom.solana.connect();
const address = publicKey.toString();
const { nonce } = await (await fetch("/api/auth/nonce")).json();
const now = Date.now();
const message = buildSiwsMessage({
  domain: location.host, address, statement: SIWS_STATEMENT, uri: location.origin,
  chainId: "devnet", nonce,
  issuedAt: new Date(now).toISOString(), expirationTime: new Date(now + 5 * 60_000).toISOString(),
});
const { signature } = await window.phantom.solana.signMessage(new TextEncoder().encode(message), "utf8");
await fetch("/api/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ address, message, signature: btoa(String.fromCharCode(...signature)) }) });
```

`chainId` must equal `NEXT_PUBLIC_SOLANA_CLUSTER` (default `devnet`).
