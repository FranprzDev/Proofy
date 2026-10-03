# Especificación: inicio de sesión con email y contraseña

Estado: **especificado, no implementado.** Documento autocontenido para que otro agente lo implemente sin decisiones abiertas. Complementa el acceso con Phantom (SIWS) ya existente; no lo reemplaza. Contratos de endpoints vigentes: [api-endpoints.md](api-endpoints.md).

## Objetivo

Permitir que una persona se registre e inicie sesión con email y contraseña, obteniendo **la misma cookie de sesión** (`proofy_session`) que el login con Phantom, de modo que todos los endpoints protegidos (`/api/agent/*`, `/api/escrow/*`) funcionen sin cambios.

Regla de producto: **una cuenta de email no puede mover fondos.** Las acciones on-chain (crear, aceptar, fondear, disputar, liberar) requieren una wallet Phantom vinculada a la cuenta. El email da acceso a la plataforma; la wallet autoriza dinero.

## Alcance

Incluye: registro, login, logout, sesión, verificación de email, recuperación de contraseña, vincular wallet Phantom a una cuenta de email.
Excluye: OAuth/social login, 2FA, cambio de email, borrado de cuenta (pendientes).

## Restricciones (no negociables)

- Solo `apps/web` (backend Next.js). **No modificar UI** (páginas, layout, componentes) en esta tarea; solo `src/lib/**`, `src/app/api/**`, docs, `.env.example`.
- TypeScript estricto, ESLint sin warnings, `pnpm lint && pnpm typecheck && pnpm build` en verde.
- Hash de contraseña con **`node:crypto` scrypt** (sin dependencias nativas): `N=2^15, r=8, p=1, keylen=64`, salt aleatorio de 16 bytes, formato almacenado `scrypt$N$r$p$saltB64$hashB64`. Comparación con `timingSafeEqual`.
- Nunca loguear email completo, contraseña, hash ni tokens. Respuestas de error genéricas (no revelar si un email existe).
- Fallar cerrado: sin `SESSION_SECRET` o sin store configurado → `503`.

## Modelo de datos

Persistencia: interfaz `UserStore` en `src/lib/auth/store.ts` con dos implementaciones:
- `MemoryUserStore` (desarrollo y tests; por defecto si `AUTH_STORE=memory`).
- `PostgresUserStore` (producción; `DATABASE_URL`). La elección de ORM queda libre si respeta el esquema.

```sql
create table users (
  id               uuid primary key,
  email            text not null unique,          -- normalizado: trim + lowercase
  password_hash    text not null,                 -- scrypt$N$r$p$salt$hash
  email_verified   boolean not null default false,
  wallet           text unique,                   -- dirección Solana vinculada (nullable)
  failed_logins    int not null default 0,
  locked_until     timestamptz,
  created_at       timestamptz not null default now()
);
create table auth_tokens (                         -- verificación de email y reset de contraseña
  token_hash  text primary key,                    -- sha256(token); el token plano solo viaja por email
  user_id     uuid not null references users(id) on delete cascade,
  purpose     text not null check (purpose in ('verify_email','reset_password')),
  expires_at  timestamptz not null,
  used_at     timestamptz
);
```

```ts
interface UserStore {
  create(u: { email: string; passwordHash: string }): Promise<User>;           // lanza EmailTaken
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  update(id: string, patch: Partial<Omit<User, "id" | "email">>): Promise<void>;
  createToken(t: { userId: string; purpose: Purpose; tokenHash: string; expiresAt: Date }): Promise<void>;
  consumeToken(tokenHash: string, purpose: Purpose): Promise<string | null>;  // userId si válido y no usado
}
```

## Sesión unificada

Extender el payload firmado de `proofy_session` (hoy `{ wallet, exp }`) a:

```ts
type Session = {
  method: "wallet" | "password";
  userId: string | null;   // null en sesiones solo-wallet
  email: string | null;
  wallet: string | null;   // presente si entró con Phantom o si la cuenta tiene wallet vinculada
  exp: number;
};
```

- `getSession()` acepta tokens viejos `{ wallet, exp }` y los mapea a `method: "wallet"` (compatibilidad).
- `GET /api/auth/session` devuelve `{ wallet, email, method }` (agregar campos; `wallet` se mantiene).
- Endpoints que mueven fondos (`/api/escrow/*`) exigen `session.wallet !== null`; si no → `403 { "error": "Wallet required" }`.

## Endpoints

Todos `application/json`, errores `{ "error": string }`. Rate limit por IP y por email (en memoria por defecto): 5 intentos / 15 min en login, 3 / hora en register y forgot.

