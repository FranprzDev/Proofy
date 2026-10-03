# Referencia de endpoints

Contratos concretos para consumir la información de la plataforma sin ambigüedad. Hay dos capas:

1. **Next.js (`apps/web`)** — única API que consume el navegador. Autentica con cookie de sesión.
2. **Agente Python (`services/agent`)** — solo lo llama el servidor Next.js (o CI). Autentica con `X-API-Key`.

El navegador **nunca** llama al servicio Python ni ve `AGENT_API_KEY`. Nombres de campos en inglés (ver glosario en [`services/agent/README.md`](../services/agent/README.md)). Tipos TypeScript generados: `apps/web/src/lib/agent/types.ts`; contrato OpenAPI: `apps/web/openapi/agent.json`.

## Convenciones comunes

| Tema | Regla |
| --- | --- |
| Formato | JSON (`Content-Type: application/json`) en request y response. |
| Errores | Siempre `{ "error": "<mensaje>" }`. Nunca se reenvía el cuerpo de error del agente (puede contener datos privados). |
| Sesión | Cookie `proofy_session` (HttpOnly, SameSite=Lax, Secure en producción, 8 h). Desde el navegador basta `fetch(url, { credentials: "same-origin" })`. Desde scripts, reenviar la cookie recibida en `Set-Cookie`. |
| Cluster | `devnet` por defecto (`NEXT_PUBLIC_SOLANA_CLUSTER`). Mainnet no soportado. |
| Falla cerrada | Sin `SESSION_SECRET` → `503` en auth; sin `AGENT_API_KEY`/`AGENT_API_URL` → `503`; sin `ATTESTOR_SECRET_KEY` → `503` en release. |

### Códigos de estado (Next.js)

| Código | Significado |
| --- | --- |
| `200` | OK. |
| `400` | Cuerpo inválido (JSON mal formado o campos faltantes). |
| `401` | Sin sesión válida, firma inválida o API key incorrecta. |
| `403` | Sesión válida pero sin permiso sobre el recurso (p. ej. wallet ajena al acuerdo). |
| `404` | Recurso on-chain inexistente. |
| `409` | Estado no permite la operación (hito no liberable, veredicto no favorable). |
| `422` | El agente rechazó la validación del esquema. |
| `502` | Servicio del agente o RPC inaccesible / error aguas arriba. |
| `503` | Servicio no configurado (variable de entorno faltante). |

## Variables de entorno

| Variable | Dónde | Uso |
| --- | --- | --- |
| `AGENT_API_URL`, `AGENT_API_KEY` | web (server) | URL y clave del servicio Python. |
| `SESSION_SECRET` | web (server) | HMAC de cookies de sesión y nonce (≥ 32 caracteres, `openssl rand -hex 32`). |
| `SIWS_DOMAIN` | web (server, opcional) | Dominio esperado en el mensaje SIWS; por defecto el header `Host`. |
| `ATTESTOR_SECRET_KEY` | web (server) | Keypair del atestador que firma `release_milestone` (base58 o JSON de 64 bytes). Solo devnet. |
| `NEXT_PUBLIC_SOLANA_CLUSTER`, `NEXT_PUBLIC_SOLANA_RPC_URL`, `NEXT_PUBLIC_ESCROW_PROGRAM_ID` | web (público) | Cluster, RPC y program id del escrow. |
| `AGENT_API_KEY`, `LLM_ENABLED`, `LLM_MODEL`, `GITHUB_WEBHOOK_SECRET` | agent | Clave compartida, LLM opcional, firma del webhook. |

---

## 1. Next.js — autenticación

Hoy: **solo Phantom** (Sign-In With Solana), sin base de datos. Login con email y contraseña: especificado en [auth-email-password.md](auth-email-password.md), no implementado.

### `GET /api/auth/nonce`

Emite un nonce de un solo uso (5 min) y lo liga al navegador con la cookie firmada `proofy_nonce`.

```json
// 200
{ "nonce": "kX3v...base64url" }
```

### `POST /api/auth/verify`

```json
// request
{
  "address": "8UnWxh8PSZ3G8TbYBnTnvBJLXtgE1AjN28vTSjmMehFW",
  "message": "<mensaje SIWS exacto que firmó la wallet>",
  "signature": "<64 bytes en base58 o base64>"
}
// 200 → Set-Cookie: proofy_session=...
{ "wallet": "8UnWxh8PSZ3G8TbYBnTnvBJLXtgE1AjN28vTSjmMehFW" }
// 401
{ "error": "Invalid sign-in" }
```

