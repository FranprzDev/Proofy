# Frontier Agent (Python + LangGraph)

Document and CI/CD agents. See [docs/arquitectura-agentes.md](../../docs/arquitectura-agentes.md) and [ADR 0001](../../docs/adr/0001-agente-python-langgraph.md).

```bash
cp .env.example .env        # fill GOOGLE_API_KEY only to use real Gemini
uv sync
uv run frontier-agent       # FastAPI on :8000 (/docs, /health)
uv run pytest && uv run ruff check . && uv run mypy
uv run python -m frontier_agent.export_openapi openapi.json   # contract for Next.js
```

The LLM is provider-agnostic: `LLM_MODEL=<provider>:<model>` (Gemini by default; others need their `langchain-*` package). It is off by default (`LLM_ENABLED=false`). Agent 1 is a real tool-calling agent and **needs** a model (without one it reports `llm_unavailable`); Agent 2 keeps its static checks without a model. Tests and evals use scripted fake tool-calling models (`frontier_agent.llm.fake`), so they stay offline.

## Agent 1 — document → E2E test plan

A tool-calling agent (specialized system prompt: senior QA engineer for [TesterArmy e2e](https://e2e.tester.army)) that reads a local document (contract/spec) and designs **verbal test cases**: per clause, `objective`, `preconditions`, `steps` (one user goal each, rendered as `agent.act(...)`), `expected_results` (observable conditions, `agent.assert(...)`), optional `test_data` (`params`) and `credentials_role` (passwords never literal). Titles are prefixed with the case id (`TC-001: ...`). It never invents requirements: vague clauses are flagged and non-verifiable ones (payment, legal) go to `out_of_scope`.

Tools: `read_document`, `testerarmy_reference` (bundled TesterArmy docs in `resources/testerarmy/`), `explore_app` (`npx e2e explore`, grounds paths and on-screen wording), `flag_ambiguity`, `submit_test_case` (Pydantic-validated; errors go back to the model), `mark_out_of_scope`, `validate_suite` (structure + `npx e2e list` on the generated file), `dry_run_case` (`npx e2e run --grep`, only with `E2E_ALLOW_RUN=true` because it spends model calls) and `finish` (refused until every clause is accounted for and, with a project, `validate_suite` passed).

```bash
LLM_ENABLED=true E2E_PROJECT_DIR=../../e2e \
  uv run frontier-agent plan examples/contract.md --contract-id demo --out e2e-plan
# → e2e-plan/plan.json + e2e-plan/tests/demo.e2e.ts, then in the app: npx e2e run --reporter list,junit
```

Without `E2E_PROJECT_DIR` the CLI tools answer "TesterArmy project not configured" (never fake success) and the agent works from the document alone. Settings: `AGENT_MAX_ITERATIONS` (40), `E2E_PROJECT_DIR`, `E2E_ALLOW_RUN` (false), `E2E_CLI_TIMEOUT_S` (300).

Exit codes of `plan`: 0 proposal · 2 unreadable file · 3 `needs_clarification` (questions printed, no test cases; pass `--answers FILE` to re-run) · 4 `llm_unavailable` · 5 agent failure.

## Agent 2 — PR review (dynamic + static)

A tool-calling AI reviewer (system prompt in `graphs/cicd/prompts.py`) decides whether a milestone PR meets the agreed contract. It never executes PR code; it reads CI evidence through tools: `get_plan`, `get_clause`, `get_e2e_results` (TesterArmy `report.json`, else `junit.xml`), `get_static_report(tool)`, `get_pr_diff`, `read_changed_file`, `check_indentation`, `record_finding` and `submit_verdict`. Blocking objections cite a clause id (`C1`, `C2`, ...) or are labeled `additional objection`.

- **Dynamic:** was the site tested correctly for this PR: results vs the plan's test ids; failures vs environment/blocked problems (no blame without evidence).
- **Static:** ruff/ESLint/mypy/tsc, formatting, indentation, conventions.
- **No LLM:** `inconclusive` with the note "LLM required for review" (CLI uses the configured model like `plan`).

The payment gate is deterministic and outside the LLM (PR text could inject prompts). `attestation_authorized` is set only when the LLM verdict is `favorable` AND the evidence reference equals the expected one AND the PR head SHA equals the revision AND the E2E report (if `report.json`) was produced for that commit from a clean tree AND every expected test id passed AND at least one real static report (ruff/eslint/mypy/tsc) parsed. Otherwise the verdict is downgraded to `inconclusive` (missing or mismatched evidence) or `needs_fix` (failed tests or blocking static findings), with an observation. It never pays or holds keys. `pr_comment` is a Markdown summary.

```bash
uv run frontier-agent review --milestone m1 --contract-version v1 --sha "$SHA" --pr-number 7 \
  --plan e2e-plan/plan.json --report-json .e2e/report.json --ruff ruff.json --eslint eslint.json \
  --tsc tsc.txt --unformatted unformatted.txt --changed-files changed.txt --diff pr.diff \
  --comment-out comment.md
# exit 0 favorable · 1 needs_fix · 2 inconclusive or unreadable input
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