| Método y ruta | Request | 2xx | Errores |
| --- | --- | --- | --- |
| `POST /api/auth/register` | `{ email, password }` | `201 { "ok": true }` + email de verificación | `400` inválido, `429`. Email existente → también `201` (no revelar) |
| `POST /api/auth/login` | `{ email, password }` | `200 { "email", "wallet" }` + `Set-Cookie: proofy_session` | `401 { "error": "Invalid credentials" }`, `403 { "error": "Email not verified" }`, `423` bloqueada, `429` |
| `POST /api/auth/verify-email` | `{ token }` | `200 { "ok": true }` | `400 { "error": "Invalid or expired token" }` |
| `POST /api/auth/forgot-password` | `{ email }` | `200 { "ok": true }` siempre | `429` |
| `POST /api/auth/reset-password` | `{ token, password }` | `200 { "ok": true }`; invalida sesiones previas | `400` |
| `POST /api/auth/link-wallet` | `{ address, message, signature }` (mismo formato SIWS que `/api/auth/verify`, previo `GET /api/auth/nonce`) | `200 { "wallet" }`; reemite la cookie con `wallet` | `401` sin sesión de email o firma inválida, `409 { "error": "Wallet already linked" }` |
| `POST /api/auth/logout` | — | `200 { "ok": true }` (existente) | — |
| `GET /api/auth/session` | — | `{ "wallet", "email", "method" }` | — |

Reglas de validación:
- `email`: RFC 5322 básico, ≤ 254 caracteres, normalizado (trim + lowercase).
- `password`: 12–128 caracteres; rechazar si es igual al email. No imponer reglas de composición.
- Tokens de verificación/reset: 32 bytes aleatorios en base64url; se guarda solo `sha256`; expiran en 24 h (verify) y 30 min (reset); un solo uso.
- Bloqueo: 10 fallos consecutivos → `locked_until = now + 15 min`; login correcto resetea `failed_logins`.
- Login con email no verificado → `403` (no crea sesión).

Envío de email: interfaz `Mailer` (`src/lib/auth/mailer.ts`) con `ConsoleMailer` (desarrollo: imprime el link con el token **solo** si `NODE_ENV !== "production"`) y un adaptador SMTP/proveedor configurable por env. Links: `${APP_URL}/verify-email?token=...` y `${APP_URL}/reset-password?token=...` (las páginas son trabajo de UI posterior; el endpoint funciona igual).

## Variables de entorno nuevas

| Variable | Uso |
| --- | --- |
| `AUTH_STORE` | `memory` (default) o `postgres`. |
| `DATABASE_URL` | Requerida si `AUTH_STORE=postgres`. |
| `APP_URL` | Base de los links enviados por email. |
| `MAIL_FROM`, `SMTP_URL` | Remitente y transporte; sin `SMTP_URL` se usa `ConsoleMailer` (fuera de producción). |

## Archivos a crear o tocar

```text
apps/web/src/lib/auth/password.ts      hash/verify scrypt (puro, testeable)
apps/web/src/lib/auth/store.ts         UserStore + MemoryUserStore (+ Postgres)
apps/web/src/lib/auth/mailer.ts        Mailer + ConsoleMailer
apps/web/src/lib/auth/rate-limit.ts    ventana deslizante en memoria
apps/web/src/lib/auth/session.ts       payload unificado + compatibilidad
apps/web/src/app/api/auth/{register,login,verify-email,forgot-password,reset-password,link-wallet}/route.ts
apps/web/src/app/api/escrow/release/route.ts   exigir session.wallet
apps/web/.env.example, apps/web/README.md, docs/api-endpoints.md (agregar las rutas)
```

## Criterios de aceptación

1. Registro → email en consola → verify-email → login → cookie `proofy_session` con `method: "password"`.
2. Con esa cookie, `POST /api/agent/document` responde igual que con sesión Phantom.
3. `POST /api/escrow/release` con sesión de email sin wallet → `403 Wallet required`; tras `link-wallet` → pasa a las validaciones on-chain existentes.
4. Contraseña incorrecta → `401` genérico; email inexistente → mismo `401` y tiempo de respuesta comparable (ejecutar scrypt contra un hash dummy).
5. 10 fallos → `423`; reset de contraseña invalida la sesión anterior (incluir `pwdChangedAt` en el payload o versión de sesión).
6. Login Phantom existente sigue funcionando sin cambios (`/api/auth/nonce` + `/api/auth/verify`).
7. Ningún log contiene contraseña, hash, token ni email completo.
8. `pnpm lint --max-warnings 0 && pnpm typecheck && pnpm build` en verde; funciones puras (`password.ts`, `rate-limit.ts`, validaciones) con tests si se agrega runner.

## Prompt sugerido para el agente implementador

> Implementa `docs/auth-email-password.md` en `apps/web` siguiendo exactamente sus restricciones, modelo, endpoints y criterios de aceptación. No modifiques UI. Lee `apps/web/AGENTS.md` y el código actual de `src/lib/auth/**` antes de empezar. Al terminar, actualiza `docs/api-endpoints.md` y reporta comandos ejecutados y resultados.