Mensaje (canónico, byte a byte; constructor en `apps/web/src/lib/auth/siws.ts`):

```text
<domain> wants you to sign in with your Solana account:
<address>

Sign in to Proofy. This request does not trigger a transaction or cost any fees.

URI: <origin>
Version: 1
Chain ID: devnet
Nonce: <nonce>
Issued At: <ISO 8601>
Expiration Time: <ISO 8601, máx. 5 min después>
```

Se rechaza si cambia el dominio, la dirección, el chain, el nonce, el statement, si expiró o si la firma ed25519 no verifica.

### `GET /api/auth/session`

```json
{ "wallet": "8UnW...MehFW" }   // con sesión
{ "wallet": null }             // sin sesión
```

### `POST /api/auth/logout`

```json
{ "ok": true }
```

---

## 2. Next.js — agentes (requieren sesión)

Proxies server-side hacia el servicio Python. Mismo cuerpo y respuesta que los endpoints `/document/invoke` y `/cicd/invoke` (sección 4). Errores: `401` sin sesión, `400` JSON inválido, `502` agente inaccesible, `503` agente no configurado.

| Método y ruta | Cuerpo | Respuesta |
| --- | --- | --- |
| `POST /api/agent/document` | `DocumentInput` | `DocumentState` |
| `POST /api/agent/cicd` | `CicdInput` | `CicdState` |

```bash
curl -X POST http://localhost:3000/api/agent/document \
  -H 'Content-Type: application/json' -b 'proofy_session=<cookie>' \
  -d '{"contract_id":"demo","contract_version":"v1","document":"- Users must be able to log in at /login with email and password."}'
```

## 3. Next.js — escrow

### `POST /api/escrow/release` (requiere sesión)

Libera un hito **solo** si el Agente 2 devuelve `attestation_authorized: true` y su referencia coincide con la pedida. La sesión debe ser el cliente o el proveedor del acuerdo. El servidor firma con el atestador; el navegador nunca maneja claves.

```json
// request
{
  "agreement": "<PDA del acuerdo>",
  "index": 0,
  "milestone_id": "m1",
  "contract_version": "v1",
  "revision": "abc123",
  "evidence": {
    "evidence_ref": { "milestone_id": "m1", "contract_version": "v1", "revision": "abc123" },
    "pull_request": { "number": 7, "head_sha": "abc123", "base_sha": "def456", "title": "Login page" },
    "expected_test_ids": ["TC-001"],
    "e2e_junit_xml": "<testsuite>...</testsuite>",
    "e2e_report_json": "{ ...TesterArmy report.json... }",
    "static": { "ruff_json": "[]", "eslint_json": "[]", "tsc_output": "", "unformatted_files": [] }
  }
}
// 200
{ "signature": "<firma de la transacción en devnet>" }
// 409 (no autorizado)
{ "error": "Release not authorized", "verdict": { ... CicdState ... }, "authorized": false, "refMatches": true }
```

`evidence` acepta cualquier campo de `CicdInput` salvo `expected`, que arma el servidor desde `milestone_id`/`contract_version`/`revision`. **Sin reportes estáticos el veredicto es `inconclusive` y no se libera.**

Las demás instrucciones del escrow (crear, aceptar, fondear, disputar) las firma la wallet del usuario; codecs y PDAs en `apps/web/src/lib/solana/escrow/`. Interfaz on-chain: [`programs/frontier-escrow/README.md`](../programs/frontier-escrow/README.md).

---

## 4. Agente Python (`services/agent`, puerto 8000)

Header obligatorio `X-API-Key: <AGENT_API_KEY>` en todo salvo `/health` y el webhook. `401` clave inválida, `503` clave no configurada, `422` esquema inválido. Query opcional `?thread_id=<id>` para retomar un hilo (checkpoint).

| Método y ruta | Cuerpo | Respuesta |
| --- | --- | --- |
| `GET /health` | — | `{ "status": "ok" }` |
| `POST /document/invoke` | `DocumentInput` | `DocumentState` |
| `POST /document/stream` | `DocumentInput` | SSE: eventos `update` (un nodo por evento) y `done` |
| `POST /cicd/invoke` | `CicdInput` | `CicdState` |
| `POST /cicd/stream` | `CicdInput` | SSE |
| `POST /webhooks/github` | evento `workflow_run` | `202 { "status": "accepted", "head_sha": "..." }` (firma `X-Hub-Signature-256`; stub) |

### Agente 1 — `DocumentInput` → `DocumentState`

