# Frontier Agent (Python + LangGraph)

Document and CI/CD agents. See [docs/arquitectura-agentes.md](../../docs/arquitectura-agentes.md) and [ADR 0001](../../docs/adr/0001-agente-python-langgraph.md).

```bash
cp .env.example .env        # fill GOOGLE_API_KEY only to use real Gemini
uv sync
uv run frontier-agent       # FastAPI on :8000 (/docs, /health)
uv run pytest && uv run ruff check . && uv run mypy
uv run python -m frontier_agent.export_openapi openapi.json   # contract for Next.js
```

The LLM is provider-agnostic: `LLM_MODEL=<provider>:<model>` (Gemini by default; others need their `langchain-*` package). It is off by default (`LLM_ENABLED=false`): both graphs then run deterministic heuristics, so tests and evals stay offline. With `LLM_ENABLED=true` the model answers JSON validated by Pydantic; invalid output falls back without crashing.

## Agent 1 — document → E2E test plan

Turns a local document (contract/spec in Markdown or text) into **verbal test cases**: per clause, what is verified (`objective`), `preconditions`, `steps` (user goals) and `expected_results` (observable assertions). It renders them as a [TesterArmy e2e](https://e2e.tester.army) suite: `steps` → `agent.act(...)`, `expected_results` → `agent.assert(...)`, titles prefixed with the case id (`TC-001: ...`) so results map back.

```bash
uv run frontier-agent plan examples/contract.md --contract-id demo --out e2e-plan
# → e2e-plan/plan.json + e2e-plan/tests/demo.e2e.ts, then in the app: npx e2e run --reporter list,junit
```

Ambiguous or incomplete documents end in `needs_clarification` (exit 3) with suggested questions and no test cases; pass `--answers FILE` to re-run. Clauses not verifiable through the app (payment, legal) go to `out_of_scope`.

## Agent 2 — PR review (dynamic + static)

Decides whether a milestone PR may be approved:

- **Dynamic:** TesterArmy `junit.xml` against the expected case ids of the plan and the PR head SHA. A failure → `needs_fix`; skipped, error, missing test or unreachable app → `inconclusive` (no blame without evidence).
- **Static:** ruff JSON, ESLint JSON, mypy, `tsc --noEmit`, unformatted files and an indentation check of changed files. Errors block; warnings are notes. No static evidence → `inconclusive`.
- **Review (optional LLM):** objections over the diff must cite a clause or be marked as an additional objection.

Only `validate_and_authorize` sets `attestation_authorized`, and only when the verdict is favorable and the evidence matches milestone, contract version and revision. It never pays or holds keys. `pr_comment` is a Markdown summary for the provider.

```bash
uv run frontier-agent review --milestone m1 --contract-version v1 --sha "$SHA" --pr-number 7 \
  --plan e2e-plan/plan.json --junit .e2e/junit.xml --ruff ruff.json --eslint eslint.json \
  --tsc tsc.txt --unformatted unformatted.txt --changed-files changed.txt --comment-out comment.md
# exit 0 favorable · 1 needs_fix · 2 inconclusive
```

## Glossary (Spanish docs → code)

| Docs (es) | Code |
| --- | --- |
| agente documental | `document` agent (`/document/*`) |
| hito | `milestone` |
| versión acordada del contrato | `contract_version` |
| inciso | `clause` |
| escenario / caso de prueba / resultado esperado | `test_case` / `expected_results` |
| fuera de alcance | `out_of_scope` |
| hallazgo | `finding` |
| ambigüedad / pregunta sugerida | `ambiguity` / `suggested_question` |
| `necesita_aclaracion` | `needs_clarification` |
| propuesta / pendiente | `proposal` / `pending` |
| favorable / requiere corrección / inconcluso | `favorable` / `needs_fix` / `inconclusive` |
| atestación autorizada | `attestation_authorized` |
| veredicto / análisis / observaciones | `verdict` / `analysis` / `observations` |
