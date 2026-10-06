# Proofy

**From agreed scope to verifiable evidence. From evidence to milestone payments on Solana.**

Proofy connects software contracts, testing, and payments for clients, freelancers, and software development agencies. **Frontier Agent** turns requirements into test scenarios and evaluates deliveries against CI/CD evidence; a Solana escrow program controls the release of funds for each milestone.

The goal is to reduce two risks: delivering without getting paid and paying without receiving the agreed work. Verification happens off-chain; Solana enforces payment rules on-chain.

> **Prototype in development · payment integration limited to devnet · not audited.** This repository does not represent a complete commercial workflow or guarantee software quality, legal validity, or safety for real funds.

[Quick start](#quick-start) · [How it works](#how-it-works) · [Architecture](#architecture) · [Verification](#verification) · [Documentation](#documentation)

## How it works

The product workflow guiding implementation is:

1. **Define the scope.** Both parties provide a governing document specifying modules, deliverables, and acceptance criteria.
2. **Clarify and agree.** The document agent identifies ambiguities and proposes verifiable scenarios. An AI proposal does not replace both parties' consent.
3. **Fund the milestones.** The agreement binds the parties and the contract hash; funds are deposited into the escrow program's vault.
4. **Deliver with evidence.** Each delivery links the contract version, milestone, code revision, and test results.
5. **Evaluate and settle.** The CI/CD agent issues a verdict. Attestation authorization passes deterministic checks before an authorized signer can release payment.

**A PR is not a payable milestone. A green check alone does not prove contractual compliance.** Incomplete evidence, a mismatched revision, or an inconclusive result does not authorize payment.

## Current status

| Component | Implemented in the repository | Current limitation |
| --- | --- | --- |
| Web | Landing page, marketplace, PDF upload and analysis at `/contrato` | Not a complete end-to-end contracting and delivery workflow |
| Authentication | Wallet connection, Sign-In With Solana, and signed sessions | Signing in does not accept a contract or authorize payments |
| Document agent | Requirement analysis, ambiguity detection, and TesterArmy test plans | Requires a configured LLM; output is a proposal |
| CI/CD agent | Dynamic and static evidence review, findings, and authorization checks | Inconclusive without an LLM; does not execute PR code or arbitrate disputes |
| Escrow | Anchor program for native SOL: acceptance, funding, release, and disputes | Up to 8 milestones per agreement; not audited |
| Payment integration | Server endpoint that queries the agent and submits an authorized release | Devnet only; requires on-chain configuration and a server-side signer |
| Automation | Web/agent CI, E2E, and a program workflow | Does not prove deployment or real payments |

Complete bilateral acceptance in the UI, repository onboarding, and integrated commercial operations remain pending. Code in the repository does not confirm an active deployment.

## Architecture

```text
Client / provider
        │ wallet + SIWS session
        ▼
Next.js ─── route handlers ───► Frontier Agent
        │                      Python · FastAPI · LangGraph
        │                      document → test plan
        │                      CI/CD evidence → verdict
        │
        └── server-side signer ► Solana escrow
                                agreement · vault · milestones · disputes

GitHub + TesterArmy ───────────► off-chain evidence
```

- **On-chain:** agreement state, contract commitment, SOL custody, payments, and disputes governed by the program's authorities.
- **Off-chain:** governing document, code, tests, reports, AI review, and files. Solana does not run tests or distribute repositories.
- **Explicit trust assumptions:** an authorized attestor releases milestones and a platform administrator resolves disputes. This is not trustless AI verification running on the blockchain.

| Path | Responsibility |
| --- | --- |
| [`apps/web/`](apps/web/) | Next.js App Router, React, TypeScript, Tailwind, and Solana Kit |
| [`services/agent/`](services/agent/) | Frontier Agent: Python, FastAPI, LangGraph, CLI, and tests |
| [`programs/frontier-escrow/`](programs/frontier-escrow/) | Rust/Anchor, IDL, and LiteSVM tests |
| [`e2e/`](e2e/) | TesterArmy and evidence reports |
| [`apps/intro-video/`](apps/intro-video/) | Remotion presentation, independent of the application |
| [`docs/`](docs/) | Product, architecture, API, and decisions |
| [`.github/workflows/`](.github/workflows/) | CI and E2E |

## Quick start

### Requirements

- Node.js 22+ and the pnpm version specified in each application's `packageManager` field.
- Python 3.12+, `uv`, and `make`.
- Phantom to use authenticated web routes.
- An AI provider API key for real analysis; unit tests use fake models.

Building the program also requires Rust, Solana CLI, and Anchor. CI versions are listed in [the program workflow](.github/workflows/program.yml).

### 1. Install and configure

```bash
git clone https://github.com/FranprzDev/Proofy.git
cd Proofy
make setup
cp services/agent/.env.example services/agent/.env
cp apps/web/.env.example apps/web/.env.local
```

Configure the copied files:

| Variable | File | Purpose |
| --- | --- | --- |
| `AGENT_API_KEY` | Both | Same non-empty key for web server → agent requests |
| `AGENT_API_URL` | Web | `http://localhost:8000` in development |
| `SESSION_SECRET` | Web | Secret of at least 32 characters; generate with `openssl rand -hex 32` |
| `LLM_ENABLED` | Agent | `true` for AI analysis and review; defaults to `false` |
| `LLM_MODEL` | Agent | `<provider>:<model>` available to your account |
| `GOOGLE_API_KEY` | Agent | Google credential when using that provider |

See the complete [web](apps/web/.env.example) and [agent](services/agent/.env.example) examples. Never publish `.env` files or private keys. `AGENT_API_KEY`, `SESSION_SECRET`, and `ATTESTOR_SECRET_KEY` are server-only: never prefix them with `NEXT_PUBLIC_`.

### 2. Start the services

Run these from the repository root in two separate terminals:

```bash
make dev-agent
```

```bash
make dev-web
```

Open `http://localhost:3000`, connect Phantom, and sign the login message. Visit `/contrato` to upload a PDF. The agent exposes `/docs` and `/health` at `http://localhost:8000`.

With `LLM_ENABLED=false`, the document agent reports `llm_unavailable` rather than inventing an evaluation. Signing in does not require SOL; funding agreements and sending transactions require test funds.

### 3. Optional: E2E and devnet payments

- **TesterArmy:** install dependencies in `e2e/`, copy `e2e/.env.example` to `e2e/.env`, and configure `GOOGLE_GENERATIVE_AI_API_KEY`. The agent uses `E2E_PROJECT_DIR` to locate the project; `E2E_ALLOW_RUN=true` enables execution from its tools. Runs may incur model API costs.
- **Escrow:** build and prepare the program and its configuration account following [the program guide](programs/frontier-escrow/README.md). Configure the RPC, program ID, and `ATTESTOR_SECRET_KEY` using a test key authorized as the attestor. Never reuse keys holding real funds.

These steps are additional to `make setup`: starting the web app does not deploy or initialize the program.

## Verification

From the repository root:

```bash
make check                      # lint, types, agent tests, and web build
(cd apps/web && pnpm test)       # web tests, not included in make check
make gen-api                    # regenerate OpenAPI and types after API changes
```

Unit tests do not require real AI keys. For optional suites, with their prerequisites installed:

```bash
anchor build
cargo test -p frontier-escrow    # requires the built .so binary
(cd e2e && pnpm exec playwright install chromium && pnpm test:e2e)
```

CI checks the web app, agent, and OpenAPI consistency. E2E publishes reports and artifacts and requires the corresponding AI secret. The program workflow runs when its relevant paths change.

## Documentation

| Document | Contents |
| --- | --- |
| [Product and rules](docs/proyecto.md) | Vision, governing document, milestones, consent, and decisions (Spanish) |
| [Web architecture](docs/arquitectura-web.md) | Next.js boundaries and responsibilities (Spanish) |
| [Agent architecture](docs/arquitectura-agentes.md) | Document preparation, review, and evidence (Spanish) |
| [API](docs/api-endpoints.md) | Endpoints and integration contracts |
| [Agent guide](services/agent/README.md) | Tools, `plan`/`review` commands, and exit codes |
| [Web guide](apps/web/README.md) | SIWS, server client, and milestone release |
| [Escrow guide](programs/frontier-escrow/README.md) | Accounts, PDAs, instructions, and constraints |
| [Architecture decisions](docs/adr/) | Rationale for technical choices |

Some documents retain proposals and descriptions of earlier stages. Distinguish them from implemented and runtime-verified behavior: this README summarizes published code, not production readiness.

## Contributing

Open a branch and a focused PR with the motivation and checks you ran. For API changes, regenerate OpenAPI and types; for program changes, keep the IDL in sync. Do not include secrets or private contract data.

**License:** the repository has no general license. Do not assume redistribution or commercial-use permissions; dependencies retain their own licenses.