```json
// request
{
  "contract_id": "demo",
  "contract_version": "v1",
  "document": "- Users must be able to log in at /login with email and password.\n- The client shall pay each invoice within 30 days.",
  "answers": []
}
// 200 (status: proposal)
{
  "contract_id": "demo", "contract_version": "v1", "status": "proposal",
  "clauses": ["Users must be able to log in at /login with email and password.", "The client shall pay each invoice within 30 days."],
  "ambiguities": [],
  "test_cases": [{
    "id": "TC-001",
    "clause": "Users must be able to log in at /login with email and password.",
    "title": "Users must be able to log in at /login with email and password",
    "objective": "Verify that the application meets this requirement: ...",
    "preconditions": [],
    "steps": ["As an end user, exercise this requirement: ..."],
    "expected_results": ["The application behaves as required: ..."],
    "start_path": "/login", "kind": "ui", "priority": "high"
  }],
  "out_of_scope": ["The client shall pay each invoice within 30 days."],
  "e2e_suite": { "tests/demo.e2e.ts": "...", "plan.json": "..." },
  "pending_items": [],
  "accepted_by_client": false, "accepted_by_provider": false
}
```

Documento ambiguo → `status: "needs_clarification"`, sin `test_cases`:

```json
{
  "status": "needs_clarification",
  "ambiguities": [{
    "clause": "Adequate performance, etc.",
    "reason": "Vague or incomplete term: 'Adequate'.",
    "suggested_question": "What measurable condition defines this clause? 'Adequate performance, etc.'"
  }],
  "pending_items": ["What measurable condition defines this clause? 'Adequate performance, etc.'"]
}
```

Reenviar con `answers` (una respuesta por ambigüedad) para obtener la propuesta. `status` ∈ `pending | needs_clarification | proposal`; `kind` ∈ `ui | api`; `priority` ∈ `high | medium | low`.

### Agente 2 — `CicdInput` → `CicdState`

```json
// request
{
  "expected": { "milestone_id": "m1", "contract_version": "v1", "revision": "abc123" },
  "evidence_ref": { "milestone_id": "m1", "contract_version": "v1", "revision": "abc123" },
  "pull_request": {
    "number": 7, "head_sha": "abc123", "base_sha": "def456", "title": "Login page", "diff": "",
    "changed_files": [{ "path": "src/app/login/page.tsx", "content": "export default function P() {\n  return null;\n}\n" }]
  },
  "expected_test_ids": ["TC-001"],
  "e2e_junit_xml": "<testsuite><testcase name=\"TC-001: login\"/></testsuite>",
  "results": [],
  "static": {
    "ruff_json": "[]",
    "eslint_json": "[{\"filePath\":\"/r/src/a.ts\",\"messages\":[{\"ruleId\":\"no-unused-vars\",\"severity\":2,\"message\":\"'x' is defined but never used.\",\"line\":3}]}]",
    "mypy_output": null, "tsc_output": "", "unformatted_files": []
  },
  "clauses": []
}
// 200
{
  "dynamic_verdict": "favorable", "static_verdict": "needs_fix",
  "analysis": "needs_fix", "verdict": "needs_fix", "attestation_authorized": false,
  "findings": [{
    "source": "eslint", "severity": "error", "path": "/r/src/a.ts", "line": 3,
    "rule": "no-unused-vars", "message": "'x' is defined but never used.", "test_id": null, "blocking": true
  }],
  "observations": [],
  "pr_comment": "## Milestone review: Needs fix\n..."
}
```

| Campo | Valores / regla |
| --- | --- |
| `verdict`, `dynamic_verdict`, `static_verdict` | `favorable \| needs_fix \| inconclusive` |
| `findings[].source` | `e2e \| ruff \| eslint \| mypy \| tsc \| format \| indentation \| review` |
| `findings[].severity` | `error` (bloquea) · `warning` · `info` |
| `attestation_authorized` | `true` solo si `verdict = favorable` y `evidence_ref` = `expected` y `pull_request.head_sha` = `expected.revision` |
| Dinámico | fallo → `needs_fix`; skipped/error/test esperado faltante/app inaccesible → `inconclusive` |
| Estático | cualquier `error` → `needs_fix`; ningún reporte → `inconclusive` |

Cómo producir cada reporte en CI: `ruff check --output-format json`, `eslint -f json`, `mypy`, `tsc --noEmit`, `ruff format --check` / `prettier --check` (lista de archivos), TesterArmy `npx e2e run --reporter list,junit` → `.e2e/junit.xml`. La CLI `frontier-agent review` acepta esos archivos directamente.
